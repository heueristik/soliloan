import moment from 'moment';

export const getDefaultFirstDepositDate = (signDate: unknown) => {
  const base = signDate instanceof Date ? signDate : signDate ? moment(signDate).toDate() : new Date();
  return moment(base).add(1, 'month').startOf('month').toDate();
};

export const calculateSavingsLastDepositDate = (firstDepositDate: unknown, depositCount: unknown) => {
  if (!firstDepositDate || !depositCount) return null;

  const firstMoment = moment(firstDepositDate instanceof Date ? firstDepositDate : (firstDepositDate as string));
  if (!firstMoment.isValid()) return null;

  const count = Number(depositCount);
  if (!Number.isFinite(count) || count < 1) return null;

  const lastMoment = firstMoment.clone().add(count - 1, 'months');
  return lastMoment.isValid() ? lastMoment.toDate() : null;
};
