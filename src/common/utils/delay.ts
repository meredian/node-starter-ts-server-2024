export const delay = (delayInMs: number) =>
  new Promise(res => {
    const timeout = setTimeout(() => {
      clearTimeout(timeout);
      res(undefined);
    }, delayInMs);
  });
