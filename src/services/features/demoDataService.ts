import { api } from "../api/client";
import { invalidateEmployees } from "./employeesService";
import { invalidateAttendance } from "./attendanceService";

export const DEMO_MIN_COUNT = 1;
export const DEMO_MAX_COUNT = 1000;
export const DEMO_EMAIL_DOMAIN = "demo.staffhub.local";

export type DemoLoadResult = {
  message: string;
  employees: number;
  attendanceRecords: number;
};

export type DemoRemoveResult = {
  message: string;
};

type Listener = (state: DemoDataState) => void;

export type DemoDataState = {
  busy: boolean;
  lastAction: "load" | "remove" | null;
  lastMessage: string;
  lastError: string;
  updatedAt: number | null;
};

let state: DemoDataState = { busy: false, lastAction: null, lastMessage: "", lastError: "", updatedAt: null };
const listeners = new Set<Listener>();

function setState(next: Partial<DemoDataState>) {
  state = { ...state, ...next };
  listeners.forEach((listener) => listener(state));
}

export function getDemoState(): DemoDataState {
  return state;
}

/** Subscribe to state changes; returns an unsubscribe function. */
export function subscribeDemoState(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function clampDemoCount(value: number): number {
  const whole = Math.floor(Number(value) || 0);
  return Math.min(DEMO_MAX_COUNT, Math.max(DEMO_MIN_COUNT, whole));
}

export function isDemoEmail(email: string): boolean {
  return email.trim().toLowerCase().endsWith(`@${DEMO_EMAIL_DOMAIN}`);
}

/** Pulls "Loaded N demo employees with M attendance records" apart; zeros if the format differs. */
export function parseLoadMessage(message: string): Pick<DemoLoadResult, "employees" | "attendanceRecords"> {
  const match = message.match(/Loaded\s+(\d+)\s+demo employees with\s+(\d+)\s+attendance/i);
  return { employees: match ? Number(match[1]) : 0, attendanceRecords: match ? Number(match[2]) : 0 };
}

async function track<T extends { message: string }>(action: "load" | "remove", run: () => Promise<T>): Promise<T> {
  if (state.busy) {
    throw new Error("A demo data operation is already running");
  }
  setState({ busy: true, lastAction: action, lastError: "" });
  try {
    const result = await run();
    invalidateEmployees();
    invalidateAttendance();
    setState({ busy: false, lastMessage: result.message, updatedAt: Date.now() });
    return result;
  } catch (error) {
    setState({ busy: false, lastError: error instanceof Error ? error.message : "Demo data request failed" });
    throw error;
  }
}

/** POST /demo-data: seeds employees plus ~30 days of weekday attendance (admin only). */
export function loadDemoData(count: number): Promise<DemoLoadResult> {
  return track("load", async () => {
    const res = await api<{ message: string }>("/demo-data", {
      method: "POST",
      body: JSON.stringify({ count: clampDemoCount(count) })
    });
    return { ...res, ...parseLoadMessage(res.message) };
  });
}

/** DELETE /demo-data: removes only rows whose email ends with the demo domain (admin only). */
export function removeDemoData(): Promise<DemoRemoveResult> {
  return track("remove", () => api<DemoRemoveResult>("/demo-data", { method: "DELETE" }));
}

/** Convenience for "reset": clears existing demo rows, then seeds a fresh set. */
export async function resetDemoData(count: number): Promise<DemoLoadResult> {
  await removeDemoData();
  return loadDemoData(count);
}
