'use client';

import { useTranslations } from 'next-intl';
import { useMemo } from 'react';

import { FilterDateSegment } from '@/components/filters/filter-date-segment';
import {
  FilterFieldGroup,
  filterInputSegmentClass,
  filterOperatorSegmentClass,
  filterUnitSegmentClass,
  type FilterFieldVariant,
} from '@/components/filters/filter-field-group';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { StatDeltaUnit } from '@/types/dashboard-widgets/stat-widget';
import {
  createDefaultDateFilterValueForOperator,
  DATE_FILTER_LAST_UNITS,
  DATE_FILTER_LEGACY_OPERATORS,
  DATE_FILTER_OPERATORS,
  type DateFilterLastUnit,
  type DateFilterOperatorWithLegacy,
  type DateFilterRelativeAmountValue,
  type DateFilterValue,
  parseDateFilterValue,
} from '@/types/date-filter-value';

function OperatorSelect({
  value,
  onChange,
  availableOperators,
  operatorLabel,
  variant,
}: {
  value: DateFilterOperatorWithLegacy;
  onChange: (operator: DateFilterOperatorWithLegacy) => void;
  availableOperators: DateFilterOperatorWithLegacy[];
  operatorLabel: (operator: DateFilterOperatorWithLegacy) => string;
  variant: FilterFieldVariant;
}) {
  return (
    <Select value={value} onValueChange={(op) => onChange(op as DateFilterOperatorWithLegacy)}>
      <SelectTrigger className={filterOperatorSegmentClass(variant)}>
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

function RelativeDateAmountFields({
  value,
  onChange,
  variant,
  unitOptions,
}: {
  value: DateFilterRelativeAmountValue;
  onChange: (value: DateFilterRelativeAmountValue) => void;
  variant: FilterFieldVariant;
  unitOptions: { value: StatDeltaUnit; label: string }[];
}) {
  return (
    <>
      <Input
        type="number"
        step={1}
        value={value.amount}
        onChange={(e) => {
          const raw = e.target.value;
          onChange({
            amount: raw === '' ? 0 : Number.parseInt(raw, 10) || 0,
            unit: value.unit,
          });
        }}
        className={filterInputSegmentClass(variant, 'amount')}
      />
      <Select
        value={value.unit}
        onValueChange={(unit) =>
          onChange({
            amount: value.amount,
            unit: unit as DateFilterLastUnit,
          })
        }
      >
        <SelectTrigger className={filterUnitSegmentClass(variant)}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {unitOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );
}

function DateFilterPayload({
  parsed,
  onChange,
  variant,
  refDate,
  t,
  unitOptions,
}: {
  parsed: DateFilterValue;
  onChange: (value: DateFilterValue) => void;
  variant: FilterFieldVariant;
  refDate: Date;
  t: ReturnType<typeof useTranslations>;
  unitOptions: { value: StatDeltaUnit; label: string }[];
}) {
  switch (parsed.operator) {
    case 'between':
      return (
        <>
          <FilterDateSegment
            label={t('dateFilterStart')}
            value={parsed.start}
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
          <FilterDateSegment
            label={t('dateFilterEnd')}
            value={parsed.end}
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
      );
    case 'last':
    case 'next':
    case 'olderThan':
    case 'newerThan':
      return (
        <RelativeDateAmountFields
          value={{ amount: parsed.amount, unit: parsed.unit }}
          onChange={({ amount, unit }) =>
            onChange({
              operator: parsed.operator,
              amount,
              unit,
            })
          }
          variant={variant}
          unitOptions={unitOptions}
        />
      );
    case 'year':
      return (
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
          className={filterInputSegmentClass(variant, 'year')}
        />
      );
    default:
      return null;
  }
}

function hasPayload(operator: DateFilterOperatorWithLegacy): boolean {
  return (
    operator === 'between' ||
    operator === 'last' ||
    operator === 'next' ||
    operator === 'olderThan' ||
    operator === 'newerThan' ||
    operator === 'year'
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
  variant?: FilterFieldVariant;
}) {
  const t = useTranslations(translationNamespace);
  const tStat = useTranslations('dashboard.customizer.stat');
  const refDate = referenceDate ?? new Date();

  const parsed = useMemo(() => parseDateFilterValue(value), [value]);

  const availableOperators = useMemo(() => {
    const legacy = allowEmpty ? DATE_FILTER_LEGACY_OPERATORS.filter((op) => op === 'empty') : [];
    return [...DATE_FILTER_OPERATORS, ...legacy];
  }, [allowEmpty]);

  const unitOptions = useMemo(
    () =>
      DATE_FILTER_LAST_UNITS.map((unit) => ({
        value: unit as StatDeltaUnit,
        label: tStat(`deltaUnits.${unit}`),
      })),
    [tStat],
  );

  const setOperator = (operator: DateFilterOperatorWithLegacy) => {
    if (operator === parsed.operator) {
      return;
    }
    onChange(createDefaultDateFilterValueForOperator(operator, refDate));
  };

  const operatorLabel = (operator: DateFilterOperatorWithLegacy) => t(`dateFilterOperators.${operator}`);
  const showPayload = hasPayload(parsed.operator);
  const useVerticalLayout = variant === 'compact' && showPayload;

  const operatorSelect = (
    <OperatorSelect
      value={parsed.operator}
      onChange={setOperator}
      availableOperators={availableOperators}
      operatorLabel={operatorLabel}
      variant={variant}
    />
  );

  const payload = showPayload ? (
    <DateFilterPayload
      parsed={parsed}
      onChange={onChange}
      variant={variant}
      refDate={refDate}
      t={t}
      unitOptions={unitOptions}
    />
  ) : null;

  if (useVerticalLayout) {
    return (
      <FilterFieldGroup orientation="vertical">
        {operatorSelect}
        <FilterFieldGroup className="min-w-0">{payload}</FilterFieldGroup>
      </FilterFieldGroup>
    );
  }

  return (
    <FilterFieldGroup>
      {operatorSelect}
      {payload}
    </FilterFieldGroup>
  );
}
