# Webextension State
Library for managing the state of webextensions, employing reactivity, wrapping and uniting usage of different storages' values and common variables with a simple universal interface.  

## How to install and prepare
Install the library through
```sh
npm install webextension-state
```
then import with
```js
import State from 'webextension-state'
```
in your script file.

## Contents
1. [Usage](#overview)  
[1.1 Creation ```.add()```/```.addPersistent()```](#creation)  
[1.2 Dynamic reevaluation (```ReactiveFunction```)](#reactivefunction)  
[1.3 Accessing ```.get()```](#accessing)  
[1.4 Mutating ```.set()```/```.reset()```](#mutating)  
[1.5 Listening ```.onChange()```/```.removeListener()```](#listening)  
[1.6 Data encapsulation ```.actions()```](#actions)  
[1.7 Namespacing ```.get(Namespace)```](#namespacing)  
[1.8 Method chaining](#chaining)  
2. [Shortcuts](#shortcuts)  
3. [Example](#example)  

## Usage <a name="overview"></a>
The library object features the following methods:
```js
.add ()
.addPersistent ()
.get ()
.set ()
.reset ()
.onChange ()
.removeListener ()
```

## Creation ```.add()```/```.addPersistent()``` <a name="creation"></a>
Values are added to the store with add or addPersistent methods. They perform the same functionality, except addPersistent saves state to the storage and lets you reuse it between browser sessions.

```js
async State.add(
  KeysValues {
    key1: value1,
    key2: value2,
    key3: ReactiveFunction(...valueNames[]) => computedValue
    ...
  }
) => State
```
Where:  
```KeysValues {}``` - a standard object with keys and values, where ```key``` is a name of piece of state, and ```value``` is a default value or ```ReactiveFunction```  
```ReactiveFunction``` - re-evalutes and updates its value automatically each time arguments in ```valueNames``` list change. ```valueNames``` are any state values defined before the ```ReactiveFunction```. ```computedValue```s are not saved in storage.   

**Important: ```add``` and ```addPersistent``` are asynchronous operations; you must `await` or use ```Promise.then``` to ensure all the data is ready to work with!**  
  
## Dynamic reevaluation (```ReactiveFunction```) <a name="reactivefunction"></a>
Values can change automatically with the help of ```ReactiveFunction```s when one or more of the other values in the namespace change.  

```js
ReactiveFunction (...valueNames[]) => computedValue
```
Put the names of dependencies in the  ```valueNames``` arguments list of the ```ReactiveFunction```, and describe the calculation in the body of the function.  
```js
State.add({
  a: 1
  b: 2,
  c: (a, b) => a + b // 3
})
```
  

## Accessing ```.get()``` <a name="accessing"></a>
Values are accessed with:  
```js
State.get() => NamespaceValues {}
```
Where:  
```NamespaceValues {}``` - an object representing all the values in the current namespace at the current moment  

  
  
## Mutating ```.set()```/```.reset()``` <a name="mutating"></a>
Values are mutated with:
```js
async State.set(
  KeysValues {
    key: value
    ...
  }
) => State
```
**Important: values are updated asynchronously; don't assume the script will recognize the change immediately on the next line. Instead, ```await``` or make use of ```onChange``` listeners!**  

To reset values back to defaults:
```js
async State.reset(Keys []) => State
```
Where:  
```Keys[]``` (optional) - array of keys to return to default values. If omitted all values will be returned to defaults.  


## Listening ```.onChange()```/```.removeListener()``` <a name="listening"></a>

To listen and react to state changes:
```js
State.onChange(
  Keys[],
  ChangeCallback(ChangedKeys [], allValues {}, PreviousValues {}) => void
) => State
```
Where:  
```Keys[]``` (optional) - array of keys of the state in the current namespace that you want to listen to. If omitted, ```ChangeCallback``` will run on any value change in the namespace.  
```ChangeCallback``` - function to run when a change happens

To remove the listener:
```js
State.removeListener(
  Keys[],
  ChangeCallback(ChangedKeys [], allValues {}, PreviousValues {}) => void
) => State
```
the same parameter usage. 

## Data encapsulation ```.actions()``` <a name="actions"></a>
Hide away all public data access and mutation into dedicated functions with the help of ```IStateAction```s.  
State.actions({
  KeysActions {
    key1: IStateAction1 (State, ...arguments[]) => void
    key2: IStateAction2 (State, ...arguments[]) => void
    ...
  }
})
```
```IStateAction``` function type binds ```State``` instance as the first argument, followed by all other ```arguments``` provided by the user at the time of the call.  
These actions reside in the same scope as regular variables. So you can access them by the ```key```s defined in ```KeysActions``` object through the ```.get()``` method.
```js
State.add({ x: 1 });

State.actions({
  changeX: (varstor, newX) => varstor.set({ x: newX }), 
}),

State.get().changeX(10);
```
  
## Namespacing ```.get(Namespace)``` <a name="namespacing"></a>
To avoid name collisions, put keys with the same name in different namespaces. You can create a new or get an existing namespace with
```js
State.get(Namespace string) => State
```
which will return a new instance of ```State``` with the specified ```Namespace```.  
  

## Method chaining <a name="chaining"></a>
Methods ```.add```, ```.addPersistent```, ```.set()```, ```.reset()```, ```onChange```, and ```removeListener``` all return a new instance of ```State``` with the same namespace, so method chaining is possible.  


## Shortcuts <a name="shortcuts"></a>
The library/namespace object itself can be called with different types of arguments, which will mirror almost all of its API.
```js
State() -> State.get()
State(String namespace) -> State.get(namespace)
State({ key: value }) -> State.set({ key: value })
State([], () => {}) -> State.onChange([], () => {})
```

## Example <a name="example"></a>
```js
function onChange(changes, values, data) {
  console.log("onChange", changes, values, data);
}

State.add({
  a: 10,
  b: 20,
  c: (a, b) => a + b,
});

await State.addPersistent({
  d: 40,
});

console.log(State.get()); // {a: 10, b: 20, c: 30, d: 40}

State.onChange(["a", "b", "c", "d"], onChange);
State.onChange(onChange);

await State.set({ a: 20, b: 88, d: 60 });
console.log(State.get()); // {a: 20, b: 88, c: 108, d: 60}

await State.reset(["b"]);
console.log(State.get()); // {a: 20, b: 20, c: 40, d: 60}

await State.reset();
console.log(State.get()); // {a: 10, b: 20, c: 30, d: 40}

State.removeListener(["a", "b", "c", "d"], onChange);
State.removeListener(onChange);

const newNamespace = State("new namespace");

await newNamespace.add({
  x: 1,
  y: 2,
  z: 3,
});

newNamespace.actions({
  logValues: ({ get }) => {
    const { x, y, z } = get();
    console.log(`x: ${x}, y: ${y}, z: ${z}`);
  },
  multiplyX: ({ get, set }, num) => set({ x: get().x * num }),
  incrementY: ({ get, set }) => set({ y: get().y + 1 }),
})

const { logValues, multiplyX, incrementY } = newNamespace.get();

logValues(); // x: 1, y: 2, z: 3
multiplyX(10)
incrementY();
logValues(); // x: 10, y: 3, z: 3

await newNamespace({ z: 110 });

console.log(State("new namespace").get()); // {x: 10, y: 3, z: 110, logValues: ƒ, multiplyX: ƒ, …}
```