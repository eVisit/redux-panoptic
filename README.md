# Redux with templates, brought to you by [eVisit](http://www.evisit.com) [![npm version](https://badge.fury.io/js/redux-panoptic.svg)](https://badge.fury.io/js/redux-panoptic) [![npm](https://img.shields.io/npm/dt/redux-panoptic.svg)](https://www.npmjs.org/package/redux-panoptic) ![MIT](https://img.shields.io/dub/l/vibe-d.svg) ![Platform - All](https://img.shields.io/badge/platform-All-yellow.svg)

A Redux wrapper module that allows you to build out your redux store using templates. 

## Table of contents
- [Install](#install)
- [About](#about)
- [Usage](#usage)
- [More](#more)

## <a name="install"></a>Install

`npm install --save redux-panoptic`

## <a name="about"></a>About

Have you ever found yourself wading through file after file after file... through actions... through reducers, just wanting to make a simple update to your `redux` store? You want to make that simple update, but you have to modify an action, AND a reducer... or possibly more than one. Why does `redux` need to be so complicated and messy? Well, it doesn't! With `redux-panoptic` your `redux` store is built using a plain-object template. Any static values are created in the template are automatically added to the `redux` store with a default state, and actions to update, set, and reset. The template can be deeply nested, or you can create custom reducers (but need not create actions for this reducer... these are created automatically for you). See the magic at work below!

## <a name="usage"></a>Usage

Simply specify a template for your store, and build the store:

```javascript
// Run: `npm run example`

import { applyMiddleware, buildStore, createReducer, _actionNameAlias } from 'redux-panoptic';

// Create some middleware to help us log dispatches
var dispatchActionMiddleware = (store) => (next) => (action) => {
  console.log('Dispatching action [' + action.type + ']: ' + JSON.stringify(action.payload));
  return next(action);
};

// _actionNameAlias = give the ACTIONS for the template an alias for this key name

// Create our store template
var myTemplate = {
  staticValues: {
    boolean: true,
    string: 'Hello world',
    number: 5,
    //This alias makes our actions such: store.actions.(reset|set|update)StaticValuesDEEPHello)
    deeperObject: _actionNameAlias('DEEP', {
      hello: null
    })
  },
  // Create our own custom reducer
  // Notice how arguments are passed to the reducer exactly as they are passed to the action creator
  todos: _actionNameAlias('TODOS', RP.createReducer(function(_todos) {
    // Copy current state
    var newState = { ...this },
        todos = (_todos instanceof Array) ? _todos : [_todos];

    // Loop through array of objects, and map to 'id'
    for (var i = 0, il = todos.length; i < il; i++) {
      var todo = todos[i],
          id = todo.id;
      
      newState[id] = todo;
    }

    // Return our new state
    return newState;
  }, {}))
};

// Build the redux store using our template
var store = buildStore(myTemplate, applyMiddleware(dispatchActionMiddleware));
console.log('Initial store state:\n' + JSON.stringify(store.getState(), undefined, 2));

// Update the store
store.dispatch(store.actions.updateTODOS([
  {
    id: 1,
    description: 'Do something!',
    done: false
  },
  {
    id: 2,
    description: 'Do something else!',
    done: false
  },
  {
    id: 3245,
    description: 'Use redux-panoptic',
    done: true
  }
]));
console.log('Store state #2 (after updating todos):\n' + JSON.stringify(store.getState(), undefined, 2));

// Update a single value, using the action created (note the alias)
store.dispatch(store.actions.setStaticValuesDEEPHello('test'));
console.log('Store state #3 (after updating staticValues.deeperObject.hello):\n' + JSON.stringify(store.getState(), undefined, 2));

// Update multiple values at the same time
store.multiDispatchUpdate({
  staticValues: {
    boolean: false,
    string: 'Hello redux-panoptic templated world!',
    number: 345634
  }
});
console.log('Store state #4 (after updating staticValues.*):\n' + JSON.stringify(store.getState(), undefined, 2));

// Reset the store
store.dispatch(store.actions.resetTODOS());
store.dispatch(store.actions.resetStaticValues());
console.log('Store state #5 (after reset):\n' + JSON.stringify(store.getState(), undefined, 2));
```

## <a name="more"></a>More

For more information please see the <a href="https://github.com/eVisit/redux-panoptic/wiki">WIKI</a>
