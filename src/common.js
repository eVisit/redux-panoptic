import { utils } from 'evisit-core-js';
import { regExpEscape } from './utils';

const ACTION_SEPARATOR = '/',
      INITIAL_STATE = {};

// Default reducer for default object reducers
function defaultReducer(state, action, defaultValue) {
  // Merge objects only merges if the key exists in the template
  // This makes it so users can not polute the store
  function mergeObjects(obj1, obj2) {
    var newObject = {},
        keys = Object.keys(obj1);

    for (var i = 0, il = keys.length; i < il; i++) {
      var key = keys[i];
      if (!obj2.hasOwnProperty(key))
        newObject[key] = obj1[key];
      else
        newObject[key] = obj2[key];
    }

    return newObject;
  }

  var actionMethod = action.method,
      payload = action.payload[0];
  
  if (actionMethod === 'reset')
    return defaultValue;

  if (!payload)
    return state;

  return (actionMethod === 'set') ? mergeObjects(defaultValue, payload) : mergeObjects(state, payload);
}

// Get the default state for any reducer tree
function getDefaultState(subAction, reducerMap) {
  let keys = Object.keys(reducerMap),
      newState = {};

  //Loop through every reducer
  for (let i = 0, il = keys.length; i < il; i++) {
    let key = keys[i],
        subReducer = reducerMap[key],
        reducerState = subReducer(undefined, subAction);

    //Call reducer... it will return its default state if this action isn't handled
    newState[key] = reducerState;
  }

  return newState;
}

// This creates a default reducer for a "object" grouping in the template
// Put another way, every "sub-object" in the template gets a default reducer
function createDefaultReducer(reducerMap, boundAction) {
  return function(state, action) {
    let actionParts = (action.type) ? ('' + action.type).split(ACTION_SEPARATOR) : [],
        actionName = actionParts[0];

    let subAction = {
          ...action,
          type: actionParts.slice(1).join(ACTION_SEPARATOR)
        };

    if (state === undefined) {
      return getDefaultState(subAction, reducerMap);
    } else {
      if (!actionName)
        return defaultReducer(state, action, getDefaultState({}, reducerMap));

      let subReducer = reducerMap[actionName];
      if (subReducer instanceof Function) {
        let newState = {...state};
        newState[actionName] = subReducer(state[actionName], subAction);
        return newState;
      }

      return state;
    }
  };
}

// This creates a wrapper around a user specified function (reducer)
// It changes the arguments such that this = state, and action is the last argument
// The other arguments are specified as the payload from the action, which is always an array
function createCustomReducer(customReducer, boundAction) {
  return function(_state, action) {
    let state = _state,
        payload = action.payload;

    if (!action.method && (state === undefined || state === null)) {
      if (!(customReducer instanceof Function))
        return customReducer;

      state = INITIAL_STATE;
    }
    
    if (!(customReducer instanceof Function))
      return (action.method === 'reset') ? customReducer : action.payload[0];

    if (!payload)
      payload = [];

    if (!(payload instanceof Array))
      payload = [payload];

    return customReducer.apply(state, payload.concat(action));
  };
}

// This is factory to quickly create a function that returns an action object
function createReducerAction(actionType, actionMethod) {
  function actionCreator(...args) {
    return { type: actionType, payload: args, method: actionMethod };
  }

  // Store action name in function object
  Object.defineProperty(actionCreator, 'actionName', {
    writable: false,
    enumberable: false,
    configurable: false,
    value: actionType
  });

  return actionCreator;
}

// This is a helper function for creating custom reducers outside the template
// Any time a function is encountered in the template the system assumes it is a custom reducer
// Create those functions with this (see app/store/template/common for an example)
function createReducer(reducerFunc, defaultValue) {
  return function(...args) {
    if (this === INITIAL_STATE)
      return defaultValue;

    let action = args[args.length - 1] || {},
        actionMethod = action.method;

    if (actionMethod === 'set')
      return reducerFunc.apply(defaultValue, args);
    else if (actionMethod === 'reset')
      return defaultValue;

    //Update
    return reducerFunc.apply(this, args);
  };
}

