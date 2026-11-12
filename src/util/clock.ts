/** Source of the current time, as an ISO 8601 instant. Passed in so that nothing reads the system clock directly. */
export interface Clock {
  now(): string;
}

export class SystemClock implements Clock {
  now(): string {
    return new Date().toISOString();
  }
}

/** A clock that only moves when told to. */
export class FixedClock implements Clock {
  private current: string;

  constructor(start: string) {
    this.current = start;
  }

  now(): string {
    return this.current;
  }

  set(instant: string): void {
    this.current = instant;
  }
}
