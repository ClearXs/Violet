import { Cross2Icon } from '@radix-ui/react-icons';
import { Table } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTableViewOptions } from '../components/data-table-view-options';
import { debounce } from 'lodash';
import { IconRefresh, IconTrash } from '@tabler/icons-react';
import useQAStore from '../store';

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
}

export function DataTableToolbar<TData>({
  table,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;

  const { setOpen, setSelectRows, refresh } = useQAStore();

  return (
    <div className='flex items-center justify-between'>
      <div className='flex flex-1 flex-col-reverse items-start gap-y-2 sm:flex-row sm:items-center sm:space-x-2'>
        <Input
          className='h-8 w-[150px] lg:w-[250px]'
          value={
            (table.getColumn('question')?.getFilterValue() as string) ?? ''
          }
          onVolumeChange={(value) =>
            debounce(() => {
              table.getColumn('event_type')?.setFilterValue(value);
            }, 500)()
          }
          placeholder='Filter question...'
        ></Input>
        <div className='flex gap-x-2'></div>
        {isFiltered && (
          <Button
            variant='ghost'
            onClick={() => table.resetColumnFilters()}
            className='h-8 px-2 lg:px-3'
          >
            Reset
            <Cross2Icon className='ml-2 h-4 w-4' />
          </Button>
        )}
      </div>
      <div className='ml-auto flex flex-row items-center gap-2'>
        <Button
          variant='destructive'
          size='sm'
          disabled={table.getSelectedRowModel().rows.length === 0}
          onClick={() => {
            setOpen('multi-delete');
            const rows = table
              .getSelectedRowModel()
              .rows.map((row) => row.original);
            setSelectRows(rows);
          }}
        >
          <IconTrash />
          Delete
        </Button>
        <Button size='sm' variant='outline' onClick={refresh}>
          <IconRefresh />
          Refresh
        </Button>
        <DataTableViewOptions table={table} />
      </div>
    </div>
  );
}
