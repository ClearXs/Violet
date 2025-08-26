'use client';

import type React from 'react';
import { useState, useRef, useEffect } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  RotateCw,
  DoorClosedIcon,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { IconCopy, IconSignRight } from '@tabler/icons-react';

export function TabNavigation() {
  const router = useRouter();
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftScroll, setShowLeftScroll] = useState(false);
  const [showRightScroll, setShowRightScroll] = useState(false);

  // Context menu state
  const [contextTab, setContextTab] = useState<
    {
      show: boolean;
      x: number;
      y: number;
    } & TabItem
  >({
    show: false,
    x: 0,
    y: 0,
    id: '',
    title: '',
    path: '',
  });

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  const closeContextMenu = () => {
    setContextTab((prev) => ({ ...prev, show: false }));
  };

  const reloadTab = (tabId: string) => {
    closeContextMenu();
  };

  const checkScroll = () => {
    if (tabsContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = tabsContainerRef.current;
      setShowLeftScroll(scrollLeft > 0);
      setShowRightScroll(scrollLeft < scrollWidth - clientWidth);
    }
  };

  const scrollLeft = () => {
    if (tabsContainerRef.current) {
      tabsContainerRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (tabsContainerRef.current) {
      tabsContainerRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const container = tabsContainerRef.current;
    if (container) {
      checkScroll();
      container.addEventListener('scroll', checkScroll);
      window.addEventListener('resize', checkScroll);

      return () => {
        container.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
      };
    }
  }, []);

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (contextTab.show) {
        closeContextMenu();
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [contextTab.show]);

  return (
    <div className='relative'>
      <div className='flex items-center h-10'>
        {showLeftScroll && (
          <button
            onClick={scrollLeft}
            className='absolute left-0 z-10 h-10 w-6 flex items-center justify-center bg-gradient-to-r from-gray-50 to-transparent'
          >
            <ChevronLeft className='h-4 w-4' />
          </button>
        )}
        <div
          ref={tabsContainerRef}
          className='flex-1 flex gap-1 items-center overflow-x-auto scrollbar-hide'
        >
          {tabStore.tabs.map((tab) => {
            const isActive = tabStore.selectTab === tab.id;
            return (
              <div
                key={tab.id}
                onClick={() => {
                  tabStore.setSelectTab(tab.id);
                  router.push(tab.path);
                }}
                onContextMenu={(e) => handleContextMenu(e, tab)}
                className={cn(
                  'flex items-center h-8 rounded-md px-4 min-w-[120px] max-w-[200px] relative group cursor-pointer',
                  isActive
                    ? 'bg-white text-black'
                    : 'hover:bg-gray-100 text-gray-700'
                )}
              >
                <span className='truncate flex-1 text-sm'>{tab.title}</span>
                <button
                  onClick={() => tabStore.reduceTab(tab.id)}
                  className={cn(
                    'ml-2 rounded-full p-0.5 hover:bg-gray-200',
                    isActive || 'opacity-0 group-hover:opacity-100'
                  )}
                >
                  <X className='h-3 w-3' />
                </button>
              </div>
            );
          })}
        </div>

        {showRightScroll && (
          <button
            onClick={scrollRight}
            className='absolute right-[280px] z-10 h-10 w-6 flex items-center justify-center bg-gradient-to-l from-gray-50 to-transparent'
          >
            <ChevronRight className='h-4 w-4' />
          </button>
        )}
      </div>

      {contextTab.show && (
        <div
          className='fixed z-50 bg-white rounded-md shadow-md border py-1 w-56'
          style={{
            top: `${contextTab.y}px`,
            left: `${contextTab.x}px`,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className='flex items-center w-full px-3 py-1.5 text-sm hover:bg-gray-100 text-left'
            onClick={() => reloadTab(contextTab.id)}
          >
            <IconSignRight className='h-4 w-4 mr-2' />
            New tab to the right
          </button>
          <DropdownMenuSeparator />
          <button
            className='flex items-center w-full px-3 py-1.5 text-sm hover:bg-gray-100 text-left'
            onClick={() => reloadTab(contextTab.id)}
          >
            <RotateCw className='h-4 w-4 mr-2' />
            Reload
          </button>
          <button
            className='flex items-center w-full px-3 py-1.5 text-sm hover:bg-gray-100 text-left'
            onClick={() =>
              tabStore.appendTab({
                id: `${contextTab.id}-${new Date().getTime()}`,
                title: contextTab.title,
                path: contextTab.path,
              })
            }
          >
            <IconCopy className='h-4 w-4 mr-2' />
            Duplicate
          </button>
          <DropdownMenuSeparator />
          <button
            className='flex items-center w-full px-3 py-1.5 text-sm hover:bg-gray-100 text-left'
            onClick={() => tabStore.reduceTab(contextTab.id)}
          >
            <X className='h-4 w-4 mr-2' />
            Close
          </button>
          <button
            className='flex items-center w-full px-3 py-1.5 text-sm hover:bg-gray-100 text-left'
            onClick={() => tabStore.reduceOthers(contextTab.id)}
          >
            <DoorClosedIcon className='h-4 w-4 mr-2' />
            Close Others
          </button>
          <button
            className='flex items-center w-full px-3 py-1.5 text-sm hover:bg-gray-100 text-left'
            onClick={() => tabStore.reduceStartAt(contextTab.id)}
          >
            <X />
            Close tabs to the right
          </button>
        </div>
      )}
    </div>
  );
}
