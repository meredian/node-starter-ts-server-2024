export const deepFreezeSilent = <T extends object>(obj: T) => {
  for (const prop in obj) {
    if (typeof obj[prop] === 'object' && !Object.isFrozen(obj[prop])) {
      deepFreezeSilent(obj[prop] as object);
    }
  }
  return Object.freeze(obj) as T;
};
