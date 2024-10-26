export type DeepPartial<T> = T extends object
  ? Partial<{ [k in keyof T]: DeepPartial<T[k]> }>
  : T;
