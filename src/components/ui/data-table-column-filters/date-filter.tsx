import type { ColumnFilter } from '@tanstack/react-table';

import { DateFilterWithOperator } from '@/components/filters/date-filter-with-operator';
import type { DateFilterValue } from '@/types/date-filter-value';

interface DateFilterProps {
  filterState?: ColumnFilter;
  onFilterChange: (value: DateFilterValue | undefined) => void;
  allowEmpty?: boolean;
}

export function DateFilter({ filterState, onFilterChange, allowEmpty = false }: DateFilterProps) {
  return (
    <DateFilterWithOperator
      value={filterState?.value}
      onChange={onFilterChange}
      allowEmpty={allowEmpty}
      translationNamespace="dataTable"
      variant="default"
    />
  );
}
