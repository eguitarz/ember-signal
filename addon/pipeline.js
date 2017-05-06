import Ember from 'ember';
import { 
  resolvePromise 
} from 'ember-signal/utils';
import {
  drop, queue
} from './policies';

const { 
  assert,
  get,
  set 
} = Ember;

const policies = { drop, queue };

class Pipeline {
  constructor(tasks, options={}) {
    let { maxConcurrency=Infinity, policy='drop' } = options; 
    assert('Must pass in an integer or infinity for maxConcurrency', Number.isInteger(maxConcurrency) || maxConcurrency === Infinity);
    this.tasks = tasks;
    this.concurrency = 0;

    this.maxConcurrency = maxConcurrency;
    this.policy = policies[policy];
    assert(`Cannot find the policy ${policy}`, this.policy);
    this._queue = [];
  }

  run(signal=true) {
    let isFull = this.concurrency >= this.maxConcurrency;
    signal = this.policy.call(this, { isFull, signal, queue: this._queue });

    if (signal !== undefined) {
      this.concurrency++;
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
      this.onOutput(signal);

      if (this._queue.length !== 0) {
        this.run(this._queue.shift());
      }
    }.bind(this))();
  }

  onOutput(signal) {
    this.concurrency--;
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