'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { AgentState, AgentType } from '@/services/agents';
import { DataTableColumnHeader } from './data-table-column-header';
import { DataTableRowActions } from './data-table-row-actions';
import { formatDistanceToNow } from 'date-fns';

const getAgentTypeColor = (type: AgentType) => {
  switch (type) {
    case AgentType.CHAT_AGENT:
      return 'bg-blue-100 text-blue-800';
    case AgentType.CODER_AGENT:
      return 'bg-green-100 text-green-800';
    case AgentType.REFLEXION_AGENT:
      return 'bg-purple-100 text-purple-800';
    case AgentType.BACKGROUND_AGENT:
      return 'bg-gray-100 text-gray-800';
    case AgentType.EPISODIC_MEMORY_AGENT:
      return 'bg-orange-100 text-orange-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const useColumns = (): ColumnDef<AgentState>[] => [
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Name' />
    ),
    cell: ({ row }) => {
      const agent = row.original;
      return (
        <div className='flex items-center space-x-3'>
          <Avatar className='h-8 w-8'>
            <AvatarFallback className='text-xs'>
              {agent.name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className='font-medium'>{agent.name}</div>
            {agent.description && (
              <div className='text-sm text-muted-foreground line-clamp-1'>
                {agent.description}
              </div>
            )}
          </div>
        </div>
      );
    },
    enableSorting: true,
    enableHiding: false,
  },
  {
    accessorKey: 'agent_type',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Type' />
    ),
    cell: ({ row }) => {
      const type = row.getValue('agent_type') as AgentType;
      return (
        <Badge className={getAgentTypeColor(type)}>
          {type.replace('_', ' ').toUpperCase()}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: 'tags',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Tags' />
    ),
    cell: ({ row }) => {
      const tags = row.getValue('tags') as string[];
      if (!tags || tags.length === 0) return null;

      return (
        <div className='flex flex-wrap gap-1'>
          {tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant='outline' className='text-xs'>
              {tag}
            </Badge>
          ))}
          {tags.length > 3 && (
            <Badge variant='outline' className='text-xs'>
              +{tags.length - 3}
            </Badge>
          )}
        </div>
      );
    },
    filterFn: (row, id, value) => {
      const tags = row.getValue(id) as string[];
      return value.some((tag: string) => tags?.includes(tag));
    },
  },
  {
    accessorKey: 'system',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='System' />
    ),
    cell: ({ row }) => {
      const system = row.getValue('system') as string;
      return (
        <div className='max-w-[200px] truncate text-sm text-muted-foreground'>
          {system}
        </div>
      );
    },
  },
  {
    accessorKey: 'tools',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Tools' />
    ),
    cell: ({ row }) => {
      const tools = row.original.tools;
      return (
        <div className='text-sm text-muted-foreground'>
          {tools?.length || 0} tools
        </div>
      );
    },
  },
  {
    accessorKey: 'updated_at',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Updated' />
    ),
    cell: ({ row }) => {
      const date = row.getValue('updated_at') as string;
      if (!date) return null;

      return (
        <div className='text-sm text-muted-foreground'>
          {formatDistanceToNow(new Date(date), { addSuffix: true })}
        </div>
      );
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
];

export default useColumns;
