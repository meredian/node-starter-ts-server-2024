// Use it to enforce type for literal objects
export const as = <T extends object>(value: T | (() => T)): T =>
  typeof value === 'function' ? value() : value;

export type DeepPartial<T> = T extends object
  ? Partial<{ [k in keyof T]: DeepPartial<T[k]> }>
  : T;
