/** Discriminator all operator-based filter values will share (future: text, number, …) */
export type FilterOperatorValue<TOperator extends string, TPayload = object> = {
  operator: TOperator;
} & TPayload;
