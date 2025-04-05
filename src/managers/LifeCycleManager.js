export default class LifecycleManager {
  constructor() {
    this.cleanupFns = [];
  }

  register(fn) {
    this.cleanupFns.push(fn);
  }

  cleanupAll() {
    this.cleanupFns.forEach(fn => fn?.());
    this.cleanupFns = [];
  }
}
