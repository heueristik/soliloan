'use client';

import { SavingsRateType } from '@prisma/client';
import { Calculator, CalendarDays, Equal, Shuffle } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { FormDatePicker } from '@/components/form/form-date-picker';
import { FormNumberInput } from '@/components/form/form-number-input';
import { FormSwitch } from '@/components/form/form-switch';
import { Button } from '@/components/ui/button';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { calculateSavingsLastPaymentDate, getDefaultFirstPaymentDate } from '@/lib/loans/savings-contract';
import type { LoanFormClientData } from '@/lib/schemas/loan';
import { formatDateLong, NumberParser } from '@/lib/utils';

export function SavingsFormFields() {
  const t = useTranslations('dashboard.loans');
  const commonT = useTranslations('common');
  const locale = useLocale();
  const { watch, setValue, control } = useFormContext<LoanFormClientData>();

  const isSavingsContract = watch('isSavingsContract');
  const savingsRateType = watch('savingsRateType');
  const savingsPaymentCount = watch('savingsPaymentCount');
  const savingsFirstPaymentDate = watch('savingsFirstPaymentDate');
  const signDate = watch('signDate');
  const amount = watch('amount');
  const savingsMonthlyAmount = watch('savingsMonthlyAmount');

  const isFixedRate = savingsRateType === SavingsRateType.FIXED;
  const toggleValue = isFixedRate ? 'fixed' : 'varying';
  const lastPaymentDate = calculateSavingsLastPaymentDate(savingsFirstPaymentDate, savingsPaymentCount);
  const parser = new NumberParser('de-DE');

  useEffect(() => {
    if (!isSavingsContract) return;
    if (savingsFirstPaymentDate) return;

    setValue('savingsFirstPaymentDate', getDefaultFirstPaymentDate(signDate), {
      shouldDirty: true,
      shouldValidate: true,
    });
  }, [isSavingsContract, savingsFirstPaymentDate, signDate, setValue]);

  const handleToggleChange = (value: string) => {
    if (!value) return;

    setValue('savingsRateType', value === 'fixed' ? SavingsRateType.FIXED : SavingsRateType.VARYING, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const handleCalculatePaymentCount = () => {
    const loanAmount = parser.parse(amount as string);
    const monthlyAmount = parser.parse(savingsMonthlyAmount as string);

    if (!loanAmount || !monthlyAmount || monthlyAmount <= 0) return;

    setValue('savingsPaymentCount', Math.ceil(loanAmount / monthlyAmount), {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  return (
    <>
      <FormSwitch name="isSavingsContract" label={t('new.form.savingsContract')} labelPlacement="inline" />

      {isSavingsContract && (
        <div className="animate-in fade-in-0 slide-in-from-top-1 duration-200 motion-reduce:animate-none space-y-5">
          <div className="space-y-2">
            <Label className="block">{t('new.form.savingsRateType')}</Label>
            <ToggleGroup type="single" value={toggleValue} onValueChange={handleToggleChange} className="w-full">
              <ToggleGroupItem value="fixed" aria-label={t('new.form.savingsRateTypeFixed')}>
                <span className="inline-flex items-center justify-center gap-2">
                  <Equal className="h-4 w-4" aria-hidden="true" />
                  <span>{t('new.form.savingsRateTypeFixed')}</span>
                </span>
              </ToggleGroupItem>
              <ToggleGroupItem value="varying" aria-label={t('new.form.savingsRateTypeVarying')}>
                <span className="inline-flex items-center justify-center gap-2">
                  <Shuffle className="h-4 w-4" aria-hidden="true" />
                  <span>{t('new.form.savingsRateTypeVarying')}</span>
                </span>
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          {isFixedRate ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormNumberInput
                name="savingsMonthlyAmount"
                label={`${t('new.form.savingsMonthlyAmount')} *`}
                placeholder={commonT('ui.form.enterPlaceholder')}
                prefix="€"
                min={0.01}
                step={0.01}
              />
              <FormField
                control={control}
                name="savingsPaymentCount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{`${t('new.form.savingsPaymentCountFixed')} *`}</FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <Input
                          type="number"
                          placeholder={commonT('ui.form.enterPlaceholder')}
                          min={1}
                          step={1}
                          {...field}
                          value={field.value ?? ''}
                          onChange={(e) => {
                            const next = e.target.value;
                            field.onChange(next === '' ? '' : Number.parseInt(next, 10));
                          }}
                          className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={handleCalculatePaymentCount}
                        aria-label={t('new.form.savingsCalculateCount')}
                        title={t('new.form.savingsCalculateCount')}
                      >
                        <Calculator className="h-4 w-4" />
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          ) : (
            <div className="max-w-80">
              <FormField
                control={control}
                name="savingsPaymentCount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{`${t('new.form.savingsPaymentCountVarying')} *`}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder={commonT('ui.form.enterPlaceholder')}
                        min={1}
                        step={1}
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) => {
                          const next = e.target.value;
                          field.onChange(next === '' ? '' : Number.parseInt(next, 10));
                        }}
                        className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}

          <div className="max-w-80">
            <FormDatePicker
              name="savingsFirstPaymentDate"
              label={`${t('new.form.savingsFirstPaymentDate')} *`}
              placeholder={commonT('ui.form.enterPlaceholder')}
            />
          </div>

          {lastPaymentDate && savingsPaymentCount && (
            <div className="space-y-1 pl-0.5">
              <p className="flex items-center gap-2 text-sm">
                <CalendarDays className="h-4 w-4" aria-hidden="true" />
                <span>
                  {t('new.form.savingsLastPayment', {
                    date: formatDateLong(lastPaymentDate, locale),
                  })}
                </span>
              </p>
              <p className="text-sm text-muted-foreground">
                {t('new.form.savingsRuntime', {
                  months: savingsPaymentCount,
                })}
              </p>
            </div>
          )}
        </div>
      )}
    </>
  );
}
