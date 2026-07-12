const browser = require("webextension-polyfill/dist/browser-polyfill.min");

const STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/gm;
const ARGUMENT_NAMES = /([^\s,]+)/g;

const STATE = {};
const ACCESSORS = {};
const COMPUTED_DEPENDENCIES = {};
const COMPUTED_ARGUMENTS = {};


if (isBackgroundScript()) {
  browser.storage.session.onChanged.addListener(onStorageChange);
  browser.storage.local.onChanged.addListener(onStorageChange);
}


async function addPersistentState (initialState) {
  return await addState(initialState, true);
}

async function addState (initialState, isPersistent) {
  const storageType = isPersistent && "local" || isBackgroundScript() && "session";
  const defaultValues = Object.assign({}, initialState); 

  if (isBackgroundScript()) {
    Object.assign(
      initialState,
      await browser.storage[storageType].get(),
    );
  }

  const accessors = {};
  for (const key in initialState) {
    accessors[key] = setupValue(key, initialState[key], defaultValues[key], storageType);
  }

  Object.assign(ACCESSORS, accessors);
  return accessors;
}

function setupValue (key, value, defaultValue, storageType) {
  const isComputedValue = typeof value === "function";

  if (isComputedValue) {
    setupDependencies(key, value);
  }

  STATE[key] = {
    value: isComputedValue ? value.apply(null, getArguments(key)) : value,
    computeFn: value,
    listeners: [],
    defaultValue,
  };

  return createAccessor(key, value, storageType);
}

function createAccessor(key, value, storageType) {
  const accessor = {
    valueOf: () => STATE[key].value,
    toString: () => STATE[key].value,
    set: (value) => setValue(key, value, storageType),
    onChange: (cb) => (STATE[key].listeners = STATE[key].listeners.concat(cb)),
    removeListener: (removeCb) =>
      (STATE[key].listeners = STATE[key].listeners.filter(
        (cb) => cb !== removeCb,
      )),
    reset: () => setValue(key, STATE[key].defaultValue, storageType),
  };

  return new Proxy(accessor, {
    get: (target, prop) => {
      if (Object.keys(accessor).includes(prop)) {
        return target[prop];
      }

      return STATE[key].value[prop];
    },
  });
}

function setValue (key, value, storageType) {
  if (storageType) {
    return browser.storage[storageType].set({ [key]: value });
  }

  onStorageChange({ [key]: { newValue: value } });
}

function onStorageChange (changes) {
  const realChanges = {};

  for (const key in changes) {
    const prevValue = STATE[key].value;
    const newValue = changes[key].newValue;

    if (prevValue !== newValue) {
      STATE[key].value = newValue;
      realChanges[key] = prevValue;

      updateDependencies(key, realChanges);
    }
  }

  for (const key in realChanges) {
    STATE[key].listeners.forEach((cb) => cb(STATE[key].value, getStateValues(), realChanges[key]));
  }
}

function updateDependencies (key, realChanges) {
  const computedDependencies = COMPUTED_DEPENDENCIES[key];
  if (computedDependencies) {
    computedDependencies.forEach((name) => {
      const prevValue = STATE[name].value;
      const newValue = STATE[name].computeFn.apply(null, getArguments(name));
      if (prevValue !== newValue) {
        STATE[name].value = newValue;
        realChanges[name] = prevValue;
        updateDependencies(name, realChanges);
      }
    });
  }
}

function getStateValues () {
  const newObj = {};

  for (const key in STATE) {
    newObj[key] = STATE[key].value;
  }

  return newObj;
}

function isBackgroundScript() {
  return (
    window.location.protocol === "chrome-extension:" ||
    window.location.protocol === "moz-extension:"
  );
}

function getParamNames(fn) {
  const fnStr = fn.toString().replace(STRIP_COMMENTS, "");
  const names = fnStr
    .slice(fnStr.indexOf("(") + 1, fnStr.indexOf(")"))
    .match(ARGUMENT_NAMES);

  if (names === null) {
    return [];
  }

  return names;
}

function setupDependencies(computedValueName, computeFn) {
  const paramNames = getParamNames(computeFn);
  COMPUTED_ARGUMENTS[computedValueName] = paramNames;

  paramNames.forEach((param) => {
    if (COMPUTED_DEPENDENCIES[param]) {
      COMPUTED_DEPENDENCIES[param].push(computedValueName);
    } else {
      COMPUTED_DEPENDENCIES[param] = [computedValueName];
    }
  });
}

function getArguments (computedName) {
  const values = getStateValues();
  return COMPUTED_ARGUMENTS[computedName].map((name) => values[name]).concat(values);
}

function getAccessor () {
  return { ...ACCESSORS };
}

function resetAll () {
  Object.entries(ACCESSORS).forEach((k, { reset }) => reset());
}

export default {
  add: addState,
  addPersistent: addPersistentState,
  get: getAccessor,
  resetAll,
};
