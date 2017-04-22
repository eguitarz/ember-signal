import Ember from 'ember';

export default Ember.Object.extend({
  runs: 0,
  failures: 0,
  isRunning: false,
  status: 'idle',

  * run(signal) {
    this.set('input', signal);

    let fn = this.get('fn');

    try {
      this.set('isRunning', true);
      this.set('status', 'running');
      signal = yield fn.call(this, signal);

      this.set('output', signal);
    } catch (e) {
      console.error(e);

      this.set('status', 'error');
      if (this.errorHandler) {
        this.errorHandler(e);
      } else {
        throw e;
      }
      this.incrementProperty('failures');
    } finally {
      this.incrementProperty('runs');
    }

    this.set('isRunning', false);
    this.set('status', 'idle');

    return signal;
  }
});