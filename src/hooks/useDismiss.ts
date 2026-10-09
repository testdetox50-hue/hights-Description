import { useEffect, useRef, type RefObject } from "react";

export type KeyboardShortcutOptions = {
  /** Listen only while true. Default true. */
  enabled?: boolean;
  /** Call preventDefault() when the shortcut matches. Default true. */
  preventDefault?: boolean;
  /** Fire even when focus is inside an input/textarea/select/contentEditable. Default false. */
  allowInInputs?: boolean;
};

const isEditable = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
};

/**
 * Checks a combo like "Escape", "ctrl+k", "meta+shift+p" against an event.
 * "mod" matches Ctrl on Windows/Linux and Cmd on macOS.
 */
export function matchesShortcut(combo: string, event: KeyboardEvent): boolean {
  const parts = combo.toLowerCase().split("+").map((part) => part.trim());
  const key = parts.pop() ?? "";
  const wants = (name: string) => parts.includes(name);
  const mod = wants("mod");
  const ctrl = wants("ctrl") || (mod && !event.metaKey);
  const meta = wants("meta") || (mod && event.metaKey);

  return (
    event.key.toLowerCase() === key &&
    event.ctrlKey === (ctrl || (mod && event.ctrlKey)) &&
    event.metaKey === meta &&
    event.shiftKey === wants("shift") &&
    event.altKey === wants("alt")
  );
}

/**
 * Runs `handler` when the given key combo is pressed on the document.
 *
 * @example
 * useKeyboardShortcut("mod+k", () => setPaletteOpen(true));
 */
export function useKeyboardShortcut(
  combo: string,
  handler: (event: KeyboardEvent) => void,
  { enabled = true, preventDefault = true, allowInInputs = false }: KeyboardShortcutOptions = {}
): void {
  const handlerRef = useRef(handler);

  useEffect(() => {
    handlerRef.current = handler;
  });

  useEffect(() => {
    if (!enabled) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (!allowInInputs && isEditable(event.target)) {
        return;
      }
      if (matchesShortcut(combo, event)) {
        if (preventDefault) {
          event.preventDefault();
        }
        handlerRef.current(event);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [combo, enabled, preventDefault, allowInInputs]);
}

/** Calls `handler` on pointer-down outside every given element. */
export function useClickOutside(
  refs: RefObject<HTMLElement | null> | RefObject<HTMLElement | null>[],
  handler: (event: MouseEvent | TouchEvent) => void,
  enabled = true
): void {
  const handlerRef = useRef(handler);
  const refsRef = useRef(refs);

  useEffect(() => {
    handlerRef.current = handler;
    refsRef.current = refs;
  });

  useEffect(() => {
    if (!enabled) {
      return;
    }
    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const list = Array.isArray(refsRef.current) ? refsRef.current : [refsRef.current];
      const target = event.target as Node | null;
      if (target && list.some((ref) => ref.current?.contains(target))) {
        return;
      }
      handlerRef.current(event);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
    };
  }, [enabled]);
}

/**
 * Dismisses a popover/modal/menu on outside click or Escape.
 *
 * @example
 * const ref = useRef<HTMLDivElement>(null);
 * useDismiss(ref, () => setOpen(false), open);
 */
export function useDismiss(
  ref: RefObject<HTMLElement | null> | RefObject<HTMLElement | null>[],
  onDismiss: () => void,
  enabled = true
): void {
  useClickOutside(ref, onDismiss, enabled);
  useKeyboardShortcut("escape", onDismiss, { enabled, allowInInputs: true, preventDefault: false });
}
