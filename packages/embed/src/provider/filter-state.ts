import { create } from 'zustand'
import type { FilterValue } from '@duck_ui/core'

export interface FilterStore {
  filters: Record<string, FilterValue>
  filterVersion: number
  setFilter: (column: string, value: FilterValue) => void
  clearFilters: () => void
}

export const createFilterStore = () =>
  create<FilterStore>((set) => ({
    filters: {},
    filterVersion: 0,
    setFilter: (column, value) =>
      set((state) => ({
        filters: { ...state.filters, [column]: value },
        filterVersion: state.filterVersion + 1,
      })),
    clearFilters: () =>
      set({ filters: {}, filterVersion: 0 }),
  }))
