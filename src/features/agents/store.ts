import { create } from 'zustand';
import {
  ColumnFiltersState,
  OnChangeFn,
  PaginationState,
  SortingState,
} from '@tanstack/react-table';
import { AgentState } from '@/services/agents';

interface AgentStore {
  // Data
  data: AgentState[];
  total: number;
  loading: boolean;

  // Table state
  pagination: PaginationState;
  columnFilters: ColumnFiltersState;
  sorting: SortingState;

  // UI state
  refreshCount: number;

  // Dialog state
  createDialogOpen: boolean;
  editDialogOpen: boolean;
  deleteDialogOpen: boolean;
  selectedAgent: AgentState | null;

  // Actions
  setData: (data: AgentState[]) => void;
  setTotal: (total: number) => void;
  setLoading: (loading: boolean) => void;
  setSorting: OnChangeFn<SortingState>;
  setColumnFilters: OnChangeFn<ColumnFiltersState>;
  setPagination: OnChangeFn<PaginationState>;
  refresh: () => void;

  // Dialog actions
  setCreateDialogOpen: (open: boolean) => void;
  setEditDialogOpen: (open: boolean) => void;
  setDeleteDialogOpen: (open: boolean) => void;
  setSelectedAgent: (agent: AgentState | null) => void;
}

const useAgentStore = create<AgentStore>((set) => ({
  data: [],
  total: 0,
  loading: false,
  pagination: { pageIndex: 0, pageSize: 10 },
  columnFilters: [],
  sorting: [],
  refreshCount: 0,

  // Dialog state
  createDialogOpen: false,
  editDialogOpen: false,
  deleteDialogOpen: false,
  selectedAgent: null,

  // Actions
  setData: (data) => set({ data }),
  setTotal: (total) => set({ total }),
  setLoading: (loading) => set({ loading }),
  setSorting: (update) => set((state) => ({ sorting: update(state.sorting) })),
  setColumnFilters: (update) =>
    set((state) => ({ columnFilters: update(state.columnFilters) })),
  setPagination: (update) =>
    set((state) => ({ pagination: update(state.pagination) })),

  refresh: () =>
    set((state) => {
      state.refreshCount += 1;
    }),

  // Dialog actions
  setCreateDialogOpen: (open) =>
    set((state) => {
      state.createDialogOpen = open;
    }),
  setEditDialogOpen: (open) =>
    set((state) => {
      state.editDialogOpen = open;
    }),
  setDeleteDialogOpen: (open) =>
    set((state) => {
      state.deleteDialogOpen = open;
    }),
  setSelectedAgent: (agent) =>
    set((state) => {
      state.selectedAgent = agent;
    }),
}));

export default useAgentStore;
