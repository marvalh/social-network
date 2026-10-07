export interface Throttled {
  (): void;
  cancel: () => void;
}

export function throttle(fn: () => void, wait: number): Throttled {
  let lastRun = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const throttled = () => {
    const remaining = wait - (Date.now() - lastRun);

    if (remaining <= 0) {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      lastRun = Date.now();
      fn();
    } else if (!timer) {
      timer = setTimeout(() => {
        timer = null;
        lastRun = Date.now();
        fn();
      }, remaining);
    }
  };

  throttled.cancel = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };

  return throttled;
}