// Create forward slash separated action names
function fullActionType(parent, key) {
  let actionType = [];

  if (parent)
    actionType.push(parent);

  if (key)
    actionType.push(key);

  return actionType.join(ACTION_SEPARATOR);
}

// This method mutates the action name into a friendly function name (a function that returns the action object)
function actionTypeToActionCreatorName(actionType, actionMethod) {
  let fullActionName = ('' + actionType)
    .replace(/\/(\w)/g, function(m, p) {
      return p.toUpperCase();
    });

  return actionMethod + fullActionName.charAt(0).toUpperCase() + fullActionName.substring(1);
}

function setPublicActionCreator(actionMap, actionType, actionName, actionMethod, type) {
  let actoionCreatorName = actionTypeToActionCreatorName(actionName, actionMethod);
  actionMap[actoionCreatorName] = createReducerAction(actionType, actionMethod);
  //console.log('Setting action: ', actoionCreatorName, actionType, actionName, actionMethod);

  //Get the path into the template, and get any current template object (if any)
  let actionPath = actionType.replace(new RegExp(regExpEscape(ACTION_SEPARATOR), 'g'), '.'),
      templatePath = 'template.' + actionPath,
      templateActionObj = utils.get(actionMap, templatePath, {});

  //If this is a property, set a meta flag saying it is
  if (type === 'property')
    utils.setMeta(templateActionObj, 'property', true);

  //Set the acceptable methods for this action on the meta object
  utils.setMetaNS(templateActionObj, 'methods', actionMethod, actoionCreatorName);

  //Update the action template
  utils.set(actionMap, templatePath, templateActionObj);
}

// Walk the template and create reducers / actions
function defineActionsAndReducers(template, actionMap, parentActionType, parentActionName, myKeyName) {
  let keys = Object.keys(template),
      reducerMap = {};

  for (let i = 0, il = keys.length; i < il; i++) {
    let key = keys[i];
    if (key.charAt(0) === '_')
      continue;

    let val = template[key],
        actionType = fullActionType(parentActionType, key),
        actionName = fullActionType(parentActionName, key);

    if (val instanceof Function) {
      //Override the name if we have an alias
      if (val.hasOwnProperty('_actionNameAlias'))
        actionName = fullActionType(parentActionName, val._actionNameAlias);
        
      //Custom reducer
      reducerMap[key] = createCustomReducer(val, key);
      setPublicActionCreator(actionMap, actionType, actionName, 'set', 'reducer');
      setPublicActionCreator(actionMap, actionType, actionName, 'update', 'reducer');
      setPublicActionCreator(actionMap, actionType, actionName, 'reset', 'reducer');
    } else if (val && val instanceof Object && !(val instanceof Array) && !(val instanceof String) && !(val instanceof Number) && !(val instanceof Boolean)) {
      //Override the name if we have an alias
      if (val.hasOwnProperty('_actionNameAlias'))
        actionName = fullActionType(parentActionName, val._actionNameAlias);

      //Walk
      if (parentActionName) {
        setPublicActionCreator(actionMap, actionType, actionName, 'set', 'template');
        setPublicActionCreator(actionMap, actionType, actionName, 'update', 'template');
      }
      
      if (!actionName)
        setPublicActionCreator(actionMap, actionType, fullActionType(parentActionName, key), 'reset', 'template');
      else
        setPublicActionCreator(actionMap, actionType, actionName, 'reset', 'template');

      reducerMap[key] = defineActionsAndReducers(val, actionMap, actionType, actionName, key);
    } else {
      // This is a static property... treat it as "defaults", but also add helper actions to change them
      reducerMap[key] = createCustomReducer(val, key);
      setPublicActionCreator(actionMap, actionType, actionName, 'set', 'property');
      setPublicActionCreator(actionMap, actionType, actionName, 'update', 'property');
      setPublicActionCreator(actionMap, actionType, actionName, 'reset', 'property');
    }
  }

  return createDefaultReducer(reducerMap, myKeyName);
}

function _actionNameAlias(name, obj) {
  obj._actionNameAlias = name;
  return obj;
}

module.exports = Object.assign(module.exports, {
  _actionNameAlias,
  INITIAL_STATE,
  createReducer,
  defineActionsAndReducers
});
