'use client';

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
import ContentSection from './components/content-section';
import { Separator } from '@/components/ui/separator';
import useConfigStore from '@/store/config';
import PathInput from '@/components/path-input';

const violetConfigSchema = z.object({
  base_path: z.string().min(1, {
    message: 'Base path is required.',
  }),
  preset: z.string().min(1, {
    message: 'Preset is required.',
  }),
  persona: z.string().min(1, {
    message: 'Default persona is required.',
  }),
  human: z.string().min(1, {
    message: 'Default human is required.',
  }),
  model_storage_path: z.string().min(1, {
    message: 'Model storage path is required.',
  }),
  file_storage_path: z.string().min(1, {
    message: 'File storage path is required.',
  }),
  image_storage_path: z.string().min(1, {
    message: 'Image storage path is required.',
  }),
  persona_path: z.string().min(1, {
    message: 'Persona path is required.',
  }),
  prompts_path: z.string().min(1, {
    message: 'Prompts path is required.',
  }),
  tmp_dir: z.string().min(1, {
    message: 'Temporary directory path is required.',
  }),
  archival_storage_type: z.enum(['sqlite', 'local', 'db']),
  archival_storage_path: z.string().min(1, {
    message: 'Archival storage path is required.',
  }),
  archival_storage_uri: z.string().nullable().optional(),
  recall_storage_type: z.enum(['sqlite', 'local', 'db']),
  recall_storage_path: z.string().min(1, {
    message: 'Recall storage path is required.',
  }),
  recall_storage_uri: z.string().nullable().optional(),
  metadata_storage_type: z.enum(['sqlite', 'local', 'db']),
  metadata_storage_path: z.string().min(1, {
    message: 'Metadata storage path is required.',
  }),
  metadata_storage_uri: z.string().nullable().optional(),
  persistence_manager_type: z.enum(['in-memory', 'db']).nullable().optional(),
  persistence_manager_save_file: z.string().nullable().optional(),
  persistence_manager_uri: z.string().nullable().optional(),
  policies_accepted: z.boolean(),
  core_memory_persona_char_limit: z.number().min(1, {
    message: 'Persona character limit must be at least 1.',
  }),
  core_memory_human_char_limit: z.number().min(1, {
    message: 'Human character limit must be at least 1.',
  }),
});

type VioletConfigFormValues = z.infer<typeof violetConfigSchema>;

