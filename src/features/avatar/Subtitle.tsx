import { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

type SubtitleLine = {
  id: string;
  type: 'user' | 'ai' | 'system';
  text: string;
  timestamp: number;
  isComplete?: boolean;
};

type SubtitlesProps = {
  className?: string;
  maxLines?: number;
  autoHide?: boolean;
  autoHideDelay?: number;
};

export default function Subtitles({
  className,
  maxLines = 3,
  autoHide = true,
  autoHideDelay = 5000,
}: SubtitlesProps) {
  const [lines, setLines] = useState<SubtitleLine[]>([]);
  const [visible, setVisible] = useState(false);
  const hideTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);

  const addLine = useCallback(
    (
      text: string,
      type: 'user' | 'ai' | 'system' = 'user',
      isComplete: boolean = true
    ) => {
      const newLine: SubtitleLine = {
        id: Date.now().toString(),
        type,
        text,
        timestamp: Date.now(),
        isComplete,
      };

      setLines((prev) => {
        const updated = [...prev, newLine];
        if (updated.length > maxLines) {
          return updated.slice(-maxLines);
        }
        return updated;
      });

      setVisible(true);

      if (autoHide && isComplete) {
        if (hideTimeoutRef.current) {
          clearTimeout(hideTimeoutRef.current);
        }
        hideTimeoutRef.current = setTimeout(() => {
          setVisible(false);
        }, autoHideDelay);
      }
    },
    [maxLines, autoHide, autoHideDelay]
  );

  const updateLastLine = useCallback(
    (text: string, isComplete: boolean = false) => {
      setLines((prev) => {
        if (prev.length === 0) return prev;

        const updated = [...prev];
        const lastIndex = updated.length - 1;
        updated[lastIndex] = {
          ...updated[lastIndex],
          text,
          isComplete,
        };

        return updated;
      });

      if (isComplete && autoHide) {
        if (hideTimeoutRef.current) {
          clearTimeout(hideTimeoutRef.current);
        }
        hideTimeoutRef.current = setTimeout(() => {
          setVisible(false);
        }, autoHideDelay);
      }
    },
    [autoHide, autoHideDelay]
  );

  const clearLines = useCallback(() => {
    setLines([]);
    setVisible(false);
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
  }, []);

  const show = useCallback(() => setVisible(true), []);
  const hide = useCallback(() => setVisible(false), []);

  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [lines]);

  useEffect(() => {
    addLine('test');
    (window as any).subtitles = {
      addLine,
      updateLastLine,
      clearLines,
      show,
      hide,
    };

    return () => {
      delete (window as any).subtitles;
    };
  }, [addLine, updateLastLine, clearLines, show, hide]);

  const getLineStyle = (type: SubtitleLine['type']) => {};

  const getTypeIcon = (type: SubtitleLine['type']) => {};

  if (!visible || lines.length === 0) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'fixed bottom-20 left-1/2 transform -translate-x-1/2',
        'max-w-2xl w-full mx-4',
        'max-h-32 overflow-y-auto',
        'space-y-2',
        'pointer-events-none',
        'z-50',
        className
      )}
    >
      {lines.map((line) => (
        <div
          key={line.id}
          className={cn(
            'px-4 py-2 rounded-lg',
            'text-sm font-medium',
            'shadow-lg',
            'transition-all duration-300',
            'animate-in slide-in-from-bottom-2',
            getLineStyle(line.type),
            !line.isComplete && 'opacity-75 animate-pulse'
          )}
        >
          <div className='flex items-start gap-2'>
            <span className='flex-1 leading-relaxed'>
              {line.text}
              {!line.isComplete && (
                <span className='inline-block w-2 h-4 ml-1 bg-current animate-pulse' />
              )}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

export function useSubtitles() {
  const addUserMessage = useCallback(
    (text: string, isComplete: boolean = true) => {
      (window as any).subtitles?.addLine(text, 'user', isComplete);
    },
    []
  );

  const addAIMessage = useCallback(
    (text: string, isComplete: boolean = true) => {
      (window as any).subtitles?.addLine(text, 'ai', isComplete);
    },
    []
  );

  const addSystemMessage = useCallback((text: string) => {
    (window as any).subtitles?.addLine(text, 'system', true);
  }, []);

  const updateLastMessage = useCallback(
    (text: string, isComplete: boolean = false) => {
      (window as any).subtitles?.updateLastLine(text, isComplete);
    },
    []
  );

  const clearAllMessages = useCallback(() => {
    (window as any).subtitles?.clearLines();
  }, []);

  const showSubtitles = useCallback(() => {
    (window as any).subtitles?.show();
  }, []);

  const hideSubtitles = useCallback(() => {
    (window as any).subtitles?.hide();
  }, []);

  return {
    addUserMessage,
    addAIMessage,
    addSystemMessage,
    updateLastMessage,
    clearAllMessages,
    showSubtitles,
    hideSubtitles,
  };
}
