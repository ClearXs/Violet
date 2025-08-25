'use client';

import { type JSX } from 'react';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface SidebarNavProps extends React.HTMLAttributes<HTMLElement> {
  items: {
    key: string;
    title: string;
    icon: JSX.Element;
  }[];
  selectKey: string;
  onSelectKey?: (key: string) => void;
}

export default function SidebarNav({
  className,
  items,
  selectKey,
  onSelectKey,
  ...props
}: SidebarNavProps) {
  const handleSelect = (e: string) => {
    onSelectKey?.(e);
  };

  return (
    <>
      <div className='p-1 md:hidden'>
        <Select value={selectKey} onValueChange={handleSelect}>
          <SelectTrigger className='h-12 sm:w-48'>
            <SelectValue placeholder='Theme' />
          </SelectTrigger>
          <SelectContent>
            {items.map((item) => (
              <SelectItem key={item.key} value={item.key}>
                <div className='flex gap-x-4 px-2 py-1'>
                  <span className='scale-125'>{item.icon}</span>
                  <span className='text-md'>{item.title}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <ScrollArea
        type='always'
        className='hidden w-full min-w-40 bg-background px-1 py-2 md:block'
      >
        <nav className={cn('flex py-1 flex-col', className)} {...props}>
          {items.map((item) => (
            <div
              key={item.key}
              className={cn(
                buttonVariants({ variant: 'ghost' }),
                selectKey === item.key
                  ? 'bg-muted hover:bg-muted'
                  : 'hover:bg-transparent hover:underline',
                'justify-start',
                'cursor-pointer'
              )}
              onClick={(e) => {
                e.stopPropagation();
                handleSelect(item.key);
              }}
            >
              <span className='mr-2'>{item.icon}</span>
              {item.title}
            </div>
          ))}
        </nav>
      </ScrollArea>
    </>
  );
}
