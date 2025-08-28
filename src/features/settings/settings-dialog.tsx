import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import useSettingsStore from '@/store/settings';
import Settings from './settings';
import { Separator } from '@/components/ui/separator';

export default function SettingsDialog() {
  const settingsStore = useSettingsStore();

  return (
    settingsStore.open && (
      <Dialog
        open={settingsStore.open}
        onOpenChange={(open) => {
          if (!open) {
            setTimeout(() => {
              document.body.style.removeProperty('pointer-events');
            }, 500);
          }
          settingsStore.setOpen(open);
        }}
      >
        <DialogContent className='gap-0 flex flex-col h-[80%] w-[70%]'>
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
            <DialogDescription className='flex flex-row items-center '>
              Manage your application settings including models, TTS, ASR, and
              system preferences.
            </DialogDescription>
            <Separator />
          </DialogHeader>
          <Settings />
        </DialogContent>
      </Dialog>
    )
  );
}
