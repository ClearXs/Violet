'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import useAgentApi from '@/services/agents';
import useAgentStore from '../store';
import AgentMutateDrawer from './agent-mutate-drawer';
import { toast } from 'sonner';

export default function AgentDialogs() {
  const agentApi = useAgentApi();

  const deleteDialogOpen = useAgentStore((state) => state.deleteDialogOpen);
  const setDeleteDialogOpen = useAgentStore(
    (state) => state.setDeleteDialogOpen
  );
  const selectedAgent = useAgentStore((state) => state.selectedAgent);
  const refresh = useAgentStore((state) => state.refresh);

  const handleDelete = async () => {
    if (!selectedAgent?.id) return;

    try {
      const res = await agentApi.deleteAgent(selectedAgent.id);
      if (res.code === 200) {
        toast.success('Agent deleted successfully');
        refresh();
        setDeleteDialogOpen(false);
      } else {
        throw new Error(res.msg || 'Failed to delete agent');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete agent');
    }
  };

  return (
    <>
      <AgentMutateDrawer />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Agent</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedAgent?.name}"? This
              action cannot be undone. All associated data including
              conversations and memory will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
