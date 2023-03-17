export class Mutex {
  private locker: Int32Array = new Int32Array(1)

  lock() {
    Atomics.compareExchange(this.locker, 0, 0, 1)
  }

  unlock() {
    Atomics.store(this.locker, 0, 0)
    Atomics.notify(this.locker, 0)
  }

  async asyncWith<A>(f: () => Promise<A>): Promise<A> {
    this.lock()
    const result = await f()
    this.unlock()
    return result
  }

  with<A>(f: () => A): A {
    this.lock()
    const result = f()
    this.unlock()
    return result
  }
}
