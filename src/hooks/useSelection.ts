import { useCallback, useMemo, useRef, useState } from "react";

export type UseSelectionResult<K> = {
  /** Currently selected ids. */
  selected: ReadonlySet<K>;
  count: number;
  isSelected: (id: K) => boolean;
  select: (id: K) => void;
  deselect: (id: K) => void;
  toggle: (id: K) => void;
  /**
   * Selects every item between the last toggled/selected item and `id`
   * (shift-click behaviour). Falls back to a plain toggle with no anchor.
   */
  selectRange: (id: K) => void;
  /** Selects all ids (replaces the current selection). */
  selectAll: () => void;
  clear: () => void;
  /** Toggles all: clears if everything is selected, otherwise selects all. */
  toggleAll: () => void;
  allSelected: boolean;
  /** True when some, but not all, items are selected (checkbox indeterminate). */
  someSelected: boolean;
  /**
   * Convenience click handler: pass the mouse/keyboard event so shift-click
   * triggers range selection automatically.
   */
  handleClick: (id: K, event?: { shiftKey?: boolean }) => void;
};

/**
 * Multi-select state over an ordered list of ids, with shift-range support.
 * Selected ids that disappear from `orderedIds` are ignored in derived values.
 *
 * @example
 * const sel = useSelection(rows.map((row) => row.id));
 * <input type="checkbox" checked={sel.isSelected(row.id)}
 *   onClick={(e) => sel.handleClick(row.id, e)} readOnly />
 */
export function useSelection<K extends string | number>(
  orderedIds: readonly K[]
): UseSelectionResult<K> {
  const [selected, setSelected] = useState<ReadonlySet<K>>(() => new Set<K>());
  const anchorRef = useRef<K | null>(null);

  const visibleSelected = useMemo(() => {
    const ids = new Set(orderedIds);
    return new Set([...selected].filter((id) => ids.has(id)));
  }, [orderedIds, selected]);

  const update = useCallback((mutate: (draft: Set<K>) => void) => {
    setSelected((current) => {
      const draft = new Set(current);
      mutate(draft);
      return draft;
    });
  }, []);

  const select = useCallback(
    (id: K) => {
      anchorRef.current = id;
      update((draft) => draft.add(id));
    },
    [update]
  );

  const deselect = useCallback(
    (id: K) => {
      anchorRef.current = id;
      update((draft) => draft.delete(id));
    },
    [update]
  );

  const toggle = useCallback(
    (id: K) => {
      anchorRef.current = id;
      update((draft) => {
        if (!draft.delete(id)) {
          draft.add(id);
        }
      });
    },
    [update]
  );

  const selectRange = useCallback(
    (id: K) => {
      const anchor = anchorRef.current;
      const from = anchor === null ? -1 : orderedIds.indexOf(anchor);
      const to = orderedIds.indexOf(id);
      if (from === -1 || to === -1) {
        toggle(id);
        return;
      }
      const [start, end] = from < to ? [from, to] : [to, from];
      update((draft) => orderedIds.slice(start, end + 1).forEach((rangeId) => draft.add(rangeId)));
    },
    [orderedIds, toggle, update]
  );

  const selectAll = useCallback(() => setSelected(new Set(orderedIds)), [orderedIds]);
  const clear = useCallback(() => {
    anchorRef.current = null;
    setSelected(new Set<K>());
  }, []);

  const count = visibleSelected.size;
  const allSelected = orderedIds.length > 0 && count === orderedIds.length;

  const toggleAll = useCallback(() => (allSelected ? clear() : selectAll()), [allSelected, clear, selectAll]);

  const handleClick = useCallback(
    (id: K, event?: { shiftKey?: boolean }) => (event?.shiftKey ? selectRange(id) : toggle(id)),
    [selectRange, toggle]
  );

  return {
    selected: visibleSelected,
    count,
    isSelected: (id) => visibleSelected.has(id),
    select,
    deselect,
    toggle,
    selectRange,
    selectAll,
    clear,
    toggleAll,
    allSelected,
    someSelected: count > 0 && !allSelected,
    handleClick
  };
}
