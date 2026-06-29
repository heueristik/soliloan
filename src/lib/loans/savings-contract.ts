import moment from 'moment';

export const getDefaultFirstPaymentDate = (signDate: unknown) => {
  const base = signDate instanceof Date ? signDate : signDate ? moment(signDate).toDate() : new Date();
  return moment(base).add(1, 'month').startOf('month').toDate();
};

export const calculateSavingsLastPaymentDate = (firstPaymentDate: unknown, paymentCount: unknown) => {
  if (!firstPaymentDate || !paymentCount) return null;

  const firstMoment = moment(firstPaymentDate instanceof Date ? firstPaymentDate : (firstPaymentDate as string));
  if (!firstMoment.isValid()) return null;

  const count = Number(paymentCount);
  if (!Number.isFinite(count) || count < 1) return null;

  const lastMoment = firstMoment.clone().add(count - 1, 'months');
  return lastMoment.isValid() ? lastMoment.toDate() : null;
};
