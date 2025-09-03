'use client';

import { FolderOpen } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';
import { cn } from '@/lib/utils';
import { invoke } from '@tauri-apps/api/core';
import { useCallback } from 'react';

interface PathInputProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  onPreview?: () => void;
  readOnly?: boolean;
  enableFilePicker?: boolean;
}

const PathInput = ({
  value,
  onChange,
  placeholder = 'Select path',
  className,
  disabled = false,
  onPreview,
  readOnly = true,
  enableFilePicker = false,
}: PathInputProps) => {
  const onRevealFinder = useCallback(() => {
    invoke('reveal_finder', { path: value });
  }, [value]);

  return (
    <TooltipProvider>
      <div className='flex gap-2'>
        <Tooltip>
          <TooltipTrigger asChild>
            <Input
              value={value || ''}
              onChange={
                enableFilePicker ? undefined : (e) => onChange?.(e.target.value)
              }
              placeholder={placeholder}
              className={cn(
                'h-8 text-xs flex-1',
                enableFilePicker && 'cursor-pointer',
                disabled && 'cursor-not-allowed opacity-50',
                className
              )}
              readOnly={readOnly || enableFilePicker}
              disabled={disabled}
            />
          </TooltipTrigger>
          <TooltipContent>
            <p className='text-xs'>
              {disabled
                ? 'Read only'
                : enableFilePicker
                ? 'Click to browse'
                : 'Enter path manually'}
            </p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type='button'
              variant='outline'
              size='icon'
              className='h-8 w-8'
              onClick={onPreview || onRevealFinder}
            >
              <FolderOpen className='h-4 w-4' />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p className='text-xs'>Finder for path</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
};

export default PathInput;
