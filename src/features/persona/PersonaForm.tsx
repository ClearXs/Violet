import { Personas } from '@/services/personas';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ImageIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import FilePicker from './FilePicker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

const personaSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, {
    message: 'Persona name is required.',
  }),
  activated: z.boolean(),
  r_path: z.string().min(1, {
    message: 'Relative path is required.',
  }),
  thumb: z.string().optional(),
  updated_at: z.string().optional(),
  user_id: z.string().optional(),
  created_at: z.string().optional(),
  character_setting: z.string().optional(),
  config: z
    .object({
      character_setting: z.string().optional(),
      ref_audio: z.string().optional(),
      motion: z
        .object({
          idle_loop: z.string().optional(),
        })
        .optional(),
      vrm: z.string().optional(),
      prompt_lang: z.string().optional(),
    })
    .optional(),
});

type PersonaFormValues = z.infer<typeof personaSchema>;

interface PersonaFormProps {
  persona?: Personas;
}

const PersonaForm = ({ persona }: PersonaFormProps) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [thumbnailLoading, setThumbnailLoading] = useState(false);
  const [thumbnailError, setThumbnailError] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const form = useForm<PersonaFormValues>({
    resolver: zodResolver(personaSchema),
    mode: 'onChange',
    defaultValues: {
      activated: false,
      name: '',
      r_path: '',
      thumb: '',
      user_id: '',
      character_setting: '',
      config: {
        character_setting: '',
        ref_audio: '',
        motion: {
          idle_loop: '',
        },
        vrm: '',
        prompt_lang: '',
      },
    },
  });

  useEffect(() => {
    if (persona) {
      form.reset(persona);
    }
  }, [persona, form]);

  const playAudio = () => {
    if (!persona?.config?.ref_audio) return;

    setIsPlayingAudio(true);
    try {
      const audioUrl = `/api/file/download?path=${persona.r_path}/${persona.config.ref_audio}`;
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play().finally(() => {
          setIsPlayingAudio(false);
        });
      }
    } catch (error) {
      toast.error(`Error playing audio: ${error}`);
    }
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlayingAudio(false);
  };

  const downloadFile = (path: string) => {
    const url = `/api/file/download?path=${persona?.r_path}/${path}`;
    window.open(url, '_blank');
  };

  const ThumbnailPreview = ({ thumbPath }: { thumbPath?: string }) => {
    if (!thumbPath) {
      return (
        <div className='w-16 h-16 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50'>
          <ImageIcon className='w-6 h-6 text-gray-400' />
        </div>
      );
    }

    if (thumbnailLoading) {
      return <Skeleton className='w-16 h-16 rounded-lg' />;
    }

    if (thumbnailError) {
      return (
        <div className='w-16 h-16 border border-red-300 rounded-lg flex items-center justify-center bg-red-50'>
          <span className='text-xs text-red-500'>No data</span>
        </div>
      );
    }

    return (
      <img
        src={`/api/file/download_image?path=${thumbPath}`}
        alt='Thumbnail'
        className='w-16 h-16 object-cover rounded-lg border'
        onLoad={() => setThumbnailLoading(false)}
        onError={() => {
          setThumbnailError(true);
          setThumbnailLoading(false);
        }}
        onLoadStart={() => {
          setThumbnailLoading(true);
          setThumbnailError(false);
        }}
      />
    );
  };

  return (
    <div className='pr-3'>
      <audio ref={audioRef} onEnded={() => setIsPlayingAudio(false)} />

      <Form {...form}>
        <form className='space-y-4'>
          <div className='space-y-3'>
            <h4 className='text-xs font-semibold text-muted-foreground uppercase tracking-wide'>
              Basic Information
            </h4>

            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem className='space-y-1'>
                  <FormLabel className='text-xs'>Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder='Enter persona name'
                      className='h-8 text-xs'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className='text-xs' />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='activated'
              disabled
              render={({ field }) => (
                <FormItem className='flex items-center justify-between space-y-0 py-2'>
                  <FormLabel className='text-xs'>Activated</FormLabel>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className='scale-75'
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='r_path'
              render={({ field }) => (
                <FormItem className='space-y-1'>
                  <FormLabel className='text-xs'>Relative Path</FormLabel>
                  <FormControl>
                    <FilePicker
                      value={field.value}
                      onChange={field.onChange}
                      placeholder='Select relative path'
                      type='folder'
                    />
                  </FormControl>
                  <FormMessage className='text-xs' />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='thumb'
              render={({ field }) => (
                <FormItem className='space-y-1'>
                  <FormLabel className='text-xs'>Thumbnail</FormLabel>
                  <FormControl>
                    <div className='flex gap-2 items-start'>
                      <div className='flex-1'>
                        <FilePicker
                          value={field.value}
                          onChange={field.onChange}
                          placeholder='Select thumbnail image'
                          type='image'
                          accept='image/*'
                        />
                      </div>
                      <ThumbnailPreview thumbPath={field.value} />
                    </div>
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          <div className='space-y-3 pt-2 border-t'>
            <h4 className='text-xs font-semibold text-muted-foreground uppercase tracking-wide'>
              Configuration
            </h4>

            <FormField
              control={form.control}
              name='config.character_setting'
              render={({ field }) => (
                <FormItem className='space-y-1'>
                  <FormLabel className='text-xs'>Setting File</FormLabel>
                  <FormControl>
                    <FilePicker
                      value={field.value}
                      onChange={field.onChange}
                      placeholder='Select character setting file'
                      type='file'
                      accept='.json,.txt,.yaml,.yml'
                      showPreview={true}
                      onPreview={() => field.value && downloadFile(field.value)}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='config.ref_audio'
              render={({ field }) => (
                <FormItem className='space-y-1'>
                  <FormLabel className='text-xs'>Audio</FormLabel>
                  <FormControl>
                    <FilePicker
                      value={field.value}
                      onChange={field.onChange}
                      placeholder='Select reference audio file'
                      type='audio'
                      accept='audio/*'
                      showPreview={true}
                      onPreview={isPlayingAudio ? stopAudio : playAudio}
                      isPlaying={isPlayingAudio}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='config.vrm'
              render={({ field }) => (
                <FormItem className='space-y-1'>
                  <FormLabel className='text-xs'>VRM File</FormLabel>
                  <FormControl>
                    <FilePicker
                      value={field.value}
                      onChange={field.onChange}
                      placeholder='Select VRM model file'
                      type='file'
                      accept='.vrm'
                      showPreview={true}
                      onPreview={() => field.value && downloadFile(field.value)}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='config.prompt_lang'
              render={({ field }) => (
                <FormItem className='space-y-1'>
                  <FormLabel className='text-xs'>Language</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className='h-8 text-xs'>
                        <SelectValue placeholder='Select language' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className='z-[1000]'>
                      <SelectItem value='zh'>中文</SelectItem>
                      <SelectItem value='en'>English</SelectItem>
                      <SelectItem value='ja'>日語</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='config.motion.idle_loop'
              render={({ field }) => (
                <FormItem className='space-y-1'>
                  <FormLabel className='text-xs'>Idle Motion</FormLabel>
                  <FormControl>
                    <FilePicker
                      value={field.value}
                      onChange={field.onChange}
                      placeholder='Select idle animation file'
                      type='file'
                      accept='.vmd,.bvh,.fbx'
                      showPreview={true}
                      onPreview={() => field.value && downloadFile(field.value)}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          <div className='space-y-3 pt-2 border-t'>
            <h4 className='text-xs font-semibold text-muted-foreground uppercase tracking-wide'>
              Character Setting
            </h4>

            <FormField
              control={form.control}
              name='character_setting'
              render={({ field }) => (
                <FormItem className='space-y-1'>
                  <FormLabel className='text-xs'>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder='Enter character personality, background...'
                      rows={4}
                      className='text-xs resize-none'
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </form>
      </Form>
    </div>
  );
};

export default PersonaForm;