export default function SettingsSystem() {
  const { system } = useConfigStore();

  const form = useForm<VioletConfigFormValues>({
    resolver: zodResolver(violetConfigSchema),
    mode: 'onChange',
    values: system || {
      base_path: '',
      preset: 'default',
      persona: 'sam',
      human: 'user',
      model_storage_path: '',
      file_storage_path: '',
      image_storage_path: '',
      persona_path: '',
      prompts_path: '',
      tmp_dir: '',
      archival_storage_type: 'sqlite',
      archival_storage_path: '',
      archival_storage_uri: null,
      recall_storage_type: 'sqlite',
      recall_storage_path: '',
      recall_storage_uri: null,
      metadata_storage_type: 'sqlite',
      metadata_storage_path: '',
      metadata_storage_uri: null,
      persistence_manager_type: null,
      persistence_manager_save_file: null,
      persistence_manager_uri: null,
      policies_accepted: false,
      core_memory_persona_char_limit: 2000,
      core_memory_human_char_limit: 2000,
    },
  });

  return (
    <ContentSection
      title='System Configuration'
      desc='Configure core Violet system settings including paths, storage options, defaults, and memory limits for the AI agent system.'
    >
      <ScrollArea className='flex-1 px-4'>
        <Form {...form}>
          <form className='space-y-6'>
            {/* System Information */}
            <div className='space-y-3'>
              <h3 className='text-lg font-semibold'>System Information</h3>
              <p className='text-sm text-muted-foreground'>
                Current system configuration and version information.
              </p>
              <div className='grid grid-cols-2 gap-4 text-sm p-4 bg-muted/30 rounded-lg'>
                <div>
                  <span className='font-medium'>Violet Version:</span>
                  <p className='text-muted-foreground'>
                    {system?.violet_version || 'Unknown'}
                  </p>
                </div>
                <div>
                  <span className='font-medium'>Policies Status:</span>
                  <p className='text-muted-foreground'>
                    {system?.policies_accepted ? 'Accepted' : 'Not Accepted'}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            <div className='space-y-4'>
              <div>
                <h3 className='text-lg font-semibold'>Basic Settings</h3>
                <p className='text-sm text-muted-foreground'>
                  Core system configuration and default values.
                </p>
              </div>

              <FormField
                control={form.control}
                name='base_path'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Base Path</FormLabel>
                    <FormControl>
                      <PathInput
                        value={field.value}
                        onChange={field.onChange}
                        placeholder='/path/to/violet'
                        disabled
                      />
                    </FormControl>
                    <FormDescription>
                      The base directory where Violet stores all its data.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className='grid grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='preset'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Default Preset</FormLabel>
                      <FormControl>
                        <Input disabled placeholder='default' {...field} />
                      </FormControl>
                      <FormDescription>
                        Default system prompt preset.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='persona'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Default Persona</FormLabel>
                      <FormControl>
                        <Input placeholder='sam' disabled {...field} />
                      </FormControl>
                      <FormDescription>
                        Default AI agent persona.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='human'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Default Human</FormLabel>
                      <FormControl>
                        <Input placeholder='user' {...field} />
                      </FormControl>
                      <FormDescription>
                        Default human user name.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='policies_accepted'
                  render={({ field }) => (
                    <FormItem className='flex flex-row items-center justify-between space-y-0 rounded-lg border p-3'>
                      <div className='space-y-0.5'>
                        <FormLabel className='text-sm font-medium'>
                          Policies Accepted
                        </FormLabel>
                        <FormDescription className='text-xs'>
                          Terms and privacy policies acceptance status.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/*          Paths */}
            <div className='space-y-4'>
              <div>
                <h3 className='text-lg font-semibold'>Storage Paths</h3>
                <p className='text-sm text-muted-foreground'>
                  Configure directories for different types of data storage.
                </p>
              </div>

              <FormField
                control={form.control}
                name='model_storage_path'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Model Storage Path</FormLabel>
                    <FormControl>
                      <PathInput
                        value={field.value}
                        onChange={field.onChange}
                        disabled
                        placeholder='/path/to/models'
                      />
                    </FormControl>
                    <FormDescription>
                      Directory for storing AI models.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='file_storage_path'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>File Storage Path</FormLabel>
                    <FormControl>
                      <PathInput
                        value={field.value}
                        onChange={field.onChange}
                        placeholder='/path/to/files'
                        disabled
                      />
                    </FormControl>
                    <FormDescription>
                      Directory for storing general files.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='image_storage_path'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image Storage Path</FormLabel>
                    <FormControl>
                      <PathInput
                        value={field.value}
                        onChange={field.onChange}
                        placeholder='/path/to/images'
                        disabled
                      />
                    </FormControl>
                    <FormDescription>
                      Directory for storing images.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className='grid grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='persona_path'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Persona Path</FormLabel>
                      <FormControl>
                        <PathInput
                          value={field.value}
                          onChange={field.onChange}
                          placeholder='/path/to/personas'
                          disabled
                        />
                      </FormControl>
                      <FormDescription>
                        Directory for persona assets.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='prompts_path'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prompts Path</FormLabel>
                      <FormControl>
                        <PathInput
                          value={field.value}
                          onChange={field.onChange}
                          placeholder='/path/to/prompts'
                          disabled
                        />
                      </FormControl>
                      <FormDescription>
                        Directory for prompt templates.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name='tmp_dir'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Temporary Directory</FormLabel>
                    <FormControl>
                      <PathInput
                        value={field.value}
                        onChange={field.onChange}
                        placeholder='/path/to/tmp'
                        disabled
                      />
                    </FormControl>
                    <FormDescription>
                      Directory for temporary files.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Database Storage */}
            <div className='space-y-6'>
              <div>
                <h3 className='text-lg font-semibold'>
                  Database Storage Configuration
                </h3>
                <p className='text-sm text-muted-foreground'>
                  Configure storage backends for different data types.
                </p>
              </div>

              {/* Archival Storage */}
              <div className='space-y-4'>
                <h4 className='text-sm font-semibold'>Archival Storage</h4>
                <div className='grid grid-cols-2 gap-4'>
                  <FormField
                    control={form.control}
                    name='archival_storage_type'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Storage Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder='Select storage type' />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value='sqlite'>SQLite</SelectItem>
                            <SelectItem value='local'>Local</SelectItem>
                            <SelectItem value='db'>Database</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='archival_storage_path'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Storage Path</FormLabel>
                        <FormControl>
                          <PathInput
                            value={field.value}
                            onChange={field.onChange}
                            placeholder='/path/to/archival'
                            disabled
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name='archival_storage_uri'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Storage URI (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder='postgresql://user:pass@host:port/db'
                          {...field}
                          value={field.value || ''}
                          disabled
                        />
                      </FormControl>
                      <FormDescription>
                        Database URI for external archival storage.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              {/* Recall Storage */}
              <div className='space-y-4'>
                <h4 className='text-sm font-semibold'>Recall Storage</h4>
                <div className='grid grid-cols-2 gap-4'>
                  <FormField
                    control={form.control}
                    name='recall_storage_type'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Storage Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder='Select storage type' />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value='sqlite'>SQLite</SelectItem>
                            <SelectItem value='local'>Local</SelectItem>
                            <SelectItem value='db'>Database</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='recall_storage_path'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Storage Path</FormLabel>
                        <FormControl>
                          <PathInput
                            value={field.value}
                            onChange={field.onChange}
                            placeholder='/path/to/recall'
                            disabled
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name='recall_storage_uri'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Storage URI (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder='postgresql://user:pass@host:port/db'
                          {...field}
                          value={field.value || ''}
                          disabled
                        />
                      </FormControl>
                      <FormDescription>
                        Database URI for external recall storage.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              {/* Metadata Storage */}
              <div className='space-y-4'>
                <h4 className='text-sm font-semibold'>Metadata Storage</h4>
                <div className='grid grid-cols-2 gap-4'>
                  <FormField
                    control={form.control}
                    name='metadata_storage_type'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Storage Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder='Select storage type' />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value='sqlite'>SQLite</SelectItem>
                            <SelectItem value='local'>Local</SelectItem>
                            <SelectItem value='db'>Database</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='metadata_storage_path'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Storage Path</FormLabel>
                        <FormControl>
                          <PathInput
                            value={field.value}
                            onChange={field.onChange}
                            placeholder='/path/to/metadata'
                            disabled
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name='metadata_storage_uri'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Storage URI (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder='postgresql://user:pass@host:port/db'
                          {...field}
                          value={field.value || ''}
                          disabled
                        />
                      </FormControl>
                      <FormDescription>
                        Database URI for external metadata storage.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* Persistence Manager */}
            <div className='space-y-4'>
              <div>
                <h3 className='text-lg font-semibold'>Persistence Manager</h3>
                <p className='text-sm text-muted-foreground'>
                  Configure how agent state is persisted and managed.
                </p>
              </div>

              <FormField
                control={form.control}
                name='persistence_manager_type'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Manager Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || ''}
                      disabled
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='Select persistence type' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value='in-memory'>In-Memory</SelectItem>
                        <SelectItem value='db'>Database</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      How agent state is persisted between sessions.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='persistence_manager_save_file'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Save File (Optional)</FormLabel>
                    <FormControl>
                      <PathInput
                        value={field.value}
                        onChange={field.onChange}
                        placeholder='/path/to/save/file'
                        disabled
                      />
                    </FormControl>
                    <FormDescription>
                      Local file for saving persistence data.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='persistence_manager_uri'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Manager URI (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='postgresql://user:pass@host:port/db'
                        {...field}
                        value={field.value || ''}
                        disabled
                      />
                    </FormControl>
                    <FormDescription>
                      Database URI for persistence manager.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Memory Limits */}
            <div className='space-y-4'>
              <div>
                <h3 className='text-lg font-semibold'>Memory Limits</h3>
                <p className='text-sm text-muted-foreground'>
                  Configure character limits for core memory components.
                </p>
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='core_memory_persona_char_limit'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Persona Memory Limit</FormLabel>
                      <FormControl>
                        <Input
                          type='number'
                          placeholder='2000'
                          {...field}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
                          }
                          disabled
                        />
                      </FormControl>
                      <FormDescription>
                        Max characters in persona core memory.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='core_memory_human_char_limit'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Human Memory Limit</FormLabel>
                      <FormControl>
                        <Input
                          type='number'
                          placeholder='2000'
                          {...field}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
                          }
                          disabled
                        />
                      </FormControl>
                      <FormDescription>
                        Max characters in human core memory.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </form>
        </Form>
      </ScrollArea>
    </ContentSection>
  );
}
