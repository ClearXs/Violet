'use client';

import { Button } from '@/components/ui/button';
import useConfigApi, { WhisperConfig } from '@/services/config';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import ContentSection from './components/content-section';
import { Loader2, Save, TestTube, Mic, FileAudio } from 'lucide-react';
import { toast } from 'sonner';
import { debounce } from 'lodash';

const whisperConfigSchema = z.object({
  model: z.string().min(1, {
    message: 'Model path is required.',
  }),
  engine: z.literal('whisper'),
  endpoint: z.string().optional().nullable(),
  api_key: z.string().optional().nullable(),
});

type WhisperConfigFormValues = z.infer<typeof whisperConfigSchema>;

export default function SettingsWhisper() {
  const configApi = useConfigApi();
  const [whisperConfig, setWhisperConfig] = useState<WhisperConfig>();
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  const form = useForm<WhisperConfigFormValues>({
    resolver: zodResolver(whisperConfigSchema),
    mode: 'onChange',
    values: whisperConfig,
  });

  useEffect(() => {
    configApi
      .getWhisperConfig()
      .then((data) => setWhisperConfig(data))
      .catch((error) =>
        toast.error(`Failed Load Whisper Configuration. ${error}`)
      );
  }, []);

  async function onSubmit(data: WhisperConfigFormValues) {
    setIsLoading(true);
    try {
      const success = await configApi.updateWhisperConfig(
        data as WhisperConfig
      );
      if (success) {
        toast.success('Configuration updated successfully!');
        setWhisperConfig(data as WhisperConfig);
      } else {
        throw new Error('Failed to update configuration');
      }
    } catch (error) {
      toast.error(`Failed to update Whisper configuration. ${error}`);
    } finally {
      setIsLoading(false);
    }
  }

  const loadPreset = (preset: Partial<WhisperConfig>) => {
    form.setValue('model', preset.model || '');
    form.setValue('engine', preset.engine || 'whisper');
    form.setValue('endpoint', preset.endpoint || '');
    form.setValue('api_key', preset.api_key || '');
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    try {
      // Mock test - replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 2000));
      toast.success('Connection successful!');
    } catch (error) {
      toast.error(`Connection failed: ${error}`);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <ContentSection
      title='Whisper ASR'
      desc='Configure Whisper Automatic Speech Recognition settings for audio transcription.'
      operation={
        <>
          <Button
            disabled={isLoading}
            onClick={debounce(form.handleSubmit(onSubmit), 500)}
          >
            {isLoading ? (
              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
            ) : (
              <Save />
            )}
            Save & Changes
          </Button>
          <Button
            type='button'
            variant='outline'
            onClick={() => form.reset(whisperConfig)}
          >
            Reset
          </Button>
        </>
      }
    >
      <ScrollArea className='flex-1 px-4'>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
            {/* Engine Field (Hidden but required) */}
            <FormField
              control={form.control}
              name='engine'
              render={({ field }) => (
                <input type='hidden' {...field} value='whisper' />
              )}
            />

            {/* Quick Presets */}
            <div className='space-y-4'>
              <h4 className='text-lg font-semibold'>Quick Presets</h4>
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => {
                    loadPreset({
                      model: 'model/whisper',
                      engine: 'whisper',
                      endpoint: undefined,
                      api_key: undefined,
                    });
                  }}
                >
                  <FileAudio className='mr-2 h-4 w-4' />
                  Local Base Model
                </Button>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => {
                    loadPreset({
                      model: 'model/whisper-large',
                      engine: 'whisper',
                      endpoint: undefined,
                      api_key: undefined,
                    });
                  }}
                >
                  <FileAudio className='mr-2 h-4 w-4' />
                  Local Large Model
                </Button>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => {
                    loadPreset({
                      model: 'whisper-1',
                      engine: 'whisper',
                      endpoint:
                        'https://api.openai.com/v1/audio/transcriptions',
                      api_key: '',
                    });
                  }}
                >
                  <Mic className='mr-2 h-4 w-4' />
                  OpenAI API
                </Button>
              </div>
              <FormDescription>
                Click on a preset to quickly configure common Whisper setups.
              </FormDescription>
            </div>

            {/* Model Configuration */}
            <div className='space-y-4'>
              <h4 className='text-lg font-semibold'>Model Configuration</h4>

              <FormField
                control={form.control}
                name='model'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Model</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='model/whisper or whisper-1'
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Local model path (e.g., model/whisper-base) or API model
                      name (e.g., whisper-1).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='endpoint'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>API Endpoint (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='https://api.openai.com/v1/audio/transcriptions'
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Leave empty for local models. Set for external API
                      services.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='api_key'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>API Key (Optional)</FormLabel>
                    <FormControl>
                      <Input type='password' placeholder='sk-...' {...field} />
                    </FormControl>
                    <FormDescription>
                      Required only when using external API services.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {form.watch('endpoint') && (
                <div className='flex gap-2'>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={handleTestConnection}
                    disabled={isTesting}
                  >
                    {isTesting ? (
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    ) : (
                      <TestTube className='mr-2 h-4 w-4' />
                    )}
                    Test Connection
                  </Button>
                </div>
              )}
            </div>
          </form>
        </Form>
      </ScrollArea>
    </ContentSection>
  );
}
