'use strict';

var _redux = require('redux');

var redux = _interopRequireWildcard(_redux);

var _common = require('./common');

var _evisitJsUtils = require('evisit-js-utils');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

/* Dispatch multiple dispatches simultaneously based on the data provided,
  the order of dispatch batches is ALWAYS: reset, set, update
  example:
    multiDispatch({
      update: { //Update dispatches for the following
        data: {
          somePartOfTheStore: [...] // This will be dispatched,
          someOtherPartOfTheStore: [...] // This will also be dispatched
        }
      },
      set: {
        //... Same as above, except this will be a "set" operation instead of "update"
      },
      reset: {
        //...
      }
    })
*/
function multiDispatch(store, actions, actionData) {
  function dispatchOperation(operation, thisData, actionTemplate) {
    //Does this action support this operation?
    var actionCreatorName = _evisitJsUtils.utils.getMetaNS(actionTemplate, 'methods', operation),
        thisAction = actions[actionCreatorName];

    if (!thisAction) return;

    //Dispatch operation
    store.dispatch(thisAction(thisData));
  }

  function doStoreDispatches(operation, thisData, actionTemplate) {
    //Object is the only valid thing we can handle
    if (thisData === undefined || !actionTemplate) return;

    var keys = Object.keys(actionTemplate);

    if (keys.length === 0) {
      //Dispatch me
      dispatchOperation(operation, thisData, actionTemplate);
      return;
    }

    for (var i = 0, il = keys.length; i < il; i++) {
      var key = keys[i];
      if (!thisData.hasOwnProperty(key)) continue;

      var thisActionTemplate = actionTemplate[key];
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
    var operations = ['reset', 'set', 'update'];
    for (var i = 0, il = operations.length; i < il; i++) {
      var operation = operations[i];
      if (!actionData.hasOwnProperty(operation)) continue;

      doStoreDispatches(operation, actionData[operation], actions.template);
    }
  }
}

function buildStore(storeTemplate, middleware) {
  var actions = {},
      rootReducer = (0, _common.defineActionsAndReducers)(storeTemplate, actions),
      store = redux.createStore(rootReducer, middleware);

  Object.defineProperties(store, {
    template: {
      writable: true,
      configurable: true,
      enumberable: false,
      value: storeTemplate
    },
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
      value: function value(data) {
        return multiDispatch(store, actions, data);
      }
    },
    multiDispatchReset: {
      writable: true,
      configurable: true,
      enumberable: false,
      value: function value(resetData) {
        return multiDispatch(store, actions, { reset: resetData });
      }
    },
    multiDispatchSet: {
      writable: true,
      configurable: true,
      enumberable: false,
      value: function value(setData) {
        return multiDispatch(store, actions, { set: setData });
      }
    },
    multiDispatchUpdate: {
      writable: true,
      configurable: true,
      enumberable: false,
      value: function value(updateData) {
        return multiDispatch(store, actions, { update: updateData });
      }
    }
  });

  return store;
}

module.exports = Object.assign(module.exports, {
  _actionNameAlias: _common._actionNameAlias,
  INITIAL_STATE: _common.INITIAL_STATE,
  createReducer: _common.createReducer,
  defineActionsAndReducers: _common.defineActionsAndReducers,
  multiDispatch: multiDispatch,
  buildStore: buildStore
}, redux);