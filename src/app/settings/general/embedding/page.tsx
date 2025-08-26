'use client';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import useConfigApi, { EmbeddingConfig } from '@/services/config';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { useRouter } from 'next/navigation';

const embeddingConfigSchema = z.object({
  embedding_endpoint_type: z.enum([
    'openai',
    'anthropic',
    'bedrock',
    'cohere',
    'google_ai',
    'azure',
    'groq',
    'ollama',
    'webui',
    'webui-legacy',
    'lmstudio',
    'lmstudio-legacy',
    'llamacpp',
    'koboldcpp',
    'vllm',
    'hugging-face',
    'mistral',
    'together',
    'llama',
  ]),
  embedding_endpoint: z.string().url().optional().or(z.literal('')),
  embedding_model: z.string().min(1, {
    message: 'Embedding model name is required.',
  }),
  embedding_dim: z.number().min(1, {
    message: 'Embedding dimension must be at least 1.',
  }),
  embedding_chunk_size: z.number().min(1).optional(),
  handle: z.string().optional(),
  azure_endpoint: z.string().url().optional().or(z.literal('')),
  azure_version: z.string().optional(),
  azure_deployment: z.string().optional(),
});

type EmbeddingConfigFormValues = z.infer<typeof embeddingConfigSchema>;

export default function EmbeddingPage() {
  const configApi = useConfigApi();
  const [embeddingConfig, setEmbeddingConfig] = useState<EmbeddingConfig>();
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<EmbeddingConfigFormValues>({
    resolver: zodResolver(embeddingConfigSchema),
    mode: 'onChange',
  });

  useEffect(() => {
    configApi.getEmbeddingConfig().then((res) => {
      if (res.code === 200) {
        setEmbeddingConfig(res.data);
        form.reset(res.data);
      }
    });
  }, []);

  async function onSubmit(data: EmbeddingConfigFormValues) {
    setIsLoading(true);
    try {
      const res = await configApi.updateEmbeddingConfig(
        data as EmbeddingConfig
      );
      if (res.code === 200) {
        toast({
          title: 'Configuration updated successfully!',
          description: 'Embedding configuration has been saved.',
        });
        setEmbeddingConfig(data as EmbeddingConfig);
      } else {
        throw new Error('Failed to update configuration');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update embedding configuration.',
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
          Embedding Model Configuration
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
                name='embedding_model'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Embedding Model Name</FormLabel>
                    <FormControl>
                      <Input placeholder='text-embedding-3-small' {...field} />
                    </FormControl>
                    <FormDescription>
                      The name of the embedding model to use.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='embedding_endpoint_type'
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
                        <SelectItem value='azure'>Azure OpenAI</SelectItem>
                        <SelectItem value='google_ai'>Google AI</SelectItem>
                        <SelectItem value='cohere'>Cohere</SelectItem>
                        <SelectItem value='hugging-face'>
                          Hugging Face
                        </SelectItem>
                        <SelectItem value='ollama'>Ollama</SelectItem>
                        <SelectItem value='together'>Together</SelectItem>
                        <SelectItem value='bedrock'>AWS Bedrock</SelectItem>
                        <SelectItem value='anthropic'>Anthropic</SelectItem>
                        <SelectItem value='groq'>Groq</SelectItem>
                        <SelectItem value='mistral'>Mistral</SelectItem>
                        <SelectItem value='llama'>Llama</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      The endpoint type for the embedding model provider.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='embedding_endpoint'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Embedding Endpoint</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='https://api.openai.com/v1'
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      The endpoint URL for the embedding model (optional for
                      local models).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='embedding_dim'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Embedding Dimension</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        placeholder='1536'
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      The dimension of the embedding vectors.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='embedding_chunk_size'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Chunk Size</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        placeholder='300'
                        {...field}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? Number(e.target.value) : undefined
                          )
                        }
                      />
                    </FormControl>
                    <FormDescription>
                      The chunk size for text processing before embedding.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='handle'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Handle</FormLabel>
                    <FormControl>
                      <Input placeholder='provider/model-name' {...field} />
                    </FormControl>
                    <FormDescription>
                      The handle for this config, in the format
                      provider/model-name.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Azure Configuration */}
            {form.watch('embedding_endpoint_type') === 'azure' && (
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
                        <Input
                          placeholder='text-embedding-deployment'
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        The deployment name in Azure OpenAI for embedding model.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='azure_version'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Azure API Version</FormLabel>
                      <FormControl>
                        <Input placeholder='2024-02-01' {...field} />
                      </FormControl>
                      <FormDescription>
                        The Azure OpenAI API version for embedding.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Model Presets */}
            <div className='space-y-4'>
              <h4 className='text-lg font-semibold'>Quick Presets</h4>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-2'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => {
                    form.setValue('embedding_model', 'text-embedding-3-small');
                    form.setValue('embedding_endpoint_type', 'openai');
                    form.setValue(
                      'embedding_endpoint',
                      'https://api.openai.com/v1'
                    );
                    form.setValue('embedding_dim', 1536);
                    form.setValue('embedding_chunk_size', 8191);
                  }}
                >
                  OpenAI text-embedding-3-small
                </Button>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => {
                    form.setValue('embedding_model', 'text-embedding-004');
                    form.setValue('embedding_endpoint_type', 'google_ai');
                    form.setValue(
                      'embedding_endpoint',
                      'https://generativelanguage.googleapis.com'
                    );
                    form.setValue('embedding_dim', 768);
                    form.setValue('embedding_chunk_size', 2048);
                  }}
                >
                  Google text-embedding-004
                </Button>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => {
                    form.setValue('embedding_model', 'BAAI/bge-large-en-v1.5');
                    form.setValue('embedding_endpoint_type', 'hugging-face');
                    form.setValue(
                      'embedding_endpoint',
                      'https://embeddings.memgpt.ai'
                    );
                    form.setValue('embedding_dim', 1024);
                    form.setValue('embedding_chunk_size', 300);
                  }}
                >
                  Violet BGE Large
                </Button>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => {
                    form.setValue('embedding_model', 'nomic-embed-text');
                    form.setValue('embedding_endpoint_type', 'ollama');
                    form.setValue('embedding_endpoint', '');
                    form.setValue('embedding_dim', 768);
                    form.setValue('embedding_chunk_size', 512);
                  }}
                >
                  Ollama Nomic Embed
                </Button>
              </div>
              <FormDescription>
                Click on a preset to quickly configure common embedding models.
              </FormDescription>
            </div>

            <div className='flex gap-2 pt-4'>
              <Button type='submit' disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Save Configuration'}
              </Button>
              <Button
                type='button'
                variant='outline'
                onClick={() => form.reset(embeddingConfig)}
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
