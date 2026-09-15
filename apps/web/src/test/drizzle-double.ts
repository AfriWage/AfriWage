import { vi } from 'vitest';

/**
 * A test double for the Drizzle query builder.
 *
 * The org, treasury and payroll routes build queries as method chains that are
 * only awaited at the end (`db.select().from().where().limit()`). Hand-mocking
 * each chain per test is where these suites go to die, so this double accepts
 * any method call, records it, and resolves to the next queued result when the
 * chain is finally awaited.
 *
 * Queued results are consumed first-in-first-out in the order the route awaits
 * them, which makes a test read as "here is what the database returns, in
 * order" rather than as a pile of nested mock factories.
 */

export interface RecordedCall {
  method: string;
  args: unknown[];
}

export interface DrizzleDouble {
  /** The object to substitute for `db`. */
  db: Record<string, unknown>;
  /** Queues the results the next awaited chains resolve to, in order. */
  queue(...results: unknown[]): void;
  /** Every method called on the builder since the last reset, in order. */
  calls: RecordedCall[];
  /** Clears queued results and recorded calls. */
  reset(): void;
}

export function createDrizzleDouble(): DrizzleDouble {
  const results: unknown[] = [];
  const calls: RecordedCall[] = [];

  function nextResult(): unknown {
    return results.length > 0 ? results.shift() : [];
  }

  function createChain(): unknown {
    const target = () => undefined;

    return new Proxy(target, {
      get(_target, property) {
        if (property === 'then') {
          // Awaiting the chain is what resolves it — see the module comment.
          return (
            onFulfilled?: (value: unknown) => unknown,
            onRejected?: (reason: unknown) => unknown
          ) => Promise.resolve(nextResult()).then(onFulfilled, onRejected);
        }

        return (...args: unknown[]) => {
          calls.push({ method: String(property), args });
          return createChain();
        };
      },
    });
  }

  const entryPoint = (method: string) =>
    vi.fn((...args: unknown[]) => {
      calls.push({ method, args });
      return createChain();
    });

  const db: Record<string, unknown> = {
    select: entryPoint('select'),
    insert: entryPoint('insert'),
    update: entryPoint('update'),
    delete: entryPoint('delete'),
    // Routes that write more than one table run inside a transaction. The
    // double runs the callback against the same builder so queued results are
    // consumed in the same order, which is enough to assert what was written;
    // it deliberately does not model rollback.
    transaction: vi.fn(async (callback: (tx: unknown) => Promise<unknown>) => {
      calls.push({ method: 'transaction', args: [] });
      return callback(db);
    }),
  };

  return {
    db,
    queue(...queued: unknown[]) {
      results.push(...queued);
    },
    calls,
    reset() {
      results.length = 0;
      calls.length = 0;
    },
  };
}

/** Returns the arguments of the first recorded call to `method`, if any. */
export function firstCall(calls: RecordedCall[], method: string): unknown[] | undefined {
  return calls.find((call) => call.method === method)?.args;
}
