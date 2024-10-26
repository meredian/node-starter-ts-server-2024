// Use it to enforce type for literal objects
export const as = <T extends object>(value: T | (() => T)): T =>
  typeof value === 'function' ? value() : value;
