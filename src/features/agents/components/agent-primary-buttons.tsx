'use client';

import { Button } from '@/components/ui/button';
import { Plus, RefreshCw } from 'lucide-react';
import useAgentStore from '../store';

export default function AgentPrimaryButtons() {
  const setCreateDialogOpen = useAgentStore(
    (state) => state.setCreateDialogOpen
  );
  const refresh = useAgentStore((state) => state.refresh);
  const loading = useAgentStore((state) => state.loading);

  return (
    <div className='flex items-center space-x-2'>
      <Button variant='outline' size='sm' onClick={refresh} disabled={loading}>
        <RefreshCw
          className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`}
        />
        Refresh
      </Button>
      <Button size='sm' onClick={() => setCreateDialogOpen(true)}>
        <Plus className='h-4 w-4 mr-2' />
        New Agent
      </Button>
    </div>
  );
}
