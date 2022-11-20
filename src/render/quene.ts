const queue = new Set();

let isFlushing = false;
const p = Promise.resolve();

type Fn = (...args: any[]) => any;

export function queueJob(job: Fn) {
  queue.add(job);

  if (!isFlushing) {
    isFlushing = true;
    p.then(() => {
      try {
        queue.forEach((j) => j());
      } finally {
        isFlushing = false;
        queue.clear();
      }
    });
  }
}
