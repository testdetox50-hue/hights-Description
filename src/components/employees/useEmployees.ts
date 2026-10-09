"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { api } from "@/src/services/api/client";

import {
  EMPTY_FILTERS,
  filterEmployees,
  getUniqueRoles,
  normalizeEmployees,
  sortEmployees,
  type Employee,
  type EmployeeFilterState,
  type SortKey
} from "./employeeTypes";

type EmployeesResponse = { items?: unknown };

export type UseEmployeesResult = {
  employees: Employee[];
  visible: Employee[];
  roles: string[];
  filters: EmployeeFilterState;
  setFilters: (next: EmployeeFilterState) => void;
  sortKey: SortKey;
  setSortKey: (key: SortKey) => void;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  remove: (id: string) => Promise<boolean>;
};

export function useEmployees(): UseEmployeesResult {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filters, setFilters] = useState<EmployeeFilterState>(EMPTY_FILTERS);
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await api<EmployeesResponse>("/employees");
      if (mounted.current) {
        setEmployees(normalizeEmployees(data.items));
      }
    } catch (caught) {
      if (mounted.current) {
        setEmployees([]);
        setError(caught instanceof Error ? caught.message : "Failed to load employees");
      }
    } finally {
      if (mounted.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    void reload();
    return () => {
      mounted.current = false;
    };
  }, [reload]);

  const remove = useCallback(
    async (id: string) => {
      try {
        await api<{ message: string }>(`/employees/${encodeURIComponent(id)}`, { method: "DELETE" });
        await reload();
        return true;
      } catch (caught) {
        if (mounted.current) {
          setError(caught instanceof Error ? caught.message : "Failed to delete employee");
        }
        return false;
      }
    },
    [reload]
  );

  const roles = useMemo(() => getUniqueRoles(employees), [employees]);
  const visible = useMemo(
    () => sortEmployees(filterEmployees(employees, filters), sortKey),
    [employees, filters, sortKey]
  );

  return { employees, visible, roles, filters, setFilters, sortKey, setSortKey, loading, error, reload, remove };
}
