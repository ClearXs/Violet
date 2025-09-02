'use client';

import { useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, ExternalLink, FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

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
}

export default function FilePicker({
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
}: FilePickerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && onChange) {
      onChange(file.name);
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
    return {};
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
    <div className='flex gap-1 items-center'>
      <Input
        value={value || ''}
        placeholder={placeholder}
        className={cn('h-8 text-xs cursor-pointer flex-1', className)}
        onClick={handleInputClick}
        readOnly
      />

      {showPreview && value && (
        <Button
          type='button'
          variant='outline'
          size='sm'
          className='h-8 px-2'
          onClick={onPreview}
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
        multiple={multiple}
        {...getFolderProps()}
      />
    </div>
  );
}
