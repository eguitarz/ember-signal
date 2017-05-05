import Ember from 'ember';
import { 
  resolvePromise 
} from 'ember-signal/utils';

const { 
  get,
  set 
} = Ember;

class Pipeline {
  constructor(tasks, buffer) {
    this.tasks = tasks;
    this.buffer = buffer;
  }

  run(signal=true) {
    let { buffer } = this;
    if (buffer) {
      signal = buffer.onInput(signal);
    }

    if (signal !== undefined) {
      this._run(signal);
    }
  }

  _run(signal) {
    let taskGen = (function* () { 
      yield* this.tasks; 
    }.bind(this))();
    set(this, 'input', signal);

    resolvePromise(function* () {
      let _task = taskGen.next();

      while(!_task.done) {
        let task = _task.value;
        let runnerGen = task.run(signal);
        signal = yield runnerGen.next().value;

        runnerGen.next(signal);
        _task = taskGen.next();
      }

      set(this, 'output', signal);
      this.buffer.onOutput();
      this.onOutput(signal);

      if (!this.buffer.isQueueEmpty()) {
        this.run(this.buffer.shift());
      }
    }.bind(this))();
  }

  onOutput(signal) {
    let next = get(this, 'next');
    if (next) { next.run(signal); }
  }

  signal(sigs, interval=0) {
    let _sigs = sigs.slice();
    let self = this;
    
    (function run() {
      let sig = _sigs.shift();

      if (sig) {
        self.run(sig);
        Ember.run.later(self, run, interval);
      }
    })();
  }
}

export default Pipeline;