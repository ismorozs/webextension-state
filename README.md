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

## Usage
The library object features the following methods:
```js
.add ()
.addPersistent ()
.get ()
.set ()
.resetAll ()
.onChange ()
.removeListener ()
```

Values are added to the store with ```add``` or ```addPersistent``` methods. They perform the same functionality, except ```addPersistent``` allows state to be saved in storage and reused between browser sessions.
Signature of those methods is:
```js
async State.add(
  KeysValues {
    key1: value1,
    key2: value2,
    key3: ComputeFunction(...dependencies) => computedValue
    ...
  }
) =>
  StateAccessors {
    key: StateAccessor
    ...
  }
```
Where:  
```KeysValues``` - a standard object with keys and values, where ```key``` is used to identify a piece of state, and ```value``` to give it a default value or ```ComputeFunction```  
```ComputeFunction``` - reevalutes and updates its value automatically each time ```dependencies``` parameters change. ```dependencies``` parameters are any state values defined before the ```ComputeFunction```. ```computedValue```s are not saved in storage.   
```StateAccessors``` - a map linking state ```key```s to special ```StateAccessor``` objects which will perform data manipulations and listener management.  

**Important: ```add``` and ```addPersistent``` are asynchronous operations; you must `await` or use ```Promise.then``` to ensure all the data is ready to work with!**  
  
  

Values can be accessed with:  
```js
State.get () => StateValues
```
Where:  
```StateValues``` - an object representing all the values in the store in the current namespace at the current moment  
  

or
```js
State.get (AccessorsCallback (StateAccessors {}, State) => value) => value
```
Where:  
```AccessorsCallback``` - a function that takes all ```StateAccessors``` and a ```State``` instance from the current namespace, manipulates them, and can return any ```value```, which in turn will be returned from the whole ```get(Callback)``` call.


Values can be mutated with:
```js
async State.set (
  KeysValues {
    key: value
    ...
  }
) => State
```
**Important: values are updated asynchronously; don't assume the script will recognize the change immediately. Instead, make use of ```onChange``` listeners!**  

To reset all stored values back to defaults:
```js
async State.resetAll () => State
```

To listen and react to state changes:
```js
State.onChange (Keys[], ChangeCallback(newValue, allValues, previousValue) => void) => State
```
Where:  
```Keys``` - array of keys of the state in the current namespace that you want to listen to  
```ChangeCallback``` - function to run when a change happens

To remove the listener:
```js
State.removeListener(Keys, ChangeCallback) => State
```
the same parameter usage. 
  
  
  


Methods ```.set()```, ```.resetAll()```, ```onChange```, and ```removeListener``` all return a new instance of ```State``` with the same namespace, so command chaining is possible.  
Method ```.get(() => {})``` may return a new ```State``` instance.

## Namespacing
To avoid name collisions, put keys with the same name in different namespaces. You can create a new or get an existing namespace with
```js
State.get(String Namespace) => State
```
which will return a new instance of ```State``` with the specified ```Namespace```.

## Shortcuts
The library object itself can be called with different types of arguments, which will mirror almost all of its API.
```js
State() -> State.get()
State(String namespace) -> State.get(namespace)
State(() => {}) -> State.get(() => {})
State({ key: value }) -> State.set({ key: value })
State({}) -> State.resetAll()
State([], () => {}) -> State.onChange([], () => {})
```

## StateAccessor
```StateAccessor``` is a way to manipulate each piece of state individually. It's a function that can be called itself, but also an object with a set of methods:    
```js
.()
.set(value)
.reset()
.onChange(Callback)
.removeListener(Callback)
```
Where:  
```()``` (call the object itself) - returns the value  
```.set(value)``` - sets the value  
```.reset()``` - resets the value  
```.onChange(Callback)``` - adds the listener  
```.removeListener(Callback)``` - removes the listener  
