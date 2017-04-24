import Ember from 'ember';
import Task from 'ember-signal/task';
import Pipeline from 'ember-signal/pipeline';
import { wire } from 'ember-signal/utils';

class Buffer {
  constructor(n=1) {
    this.running = 0;
    this.size = n;
  }

  onInput(signal) {
    this.running++;
    console.log('buffer running', this.running);
    this.applicant._run(signal);
  }

  onSuspend(task) {
    this.running--;
    this.applicant._suspend(task);
    console.log('buffer running', this.running);
  }

  onOutput(signal) {
    this.running--;
    console.log('buffer running', this.running);
    this.applicant._afterRun(signal);
  }
  
}

export default Ember.Controller.extend({
  t1: Task.create({
    fn: function() {
      return '/beef.json';
    }
  }), 
  t2: Task.create({
    fn: function(param) {
      return Ember.$.ajax(param);
    }
  }),
  t3: Task.create({
    fn: function() {
      let points = this.incrementProperty('points')

      if (points === 2) {
        this.set('points', 0);
        return '/foo.json';
      }
    }
  }),
  t4: Task.create({
    fn: function(param) {
      return Ember.$.ajax(param);
    }
  }),

  init() {
    this._super(...arguments);
    let { t1, t2, t3, t4 } = this.getProperties('t1', 't2', 't3', 't4');
    let pipeline = new Pipeline([t1, t2, t3, t4]);
    let pipeline2 = new Pipeline([t1, t1]);
    // wire(pipeline, pipeline2);
    pipeline.applyMiddleware(new Buffer(1));
    this.set('pipeline', pipeline);
    this.set('pipeline2', pipeline2);
  },

  actions: {
    run() {
      this.get('pipeline').run();   
    },

    signal() {
      this.get('pipeline').signal(['h', 'e', 'l', 'l', 'o'], 1000);
    }
  }
});