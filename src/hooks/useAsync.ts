import { useCallback, useEffect, useRef, useState } from "react";

export type AsyncStatus = "idle" | "loading" | "success" | "error";

export type UseAsyncState<T> = {
  data: T | undefined;
  error: Error | undefined;
  status: AsyncStatus;
  isLoading: boolean;
};

export type UseAsyncOptions = {
  /** Run automatically on mount and whenever `deps` change. Default true. */
  immediate?: boolean;
  /** Dependencies that re-trigger the automatic run. */
  deps?: readonly unknown[];
};

export type UseAsyncResult<T, Args extends unknown[]> = UseAsyncState<T> & {
  /** Runs the task. Resolves with the data, or undefined if failed/stale. */
  run: (...args: Args) => Promise<T | undefined>;
  /** Re-runs the task with the arguments of the last call. */
  retry: () => Promise<T | undefined>;
  /** Aborts in-flight work and returns to the idle state. */
  reset: () => void;
};

const toError = (value: unknown): Error =>
  value instanceof Error ? value : new Error(typeof value === "string" ? value : "Unknown error");

/**
 * Tracks an async function's loading / error / data state.
 *
 * Stale responses are ignored: only the most recent `run` may update state,
 * and the `AbortSignal` passed to the task is aborted when it is superseded
 * or the component unmounts.
 *
 * @example
 * const { data, isLoading, error, retry } = useAsync(
 *   (signal) => fetch("/api/items", { signal }).then((r) => r.json())
 * );
 */
export function useAsync<T, Args extends unknown[] = []>(
  task: (signal: AbortSignal, ...args: Args) => Promise<T>,
  options: UseAsyncOptions = {}
): UseAsyncResult<T, Args> {
  const { immediate = true, deps = [] } = options;
  const [state, setState] = useState<UseAsyncState<T>>({
    data: undefined,
    error: undefined,
    status: immediate ? "loading" : "idle",
    isLoading: immediate
  });

  const taskRef = useRef(task);
  const controllerRef = useRef<AbortController | null>(null);
  const lastArgsRef = useRef<Args>([] as unknown as Args);
  const callIdRef = useRef(0);

  useEffect(() => {
    taskRef.current = task;
  });

  const run = useCallback(async (...args: Args): Promise<T | undefined> => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    const callId = ++callIdRef.current;
    lastArgsRef.current = args;

    setState((prev) => ({ ...prev, error: undefined, status: "loading", isLoading: true }));

    try {
      const data = await taskRef.current(controller.signal, ...args);
      if (callId !== callIdRef.current) {
        return undefined;
      }
      setState({ data, error: undefined, status: "success", isLoading: false });
      return data;
    } catch (caught) {
      if (callId !== callIdRef.current || controller.signal.aborted) {
        return undefined;
      }
      setState((prev) => ({ ...prev, error: toError(caught), status: "error", isLoading: false }));
      return undefined;
    }
  }, []);

  const retry = useCallback(() => run(...lastArgsRef.current), [run]);

  const reset = useCallback(() => {
    controllerRef.current?.abort();
    callIdRef.current += 1;
    setState({ data: undefined, error: undefined, status: "idle", isLoading: false });
  }, []);

  useEffect(() => {
    if (immediate) {
      void run(...([] as unknown as Args));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [immediate, run, ...deps]);

  useEffect(() => () => controllerRef.current?.abort(), []);

  return { ...state, run, retry, reset };
}
