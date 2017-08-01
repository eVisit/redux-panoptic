import { createStore } from 'redux';
import { defineActionsAndReducers } from './common';
import { utils } from 'evisit-js-utils';

function buildStore(storeTemplate, middleware) {

  console.log('Store template: ', storeTemplate);

  var actions = {},
      rootReducer = defineActionsAndReducers(storeTemplate, actions),
      store = createStore(rootReducer, middleware);

/* Dispatch multiple dispatches simultaneously based on the data provided,
   the order of dispatch batches is ALWAYS: reset, set, update
  example:
    multiDispatch({
      update: { //Update dispatches for the following
        data: {
          patients: [...] // This will be dispatched,
          practices: [...] // This will also be dispatched
        }
      },
      set: {
        //... Same as above, except this will be a "set" operation instead of "update"
      }
    })
*/
  function multiDispatch(actionData) {
    function dispatchOperation(operation, thisData, actionTemplate) {
      //Does this action support this operation?
      let actionCreatorName = utils.getMetaNS(actionTemplate, 'methods', operation),
          thisAction = actions[actionCreatorName];

      if (!thisAction)
        return;

      //Dispatch operation
      store.dispatch(thisAction(thisData));
    }

    function doStoreDispatches(operation, thisData, actionTemplate) {
      //Object is the only valid thing we can handle
      if (thisData === undefined || !actionTemplate)
        return;

      let keys = Object.keys(actionTemplate);

      if (keys.length === 0) {
        //Dispatch me
        dispatchOperation(operation, thisData, actionTemplate);
        return;
      }

      for (var i = 0, il = keys.length; i < il; i++) {
        let key = keys[i];
        if (!thisData.hasOwnProperty(key))
          continue;

        let thisActionTemplate = actionTemplate[key];
        //Dispatch child operations first, if any
        doStoreDispatches(operation, thisData[key], thisActionTemplate);
      }
    }

    if (actionData instanceof Array) {
      for (var i = 0, il = actionData.length; i < il; i++) {
        var action = actionData[i];
        store.dispatch(action);
      }
    } else {
      //Order of operations is reset, set, update
      let operations = ['reset', 'set', 'update'];
      for (var i = 0, il = operations.length; i < il; i++) {
        let operation = operations[i];
        if (!actionData.hasOwnProperty(operation))
          continue;

        doStoreDispatches(operation, actionData[operation], actions.template);
      }
    }
  }

  Object.defineProperties(store, {
    actions: {
      writable: true,
      configurable: true,
      enumberable: false,
      value: actions
    },
    multiDispatch: {
      writable: true,
      configurable: true,
      enumberable: false,
      value: multiDispatch
    },
    multiDispatchReset: {
      writable: true,
      configurable: true,
      enumberable: false,
      value: function(resetData) {
        return multiDispatch({ reset: resetData });
      }
    },
    multiDispatchSet: {
      writable: true,
      configurable: true,
      enumberable: false,
      value: function(setData) {
        return multiDispatch({ set: setData });
      }      
    },
    multiDispatchUpdate: {
      writable: true,
      configurable: true,
      enumberable: false,
      value: function(updateData) {
        return multiDispatch({ update: updateData });
      }      
    }
  });

  return store;
}

module.exports = Object.assign(module.exports, {
  buildStore
});
