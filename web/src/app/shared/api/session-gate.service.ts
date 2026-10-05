import { Injectable } from '@angular/core';

/**
 * Tracks in-flight session-establishing calls (login / signup).
 *
 * A request sent before sign-in completes can come back 401 *after* the
 * session already exists. The API error interceptor uses this gate to wait
 * for pending sign-in calls and, if a session was established after the
 * request went out, retry it instead of bouncing the user to /login.
 */
@Injectable({ providedIn: 'root' })
export class SessionGate {
  private readonly pending = new Set<Promise<unknown>>();
  private _epoch = 0;

  /** Increments every time a login/signup call succeeds. */
  get epoch(): number {
    return this._epoch;
  }

  /** Register a login/signup call; returns the same promise. */
  track<T>(call: Promise<T>): Promise<T> {
    this.pending.add(call);
    call.then(
      () => {
        this._epoch++;
        this.pending.delete(call);
      },
      () => this.pending.delete(call),
    );
    return call;
  }

  /** Resolves once every currently in-flight login/signup call has settled. */
  async whenIdle(): Promise<void> {
    while (this.pending.size > 0) {
      await Promise.allSettled([...this.pending]);
    }
  }
}
