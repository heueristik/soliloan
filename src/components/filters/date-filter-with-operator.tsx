'use client';

import { de, enUS } from 'date-fns/locale';
import { X } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useMemo } from 'react';

import { StatDeltaRangeInput } from '@/components/dashboard/widgets/stat-delta-range-input';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn, formatDateLong, formatDateShort } from '@/lib/utils';
import type { StatDeltaUnit } from '@/types/dashboard-widgets/stat-widget';
import {
  createDefaultDateFilterValueForOperator,
  DATE_FILTER_LAST_UNITS,
  DATE_FILTER_OPERATORS,
  type DateFilterOperator,
  type DateFilterValue,
  parseDateFilterValue,
} from '@/types/date-filter-value';

const DATE_INPUT_WIDTH = 'w-[7.25rem]';

function toIsoDateString(date: Date): string {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().split('T')[0];
}

function BetweenDateButton({
  label,
  value,
  onChange,
  onClear,
  dateLocale,
  locale,
  variant,
  className,
}: {
  label: string;
  value: string | null;
  onChange: (value: string | undefined) => void;
  onClear: () => void;
  dateLocale: typeof de;
  locale: string;
  variant: 'compact' | 'default';
  className?: string;
}) {
  const formatDateValue = variant === 'compact' ? formatDateShort : formatDateLong;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size={variant === 'compact' ? 'sm' : 'default'}
          className={cn(
            DATE_INPUT_WIDTH,
            'shrink-0 justify-start px-2 text-left font-normal',
            variant === 'compact' && 'h-8 text-xs',
            !value && 'text-muted-foreground',
            className,
          )}
        >
          {value ? (
            <div className="flex min-w-0 items-center justify-between gap-1 w-full">
              <span className="truncate">{formatDateValue(value, locale)}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-4 w-4 shrink-0 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onClear();
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <span className="truncate">{label}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value ? new Date(value) : undefined}
          onSelect={(date) => onChange(date ? toIsoDateString(date) : undefined)}
          initialFocus
          locale={dateLocale}
        />
      </PopoverContent>
    </Popover>
  );
}

function OperatorSelect({
  value,
  onChange,
  availableOperators,
  operatorLabel,
  variant,
}: {
  value: DateFilterOperator;
  onChange: (operator: DateFilterOperator) => void;
  availableOperators: DateFilterOperator[];
  operatorLabel: (operator: DateFilterOperator) => string;
  variant: 'compact' | 'default';
}) {
  return (
    <Select value={value} onValueChange={(op) => onChange(op as DateFilterOperator)}>
      <SelectTrigger
        className={cn(
          'w-auto shrink-0 gap-1',
          variant === 'compact' ? 'h-8 px-2 text-xs' : 'h-9 px-3',
          '[&>span]:line-clamp-none [&>span]:whitespace-nowrap',
        )}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {availableOperators.map((operator) => (
          <SelectItem key={operator} value={operator}>
            {operatorLabel(operator)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function DateFilterWithOperator({
  value,
  onChange,
  allowEmpty = false,
  referenceDate,
  translationNamespace = 'dataTable',
  variant = 'default',
}: {
  value: unknown;
  onChange: (value: DateFilterValue) => void;
  allowEmpty?: boolean;
  referenceDate?: Date;
  translationNamespace?: string;
  variant?: 'compact' | 'default';
}) {
  const t = useTranslations(translationNamespace);
  const tStat = useTranslations('dashboard.customizer.stat');
  const locale = useLocale();
  const dateLocale = locale === 'de' ? de : enUS;
  const refDate = referenceDate ?? new Date();

  const parsed = useMemo(() => parseDateFilterValue(value), [value]);

  const availableOperators = useMemo(() => {
    return DATE_FILTER_OPERATORS.filter((op) => op !== 'empty' || allowEmpty);
  }, [allowEmpty]);

  const unitOptions = useMemo(
    () =>
      DATE_FILTER_LAST_UNITS.map((unit) => ({
        value: unit as StatDeltaUnit,
        label: tStat(`deltaUnits.${unit}`),
      })),
    [tStat],
  );

  const setOperator = (operator: DateFilterOperator) => {
    if (operator === parsed.operator) {
      return;
    }
    onChange(createDefaultDateFilterValueForOperator(operator, refDate));
  };

  const operatorLabel = (operator: DateFilterOperator) => t(`dateFilterOperators.${operator}`);

  return (
    <div className="flex w-full flex-wrap items-center gap-2">
      <OperatorSelect
        value={parsed.operator}
        onChange={setOperator}
        availableOperators={availableOperators}
        operatorLabel={operatorLabel}
        variant={variant}
      />

      {parsed.operator === 'between' ? (
        <>
          <BetweenDateButton
            label={t('dateFilterStart')}
            value={parsed.start}
            locale={locale}
            dateLocale={dateLocale}
            variant={variant}
            onChange={(start) =>
              onChange({
                operator: 'between',
                start: start ?? null,
                end: parsed.end,
              })
            }
            onClear={() =>
              onChange({
                operator: 'between',
                start: null,
                end: parsed.end,
              })
            }
          />
          <BetweenDateButton
            label={t('dateFilterEnd')}
            value={parsed.end}
            locale={locale}
            dateLocale={dateLocale}
            variant={variant}
            onChange={(end) =>
              onChange({
                operator: 'between',
                start: parsed.start,
                end: end ?? null,
              })
            }
            onClear={() =>
              onChange({
                operator: 'between',
                start: parsed.start,
                end: null,
              })
            }
          />
        </>
      ) : null}

      {parsed.operator === 'last' ? (
        <StatDeltaRangeInput
          value={{ amount: parsed.amount, unit: parsed.unit }}
          onChange={(next) => onChange({ operator: 'last', amount: next.amount, unit: next.unit as typeof parsed.unit })}
          numberLabel={t('dateFilterRelative')}
          unitOptions={unitOptions}
          hideLabel
          className="w-auto shrink-0"
        />
      ) : null}

      {parsed.operator === 'year' ? (
        <Input
          type="number"
          min={1900}
          max={2100}
          step={1}
          value={parsed.year}
          onChange={(e) => {
            const raw = e.target.value;
            const year = raw === '' ? refDate.getFullYear() : Number.parseInt(raw, 10) || refDate.getFullYear();
            onChange({ operator: 'year', year });
          }}
          className={cn('w-24 shrink-0', variant === 'compact' && 'h-8 text-xs')}
        />
      ) : null}
    </div>
  );
}
