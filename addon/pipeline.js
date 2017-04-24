import Ember from 'ember';
import { resolvePromise } from 'ember-signal/utils';

const { 
  get,
  set 
} = Ember;

class Pipeline {
  constructor(tasks) {
    this.tasks = tasks;
  }

  run(signal) {
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
        
        if (signal === undefined) {
          this.suspend(task);
          return;
        }

        runnerGen.next(signal);
        _task = taskGen.next();
      }

      set(this, 'output', signal);
      this.afterRun(signal);
    }.bind(this))();
  }

  suspend(task) {
    task.set('status', 'suspended');
  }

  afterRun(signal) {
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

  applyMiddleware(middleware) {
    middleware.applicant = this;

    this._run = this.run;
    this.run = middleware.onInput.bind(middleware);

    this._suspend = this.suspend;
    this.suspend = middleware.onSuspend.bind(middleware);
    
    this._afterRun = this.afterRun;
    this.afterRun = middleware.onOutput.bind(middleware);
  }
}

export default Pipeline;