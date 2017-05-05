import Ember from 'ember';
import Task from 'ember-signal/task';
import Pipeline from 'ember-signal/pipeline';
import { wire } from 'ember-signal/utils';

let drop = ({isFull, signal}) => {
  if (isFull) {
  } else {
    return signal;
  }
};

let queue = ({ isFull, signal, _queue }) => {

  if (isFull) {
    _queue.push(signal);
    return undefined;
  } else {
    return signal;
  }
};

let policies = {
  drop,
  queue
};

class Buffer {
  constructor(n=1, policy='drop') {
    this.running = 0;
    this.size = n;
    this.policy = policies[policy];
    this._queue = [];
  }

  onInput(signal) {
    let { running, size, _queue } = this;

    let isFull = this.running >= this.size;
    signal = this.policy.call(this, { isFull, signal, running, size, _queue});

    if (signal !== undefined) {
      this.running++;
    }

    return signal;
  }

  shift() {
    return this._queue.shift();
  }

  onOutput() {
    this.running--;
  }

  isQueueEmpty() {
    return this._queue.length === 0;
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
    let pipeline = new Pipeline([t1, t2, t3, t4], new Buffer(1));
    let pipeline2 = new Pipeline([t1, t1]);
    wire(pipeline, pipeline2);
    this.set('pipeline', pipeline);
    this.set('pipeline2', pipeline2);
  },

  actions: {
    run() {
      this.get('pipeline').run();   
    },

    signal() {
      this.get('pipeline').signal(['h', 'e', 'l', 'l', 'o'], 100);
    }
  }
});