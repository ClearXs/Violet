'use client';

import { Button } from '@/components/ui/button';
import useConfigApi, {
  TTSConfig,
  TTSVersionConfig,
  TTSVersion,
} from '@/services/config';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ContentSection from './components/content-section';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { debounce } from 'lodash';

const ttsVersionConfigSchema = z.object({
  bert_base_path: z.string().min(1, {
    message: 'BERT base path is required.',
  }),
  cnhuhbert_base_path: z.string().min(1, {
    message: 'Chinese HuBERT base path is required.',
  }),
  device: z.string().min(1, {
    message: 'Device is required.',
  }),
  is_half: z.boolean(),
  t2s_weights_path: z.string().min(1, {
    message: 'T2S weights path is required.',
  }),
  version: z.string().min(1, {
    message: 'Version is required.',
  }),
  vits_weights_path: z.string().min(1, {
    message: 'VITS weights path is required.',
  }),
});

const ttsConfigSchema = z.object({
  custom: ttsVersionConfigSchema,
  v1: ttsVersionConfigSchema,
  v2: ttsVersionConfigSchema,
  v3: ttsVersionConfigSchema,
  v4: ttsVersionConfigSchema,
});

type TTSConfigFormValues = z.infer<typeof ttsConfigSchema>;

export default function SettingsTTS() {
  const configApi = useConfigApi();
  const [ttsConfig, setTtsConfig] = useState<TTSConfig>();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TTSVersion>('custom');

  const form = useForm<TTSConfigFormValues>({
    resolver: zodResolver(ttsConfigSchema),
    mode: 'onChange',
    values: ttsConfig,
  });

  useEffect(() => {
    configApi.getTTSConfig().then((data) => setTtsConfig(data));
  }, []);

  async function onSubmit(data: TTSConfigFormValues) {
    setIsLoading(true);
    try {
      const success = await configApi.updateTTSConfig(data as TTSConfig);
      if (success) {
        toast.success('Configuration updated successfully!');
        setTtsConfig(data as TTSConfig);
      } else {
        throw new Error('Failed to update configuration');
      }
    } catch (error) {
      toast.error(`Failed to update TTS configuration. ${error}`);
    } finally {
      setIsLoading(false);
    }
  }

  const renderVersionForm = (version: TTSVersion) => (
    <div className='space-y-4'>
      <FormField
        control={form.control}
        name={`${version}.version`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Version</FormLabel>
            <FormControl>
              <Input placeholder={version} {...field} />
            </FormControl>
            <FormDescription>
              Version identifier for this TTS configuration.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name={`${version}.device`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Device</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder='Select device' />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value='cpu'>CPU</SelectItem>
                <SelectItem value='cuda'>CUDA (GPU)</SelectItem>
              </SelectContent>
            </Select>
            <FormDescription>Device to run TTS inference on.</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name={`${version}.is_half`}
        render={({ field }) => (
          <FormItem className='flex flex-row items-center justify-between rounded-lg border p-4'>
            <div className='space-y-0.5'>
              <FormLabel className='text-base'>Half Precision</FormLabel>
              <FormDescription>
                Use half precision (FP16) for faster inference with lower memory
                usage.
              </FormDescription>
            </div>
            <FormControl>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name={`${version}.bert_base_path`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>BERT Base Path</FormLabel>
            <FormControl>
              <Input
                placeholder='GPT_SoVITS/chinese-roberta-wwm-ext-large'
                {...field}
              />
            </FormControl>
            <FormDescription>
              Path to the BERT model for text processing.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name={`${version}.cnhuhbert_base_path`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Chinese HuBERT Base Path</FormLabel>
            <FormControl>
              <Input placeholder='GPT_SoVITS/chinese-hubert-base' {...field} />
            </FormControl>
            <FormDescription>
              Path to the Chinese HuBERT model for audio processing.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name={`${version}.t2s_weights_path`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>T2S Weights Path</FormLabel>
            <FormControl>
              <Input
                placeholder='GPT_SoVITS/s1bert25hz-2kh-longer-epoch=68e-step=50232.ckpt'
                {...field}
              />
            </FormControl>
            <FormDescription>
              Path to the Text-to-Speech model weights.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name={`${version}.vits_weights_path`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>VITS Weights Path</FormLabel>
            <FormControl>
              <Input placeholder='GPT_SoVITS/s2G488k.pth' {...field} />
            </FormControl>
            <FormDescription>
              Path to the VITS vocoder model weights.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );

  const loadPreset = (
    targetVersion: TTSVersion,
    presetData: Partial<TTSVersionConfig>
  ) => {
    const currentData = form.getValues(`${targetVersion}`);
    form.setValue(`${targetVersion}`, {
      ...currentData,
      ...presetData,
    });
  };

  return (
    <ContentSection
      title='TTS'
      desc='This is how others will see you on the site.'
      operation={
        <>
          <Button
            onClick={debounce(form.handleSubmit(onSubmit), 500)}
            disabled={isLoading}
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
            onClick={() => form.reset(ttsConfig)}
          >
            Reset
          </Button>
        </>
      }
    >
      <ScrollArea className='flex-1 px-4'>
        <Form {...form}>
          <form className='space-y-6'>
            {/* Quick Presets */}
            <div className='space-y-4'>
              <h4 className='text-lg font-semibold'>Quick Presets</h4>
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-2'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() =>
                    loadPreset(activeTab, {
                      device: 'cpu',
                      is_half: false,
                      bert_base_path:
                        'GPT_SoVITS/chinese-roberta-wwm-ext-large',
                      cnhuhbert_base_path: 'GPT_SoVITS/chinese-hubert-base',
                    })
                  }
                >
                  CPU Preset
                </Button>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() =>
                    loadPreset(activeTab, {
                      device: 'cuda',
                      is_half: true,
                      bert_base_path:
                        'GPT_SoVITS/chinese-roberta-wwm-ext-large',
                      cnhuhbert_base_path: 'GPT_SoVITS/chinese-hubert-base',
                    })
                  }
                >
                  GPU Preset
                </Button>
              </div>
              <FormDescription>
                Click on a preset to quickly configure common TTS setups for the
                current tab.
              </FormDescription>
            </div>

            {/* Version Tabs */}
            <Tabs
              value={activeTab}
              onValueChange={(value) => setActiveTab(value as TTSVersion)}
            >
              <TabsList className='grid w-full grid-cols-5'>
                <TabsTrigger value='custom'>Custom</TabsTrigger>
                <TabsTrigger value='v1'>Version 1</TabsTrigger>
                <TabsTrigger value='v2'>Version 2</TabsTrigger>
                <TabsTrigger value='v3'>Version 3</TabsTrigger>
                <TabsTrigger value='v4'>Version 4</TabsTrigger>
              </TabsList>

              <TabsContent value='custom' className='space-y-4'>
                <h4 className='text-lg font-semibold'>Custom Configuration</h4>
                {renderVersionForm('custom')}
              </TabsContent>

              <TabsContent value='v1' className='space-y-4'>
                <h4 className='text-lg font-semibold'>
                  Version 1 Configuration
                </h4>
                {renderVersionForm('v1')}
              </TabsContent>

              <TabsContent value='v2' className='space-y-4'>
                <h4 className='text-lg font-semibold'>
                  Version 2 Configuration
                </h4>
                {renderVersionForm('v2')}
              </TabsContent>

              <TabsContent value='v3' className='space-y-4'>
                <h4 className='text-lg font-semibold'>
                  Version 3 Configuration
                </h4>
                {renderVersionForm('v3')}
              </TabsContent>

              <TabsContent value='v4' className='space-y-4'>
                <h4 className='text-lg font-semibold'>
                  Version 4 Configuration
                </h4>
                {renderVersionForm('v4')}
              </TabsContent>
            </Tabs>
          </form>
        </Form>
      </ScrollArea>
    </ContentSection>
  );
}
