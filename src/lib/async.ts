// src/lib/async.ts
export class CancellationError extends Error {
  constructor(message = 'Cancelled') {
    super(message);
    this.name = 'CancellationError';
  }
}

// Wrap a promise with a timeout that rejects with CancellationError
export function withTimeout<T>(p: Promise<T>, ms: number, reason = 'Timeout'): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new CancellationError(reason)), ms);
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      }
    );
  });
}

// Make a cancelable operation based on AbortController
export function makeCancelable<T>(executor: (signal: AbortSignal) => Promise<T>) {
  const controller = new AbortController();
  const { signal } = controller;

  const promise = executor(signal);
  const cancel = (reason = 'Cancelled') => controller.abort(new CancellationError(reason));
  return { promise, cancel, signal };
}
