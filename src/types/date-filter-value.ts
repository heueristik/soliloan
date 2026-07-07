import type { FilterOperatorValue } from '@/types/filter-operators';

export const DATE_FILTER_OPERATORS = [
  'between',
  'last',
  'thisMonth',
  'thisYear',
  'year',
  'empty',
] as const;

export type DateFilterOperator = (typeof DATE_FILTER_OPERATORS)[number];

export const DATE_FILTER_LAST_UNITS = ['days', 'months'] as const;

export type DateFilterLastUnit = (typeof DATE_FILTER_LAST_UNITS)[number];

export type DateFilterValue =
  | FilterOperatorValue<'between', { start: string | null; end: string | null }>
  | FilterOperatorValue<'last', { amount: number; unit: DateFilterLastUnit }>
  | FilterOperatorValue<'thisMonth'>
  | FilterOperatorValue<'thisYear'>
  | FilterOperatorValue<'year', { year: number }>
  | FilterOperatorValue<'empty'>;

export function createDefaultDateFilterValue(): DateFilterValue {
  return {
    operator: 'between',
    start: null,
    end: null,
  };
}

export function createDefaultDateFilterValueForOperator(
  operator: DateFilterOperator,
  referenceDate: Date = new Date(),
): DateFilterValue {
  switch (operator) {
    case 'between':
      return createDefaultDateFilterValue();
    case 'last':
      return { operator: 'last', amount: 12, unit: 'months' };
    case 'thisMonth':
      return { operator: 'thisMonth' };
    case 'thisYear':
      return { operator: 'thisYear' };
    case 'year':
      return { operator: 'year', year: referenceDate.getFullYear() };
    case 'empty':
      return { operator: 'empty' };
  }
}

function isDateFilterLastUnit(value: unknown): value is DateFilterLastUnit {
  return typeof value === 'string' && (DATE_FILTER_LAST_UNITS as readonly string[]).includes(value);
}

function isDateFilterOperator(value: unknown): value is DateFilterOperator {
  return typeof value === 'string' && (DATE_FILTER_OPERATORS as readonly string[]).includes(value);
}

export function parseDateFilterValue(raw: unknown): DateFilterValue {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return createDefaultDateFilterValue();
  }

  const value = raw as { operator?: DateFilterOperator };
  if (!isDateFilterOperator(value.operator)) {
    return createDefaultDateFilterValue();
  }

  switch (value.operator) {
    case 'between': {
      const { start, end } = value as { start?: string | null; end?: string | null };
      return {
        operator: 'between',
        start: typeof start === 'string' ? start : null,
        end: typeof end === 'string' ? end : null,
      };
    }
    case 'last': {
      const { amount, unit } = value as { amount?: number; unit?: DateFilterLastUnit };
      const parsedAmount = Number(amount);
      return {
        operator: 'last',
        amount: Number.isFinite(parsedAmount) && parsedAmount > 0 ? Math.round(parsedAmount) : 12,
        unit: isDateFilterLastUnit(unit) ? unit : 'months',
      };
    }
    case 'thisMonth':
      return { operator: 'thisMonth' };
    case 'thisYear':
      return { operator: 'thisYear' };
    case 'year': {
      const { year } = value as { year?: number };
      const parsedYear = Number(year);
      return {
        operator: 'year',
        year: Number.isFinite(parsedYear) ? Math.round(parsedYear) : new Date().getFullYear(),
      };
    }
    case 'empty':
      return { operator: 'empty' };
  }
}

export function isInactiveDateFilterValue(raw: unknown): boolean {
  const parsed = parseDateFilterValue(raw);
  return parsed.operator === 'between' && !parsed.start && !parsed.end;
}
