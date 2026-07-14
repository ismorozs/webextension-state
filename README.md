# Webextension State
Library for managing the state of webextensions, employing reactivity, wrapping and uniting usage of different storages' values and common variables with a simple universal interface.  

## How to install and prepare
Install the library through
```sh
npm install webextension-state
```
then import with
```js
import WebextensionState from 'webextension-state'
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

To operate on data, first you should add it to the store with either ```add``` or ```addPersistent``` methods. They perform the same functionality, except ```addPersistent``` allows state to be saved in storage and reused between browser sessions.
Signature of those methods is:
```js
async add(
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

**Important: ```add``` and ```addPersistent``` are asynchronous operations; you must `await` or use ```Promise.then``` to be sure that data is all set!**  
  
  

After data is added, it can be accessed with:  
```js
get () => StateValues
```
Where:  
```StateValues``` - an object representing all the values in the store at the current moment  
  

or
```js
get (Callback (Accessors {}) => value) => value
```
Where:  
```Callback``` - a function that takes all ```StateAccessors```, manipulates them, and can return any ```value```, which in turn will be returned from the whole ```get(Callback)``` call.


Data can be mutated with:
```js
async set (
  KeysValues {
    key: value
    ...
  }
)
```
**Important: values are updated asynchronously; don't assume the script will recognize the change immediately. Instead, make use of ```onChange``` listeners!**  

To reset all stored values back to defaults:
```js
async resetAll ()
```

To listen and react to state changes:
```js
onChange (Keys[], ChangeCallback(newValue, allValues, previousValue) => void)
```
Where:  
```Keys``` (optional) - array of keys of state that you want to listen to. If omitted, ```ChangeCallback``` will run each time any state value change  
```ChangeCallback``` - function to run when a change happens

To remove the listener:
```js
removeListener(Keys, ChangeCallback)
```
the same parameter usage

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
