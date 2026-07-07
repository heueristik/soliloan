import moment from 'moment';

import { parseDateFilterValue } from '@/types/date-filter-value';

function endOfDay(date: Date): Date {
  const end = new Date(date);
  end.setUTCHours(23, 59, 59, 999);
  return end;
}

export function resolveDateFilterBounds(
  filterValue: unknown,
  referenceDate: Date,
): { start: Date | null; end: Date | null } | null {
  if (filterValue == null || filterValue === '') {
    return null;
  }

  const parsed = parseDateFilterValue(filterValue);

  switch (parsed.operator) {
    case 'empty':
      return null;
    case 'between': {
      if (!parsed.start && !parsed.end) {
        return null;
      }
      return {
        start: parsed.start ? new Date(parsed.start) : null,
        end: parsed.end ? endOfDay(new Date(parsed.end)) : null,
      };
    }
    case 'last': {
      const end = moment(referenceDate).endOf('day');
      const start = moment(referenceDate).subtract(parsed.amount, parsed.unit).startOf('day');
      return { start: start.toDate(), end: end.toDate() };
    }
    case 'thisMonth': {
      const start = moment(referenceDate).startOf('month').startOf('day');
      const endOfMonth = moment(referenceDate).endOf('month').endOf('day');
      const end = moment.min(endOfMonth, moment(referenceDate).endOf('day'));
      return { start: start.toDate(), end: end.toDate() };
    }
    case 'thisYear': {
      const start = moment(referenceDate).startOf('year').startOf('day');
      const endOfYear = moment(referenceDate).endOf('year').endOf('day');
      const end = moment.min(endOfYear, moment(referenceDate).endOf('day'));
      return { start: start.toDate(), end: end.toDate() };
    }
    case 'year': {
      const start = moment().year(parsed.year).startOf('year').startOf('day');
      const end = moment().year(parsed.year).endOf('year').endOf('day');
      return { start: start.toDate(), end: end.toDate() };
    }
  }
}
