'use client';

import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import useAgentApi, {
  AgentType,
  CreateAgent,
  UpdateAgent,
} from '@/services/agents';
import useAgentStore from '../store';
import { useEffect } from 'react';
import { toast } from 'sonner';

const agentFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name too long'),
  description: z.string().optional(),
  agent_type: z.nativeEnum(AgentType),
  system: z.string().min(1, 'System message is required'),
  topic: z.string().optional(),
  tags: z.string().optional(),
});

type AgentFormValues = z.infer<typeof agentFormSchema>;

export default function AgentMutateDrawer() {
  const agentApi = useAgentApi();

  const createDialogOpen = useAgentStore((state) => state.createDialogOpen);
  const editDialogOpen = useAgentStore((state) => state.editDialogOpen);
  const setCreateDialogOpen = useAgentStore(
    (state) => state.setCreateDialogOpen
  );
  const setEditDialogOpen = useAgentStore((state) => state.setEditDialogOpen);
  const selectedAgent = useAgentStore((state) => state.selectedAgent);
  const refresh = useAgentStore((state) => state.refresh);

  const isOpen = createDialogOpen || editDialogOpen;
  const isEdit = editDialogOpen && selectedAgent;

  const form = useForm<AgentFormValues>({
    resolver: zodResolver(agentFormSchema),
    defaultValues: {
      name: '',
      description: '',
      agent_type: AgentType.CHAT_AGENT,
      system: 'You are a helpful assistant.',
      topic: '',
      tags: '',
    },
  });

  useEffect(() => {
    if (isEdit) {
      form.reset({
        name: selectedAgent.name,
        description: selectedAgent.description || '',
        agent_type: selectedAgent.agent_type,
        system: selectedAgent.system,
        topic: selectedAgent.topic || '',
        tags: selectedAgent.tags?.join(', ') || '',
      });
    } else {
      form.reset({
        name: '',
        description: '',
        agent_type: AgentType.CHAT_AGENT,
        system: 'You are a helpful assistant.',
        topic: '',
        tags: '',
      });
    }
  }, [isEdit, selectedAgent, form]);

  const onSubmit = async (data: AgentFormValues) => {
    try {
      const agentData = {
        ...data,
        tags: data.tags
          ? data.tags
              .split(',')
              .map((tag) => tag.trim())
              .filter(Boolean)
          : [],
      };

      let res;
      if (isEdit) {
        const updateData: UpdateAgent = agentData;
        res = await agentApi.updateAgent(selectedAgent.id!, updateData);
      } else {
        const createData: CreateAgent = {
          ...agentData,
          include_base_tools: true,
        };
        res = await agentApi.createAgent(createData);
      }

      if (res.code === 200) {
        toast.success(`Agent ${isEdit ? 'updated' : 'created'} successfully`);
        refresh();
        handleClose();
      } else {
        throw new Error(
          res.msg || `Failed to ${isEdit ? 'update' : 'create'} agent`
        );
      }
    } catch (error: any) {
      toast.error(
        error.message || `Failed to ${isEdit ? 'update' : 'create'} agent`
      );
    }
  };

  const handleClose = () => {
    setCreateDialogOpen(false);
    setEditDialogOpen(false);
    form.reset();
  };

  return (
    <Drawer open={isOpen} onOpenChange={handleClose}>
      <DrawerContent className='max-h-[90vh]'>
        <DrawerHeader>
          <DrawerTitle>
            {isEdit ? 'Edit Agent' : 'Create New Agent'}
          </DrawerTitle>
          <DrawerDescription>
            {isEdit
              ? 'Update agent configuration'
              : 'Configure your new AI agent'}
          </DrawerDescription>
        </DrawerHeader>

        <div className='px-4 overflow-y-auto flex-1'>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
              <FormField
                control={form.control}
                name='name'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder='My Assistant' {...field} />
                    </FormControl>
                    <FormDescription>
                      A unique name for your agent
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='description'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Describe what this agent does...'
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Optional description of the agent's purpose
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='agent_type'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Agent Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='Select agent type' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={AgentType.CHAT_AGENT}>
                          Chat Agent
                        </SelectItem>
                        <SelectItem value={AgentType.CODER_AGENT}>
                          Coder Agent
                        </SelectItem>
                        <SelectItem value={AgentType.REFLEXION_AGENT}>
                          Reflexion Agent
                        </SelectItem>
                        <SelectItem value={AgentType.BACKGROUND_AGENT}>
                          Background Agent
                        </SelectItem>
                        <SelectItem value={AgentType.EPISODIC_MEMORY_AGENT}>
                          Episodic Memory Agent
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      The type determines the agent's behavior and capabilities
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='system'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>System Message</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder='You are a helpful assistant that...'
                        className='resize-none'
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      The system message that defines the agent's behavior
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='topic'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Topic</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='General conversation, coding help, etc.'
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Optional topic or domain focus for the agent
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='tags'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='helper, coding, creative (comma-separated)'
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Comma-separated tags to organize your agents
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>

        <DrawerFooter>
          <Button onClick={form.handleSubmit(onSubmit)}>
            {isEdit ? 'Update Agent' : 'Create Agent'}
          </Button>
          <DrawerClose asChild>
            <Button variant='outline'>Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
