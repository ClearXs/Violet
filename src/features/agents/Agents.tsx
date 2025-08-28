'use client';

import { DataTable } from './components/data-table';
import React, { useEffect } from 'react';
import useColumns from './components/columns';
import useAgentStore from './store';
import useAgentApi from '@/services/agents';
import { Filter } from '@/services/type';
import AgentPrimaryButtons from './components/agent-primary-buttons';
import AgentDialogs from './components/agent-dialogs';
import { toast } from 'sonner';

type AgentTableProps = {
  tags?: string[];
};

export default function AgentTable({ tags }: AgentTableProps) {
  const columns = useColumns();

  const agentApi = useAgentApi();

  const pagination = useAgentStore((state) => state.pagination);
  const columnFilters = useAgentStore((state) => state.columnFilters);
  const sorting = useAgentStore((state) => state.sorting);
  const data = useAgentStore((state) => state.data);

  const setData = useAgentStore((state) => state.setData);
  const setTotal = useAgentStore((state) => state.setTotal);
  const setLoading = useAgentStore((state) => state.setLoading);

  const total = useAgentStore((state) => state.total);
  const refreshCount = useAgentStore((state) => state.refreshCount);

  useEffect(() => {
    setLoading(true);
    const filters: Filter[] = [...columnFilters];

    // Convert table filters to agent list params
    const searchParams: any = {
      limit: pagination.pageSize,
      tags: tags,
    };

    // Add query text from filters if exists
    const nameFilter = filters.find((f) => f.id === 'name');
    if (nameFilter) {
      searchParams.query_text = nameFilter.value;
    }

    agentApi
      .listAgents(searchParams)
      .then((res) => {
        if (res.code === 200) {
          // Simulate pagination for now
          const startIndex = pagination.pageIndex * pagination.pageSize;
          const endIndex = startIndex + pagination.pageSize;
          const paginatedData = res.data.slice(startIndex, endIndex);

          setData(paginatedData);
          setTotal(res.data.length);
        } else {
          toast.error(`Failed to load agents`);
        }
      })
      .catch((err) => toast.error(err.message || 'Failed to load agents'))
      .finally(() => setLoading(false));
  }, [
    pagination.pageIndex,
    pagination.pageSize,
    sorting,
    columnFilters,
    refreshCount,
    tags,
  ]);

  return (
    <>
      <div className='mb-2 flex flex-wrap items-center justify-between space-y-2'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>Agents</h2>
          <p className='text-muted-foreground'>
            Here&apos;s all your AI agents and their configurations
          </p>
        </div>
        <AgentPrimaryButtons />
      </div>
      <div className='flex-1 overflow-auto py-1 lg:flex-row lg:space-x-12 lg:space-y-0'>
        <DataTable data={data} total={total} columns={columns} />
      </div>
      <AgentDialogs />
    </>
  );
}
