'use client';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import useConfigApi, { LLMConfig } from '@/services/config';
import { IconArrowLeft } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { useRouter } from 'next/navigation';

const llmConfigSchema = z.object({
  model: z.string().min(1, {
    message: 'Model name is required.',
  }),
  model_endpoint_type: z
    .enum([
      'openai',
      'anthropic',
      'cohere',
      'google_ai',
      'google_vertex',
      'azure_openai',
      'groq',
      'ollama',
      'webui',
      'webui-legacy',
      'lmstudio',
      'lmstudio-legacy',
      'lmstudio-chatcompletions',
      'llamacpp',
      'koboldcpp',
      'vllm',
      'hugging-face',
      'together',
      'bedrock',
      'deepseek',
      'xai',
      'mistral',
      'llama',
      'mlx-vlm',
    ])
    .optional(),
  model_endpoint: z.string().url().optional().or(z.literal('')),
  mmproj_model: z.string().optional(),
  model_wrapper: z.string().optional(),
  context_window: z.number().min(1, {
    message: 'Context window must be at least 1.',
  }),
  put_inner_thoughts_in_kwargs: z.boolean().optional(),
  handle: z.string().optional(),
  temperature: z.number().min(0).max(2),
  max_tokens: z.number().min(1).optional(),
  enable_reasoner: z.boolean().optional(),
  reasoning_effort: z.enum(['low', 'medium', 'high']).optional(),
  max_reasoning_tokens: z.number().min(0).optional(),
  api_key: z.string().optional(),
  api_version: z.string().optional(),
  azure_endpoint: z.string().url().optional().or(z.literal('')),
  azure_deployment: z.string().optional(),
});

type LLMConfigFormValues = z.infer<typeof llmConfigSchema>;

