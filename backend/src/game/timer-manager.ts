export class TimerManager {
  private timer: NodeJS.Timeout | null = null;
  private interval: NodeJS.Timeout | null = null;
  private duration = 0;
  private remaining = 0;
  private onTickCallback: ((remaining: number) => void) | null = null;
  private onExpireCallback: (() => void) | null = null;

  start(
    durationSeconds: number,
    onTick: (remaining: number) => void,
    onExpire: () => void,
  ) {
    this.clear();
    this.duration = durationSeconds;
    this.remaining = durationSeconds;
    this.onTickCallback = onTick;
    this.onExpireCallback = onExpire;

    // Send initial tick
    if (this.onTickCallback) {
      this.onTickCallback(this.remaining);
    }

    this.interval = setInterval(() => {
      this.remaining--;
      if (this.onTickCallback) {
        this.onTickCallback(this.remaining);
      }

      if (this.remaining <= 0) {
        this.clear();
        if (this.onExpireCallback) {
          this.onExpireCallback();
        }
      }
    }, 1000);
  }

  clear() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  getRemaining(): number {
    return this.remaining;
  }
}
