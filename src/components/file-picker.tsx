'use client';

import { useCallback, useRef } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Mic, MicOff, ExternalLink, FolderOpen } from 'lucide-react';
import { TooltipProvider } from './ui/tooltip';
import { cn } from '@/lib/utils';
import { invoke } from '@tauri-apps/api/core';

interface FilePickerProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  accept?: string;
  type?: 'file' | 'folder' | 'image' | 'audio';
  showPreview?: boolean;
  onPreview?: () => void;
  isPlaying?: boolean;
  multiple?: boolean;
  disabled?: boolean;
}

const FilePicker = ({
  value,
  onChange,
  placeholder = 'Select file path',
  className,
  accept = '*',
  type = 'file',
  showPreview = false,
  onPreview,
  isPlaying = false,
  multiple = false,
  disabled = false,
}: FilePickerProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputClick = () => {
    fileInputRef.current?.click();
  };

  const onRevealFinder = useCallback(() => {
    invoke('reveal_finder', { path: value });
  }, [value]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    if (type === 'folder') {
      const firstFile = files[0];
      const pathParts = firstFile.webkitRelativePath.split('/');
      pathParts.pop();
      const folderPath = pathParts.join('/');
      onChange?.(folderPath);
    } else {
      const file = files[0];
      if (multiple) {
        const filePaths = Array.from(files).map((f) => f.name);
        onChange?.(filePaths.join(';'));
      } else {
        onChange?.(file.name);
      }
    }
  };

  const getAcceptString = () => {
    switch (type) {
      case 'image':
        return 'image/*';
      case 'audio':
        return 'audio/*';
      case 'folder':
        return '';
      default:
        return accept;
    }
  };

  const getFolderProps = () => {
    if (type === 'folder') {
      return {
        webkitdirectory: '',
        directory: '',
        multiple: true,
      };
    }
    return { multiple };
  };

  const getPreviewIcon = () => {
    if (type === 'audio') {
      return isPlaying ? (
        <MicOff className='w-3 h-3' />
      ) : (
        <Mic className='w-3 h-3' />
      );
    } else if (type === 'folder') {
      return <FolderOpen className='w-3 h-3' />;
    } else {
      return <ExternalLink className='w-3 h-3' />;
    }
  };

  return (
    <TooltipProvider>
      <div className='flex gap-1 items-center'>
        <Input
          value={value || ''}
          placeholder={placeholder}
          className={cn(
            'h-8 text-xs cursor-pointer flex-1',
            disabled && 'cursor-not-allowed opacity-50',
            className
          )}
          readOnly
          onClick={handleInputClick}
          disabled={disabled}
        />

        {showPreview && value && (
          <Button
            type='button'
            variant='outline'
            size='sm'
            className='h-8 px-2'
            onClick={onPreview || onRevealFinder}
          >
            {getPreviewIcon()}
          </Button>
        )}

        <input
          ref={fileInputRef}
          type='file'
          className='hidden'
          accept={getAcceptString()}
          onChange={handleFileSelect}
          disabled={disabled}
          {...getFolderProps()}
        />
      </div>
    </TooltipProvider>
  );
};

export default FilePicker;
