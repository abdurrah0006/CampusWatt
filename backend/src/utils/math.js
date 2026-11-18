export const round = (value, decimals = 2) => {
  const f = 10 ** decimals;
  return Math.round((Number(value) + Number.EPSILON) * f) / f;
};

export const sum = (values) => values.reduce((acc, v) => acc + (Number(v) || 0), 0);

export const average = (values) => (values.length ? sum(values) / values.length : 0);

/** Percentage change from `previous` to `current`, or null when not computable. */
export const percentChange = (current, previous) =>
  previous > 0 ? round(((current - previous) / previous) * 100, 1) : null;