export default function ModelPage() {
  const configApi = useConfigApi();
  const [llmConfig, setLlmConfig] = useState<LLMConfig>();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();

  const form = useForm<LLMConfigFormValues>({
    resolver: zodResolver(llmConfigSchema),
    mode: 'onChange',
  });

  useEffect(() => {
    configApi.getLLMConfig().then((res) => {
      res.code === 200 && setLlmConfig(res.data);
    });
  }, []);

  async function onSubmit(data: LLMConfigFormValues) {
    setIsLoading(true);
    try {
      const res = await configApi.updateLLMConfig(data as LLMConfig);
      if (res.code === 200) {
        toast({
          title: 'Configuration updated successfully!',
          description: 'LLM configuration has been saved.',
        });
        setLlmConfig(data as LLMConfig);
      } else {
        throw new Error('Failed to update configuration');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update LLM configuration.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className='p-2 flex flex-col gap-2'>
      <header className='flex flex-row gap-2 items-center'>
        <Button size='icon' onClick={() => router.back()}>
          <IconArrowLeft />
        </Button>
        <h3 className='scroll-m-20 text-center text-2xl font-extrabold tracking-tight text-balance'>
          Taxing Laughter: The Joke Tax Chronicles
        </h3>
      </header>

      <Separator />

      <ScrollArea className='flex-1 px-1'>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
            {/* Basic Configuration */}
            <div className='space-y-4'>
              <h4 className='text-lg font-semibold'>Basic Configuration</h4>

              <FormField
                control={form.control}
                name='model'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Model Name</FormLabel>
                    <FormControl>
                      <Input placeholder='gpt-4o' {...field} />
                    </FormControl>
                    <FormDescription>
                      The name of the LLM model to use.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='model_endpoint_type'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Endpoint Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='Select endpoint type' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value='openai'>OpenAI</SelectItem>
                        <SelectItem value='anthropic'>Anthropic</SelectItem>
                        <SelectItem value='azure_openai'>
                          Azure OpenAI
                        </SelectItem>
                        <SelectItem value='groq'>Groq</SelectItem>
                        <SelectItem value='ollama'>Ollama</SelectItem>
                        <SelectItem value='google_ai'>Google AI</SelectItem>
                        <SelectItem value='together'>Together</SelectItem>
                        <SelectItem value='deepseek'>DeepSeek</SelectItem>
                        <SelectItem value='xai'>xAI</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      The endpoint type for the model provider.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='model_endpoint'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Model Endpoint</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='https://api.openai.com/v1'
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      The endpoint URL for the model (optional for some
                      providers).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='context_window'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Context Window</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        placeholder='8192'
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      The context window size for the model in tokens.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Generation Parameters */}
            <div className='space-y-4'>
              <h4 className='text-lg font-semibold'>Generation Parameters</h4>

              <FormField
                control={form.control}
                name='temperature'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Temperature: {field.value}</FormLabel>
                    <FormControl>
                      <Slider
                        min={0}
                        max={2}
                        step={0.1}
                        value={[field.value]}
                        onValueChange={(value) => field.onChange(value[0])}
                        className='w-full'
                      />
                    </FormControl>
                    <FormDescription>
                      Controls randomness in generation. Higher values mean more
                      random outputs.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='max_tokens'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Tokens</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        placeholder='4096'
                        {...field}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? Number(e.target.value) : undefined
                          )
                        }
                      />
                    </FormControl>
                    <FormDescription>
                      Maximum number of tokens to generate.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Advanced Options */}
            <div className='space-y-4'>
              <h4 className='text-lg font-semibold'>Advanced Options</h4>

              <FormField
                control={form.control}
                name='put_inner_thoughts_in_kwargs'
                render={({ field }) => (
                  <FormItem className='flex flex-row items-center justify-between rounded-lg border p-4'>
                    <div className='space-y-0.5'>
                      <FormLabel className='text-base'>
                        Put Inner Thoughts in Kwargs
                      </FormLabel>
                      <FormDescription>
                        Enables better function calling performance by including
                        inner thoughts as kwargs.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='enable_reasoner'
                render={({ field }) => (
                  <FormItem className='flex flex-row items-center justify-between rounded-lg border p-4'>
                    <div className='space-y-0.5'>
                      <FormLabel className='text-base'>
                        Enable Reasoner
                      </FormLabel>
                      <FormDescription>
                        Enable extended thinking for reasoning models (o1,
                        o3-mini).
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {form.watch('enable_reasoner') && (
                <>
                  <FormField
                    control={form.control}
                    name='reasoning_effort'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reasoning Effort</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder='Select reasoning effort' />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value='low'>Low</SelectItem>
                            <SelectItem value='medium'>Medium</SelectItem>
                            <SelectItem value='high'>High</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          The reasoning effort level for reasoning models.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='max_reasoning_tokens'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Reasoning Tokens</FormLabel>
                        <FormControl>
                          <Input
                            type='number'
                            placeholder='0'
                            {...field}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value ? Number(e.target.value) : 0
                              )
                            }
                          />
                        </FormControl>
                        <FormDescription>
                          Maximum tokens for reasoning (minimum 1024 if
                          enabled).
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
            </div>

            {/* Azure Configuration */}
            {form.watch('model_endpoint_type') === 'azure_openai' && (
              <div className='space-y-4'>
                <h4 className='text-lg font-semibold'>Azure Configuration</h4>

                <FormField
                  control={form.control}
                  name='azure_endpoint'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Azure Endpoint</FormLabel>
                      <FormControl>
                        <Input
                          placeholder='https://your-resource.openai.azure.com/'
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Your Azure OpenAI resource endpoint.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='azure_deployment'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Azure Deployment</FormLabel>
                      <FormControl>
                        <Input placeholder='gpt-4-deployment' {...field} />
                      </FormControl>
                      <FormDescription>
                        The deployment name in Azure OpenAI.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='api_version'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>API Version</FormLabel>
                      <FormControl>
                        <Input placeholder='2024-10-01-preview' {...field} />
                      </FormControl>
                      <FormDescription>
                        The Azure OpenAI API version.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* API Key */}
            <div className='space-y-4'>
              <h4 className='text-lg font-semibold'>Authentication</h4>

              <FormField
                control={form.control}
                name='api_key'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>API Key</FormLabel>
                    <FormControl>
                      <Input
                        type='password'
                        placeholder='Enter API key (optional)'
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Custom API key for this model configuration. Leave empty
                      to use global settings.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className='flex gap-2 pt-4'>
              <Button type='submit' disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Save Configuration'}
              </Button>
              <Button
                type='button'
                variant='outline'
                onClick={() => form.reset(llmConfig)}
              >
                Reset
              </Button>
            </div>
          </form>
        </Form>
      </ScrollArea>
    </div>
  );
}
