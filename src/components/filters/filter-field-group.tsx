import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

export type FilterFieldVariant = 'compact' | 'default';

const horizontalFusionClass =
  '[&>*:not(:first-child)]:rounded-l-none [&>*:not(:first-child)]:border-l-0 [&>*:not(:last-child)]:rounded-r-none';

const verticalFusionClass =
  '[&>*:not(:first-child)]:rounded-t-none [&>*:not(:first-child)]:border-t-0 [&>*:not(:last-child)]:rounded-b-none';

export function FilterFieldGroup({
  children,
  className,
  orientation = 'horizontal',
}: {
  children: ReactNode;
  className?: string;
  orientation?: 'horizontal' | 'vertical';
}) {
  return (
    <fieldset
      className={cn(
        'm-0 min-w-0 border-0 p-0',
        'flex w-full items-stretch [&>*]:focus-visible:relative [&>*]:focus-visible:z-10',
        orientation === 'vertical' ? cn('flex-col', verticalFusionClass) : cn('flex-row', horizontalFusionClass),
        className,
      )}
    >
      {children}
    </fieldset>
  );
}

export function filterOperatorSegmentClass(variant: FilterFieldVariant) {
  return cn(
    'w-auto shrink-0 gap-1 shadow-none',
    variant === 'compact' ? 'h-8 px-2 text-xs' : 'h-9 px-3',
    '[&>span]:line-clamp-none [&>span]:whitespace-nowrap',
  );
}

export function filterInputSegmentClass(variant: FilterFieldVariant, width: 'amount' | 'year' = 'amount') {
  return cn(
    'shadow-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
    variant === 'compact' ? 'h-8 text-xs' : 'h-9',
    width === 'amount' ? 'w-14 shrink-0' : 'w-24 shrink-0',
  );
}

export function filterDateSegmentClass(variant: FilterFieldVariant) {
  return cn(
    'w-[7.25rem] min-w-0 shrink justify-start px-2 text-left font-normal shadow-none',
    variant === 'compact' ? 'h-8 text-xs' : 'h-9',
  );
}

export function filterUnitSegmentClass(variant: FilterFieldVariant) {
  return cn('w-[100px] shrink-0 shadow-none', variant === 'compact' ? 'h-8 text-xs' : 'h-9');
}
