import Ember from 'ember';
import Task from 'ember-signal/task';

const { 
  assert,
  RSVP: { Promise },
  set 
} = Ember;

function resolvePromise(generatorFn) {
  return () => {
    var generator = generatorFn.apply(this, arguments);

    function handle(result){
      if (result.done) {
        return Promise.resolve(result.value);
      }

      return Promise.resolve(result.value).then(
        res => handle(generator.next(res)), 
        err => {
        // for mirage
        if (err.status === 200) { 
          return handle(generator.next(err.responseText));
        }
        return handle(generator.throw(err));
      });
    }

    try {
      return handle(generator.next());
    } catch (ex) {
      return Promise.reject(ex);
    }
  }
}

// do not allow tasks
function wire(...wireables) {
  wireables.reduce((prev, next) => {
    assert('Tasks are not allowed to wire', !(next instanceof Task));

    set(prev, 'next', next);
    return next;
  });
}

export {
  resolvePromise,
  wire
};