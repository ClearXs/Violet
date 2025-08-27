import { Separator } from '@/components/ui/separator';

interface ContentSectionProps {
  title: string;
  desc: string;
  children: React.JSX.Element;
  operation?: React.JSX.Element;
}

export default function ContentSection({
  title,
  desc,
  children,
  operation,
}: ContentSectionProps) {
  return (
    <div className='flex flex-col h-full w-full'>
      <div className='flex-shrink-0'>
        <h3 className='flex flex-row items-center  text-lg font-medium'>
          {title}
          {operation && (
            <span className='ml-auto flex items-center gap-1'>{operation}</span>
          )}
        </h3>
        <p className='text-sm text-muted-foreground'>{desc}</p>
      </div>
      <Separator className='my-2 flex-none' />
      <div className='flex-1 min-h-0 flex'>{children}</div>
    </div>
  );
}
