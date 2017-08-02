// Run: `npm run example`

var RP = require('../dist/store'),
    applyMiddleware = RP.applyMiddleware,
    buildStore = RP.buildStore,
    createReducer = RP.createReducer,
    _actionNameAlias = RP._actionNameAlias;

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