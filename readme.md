# Profunctor State HOC

*React Higher-order component for state management with Profunctor Optics*

A simple and small (2.8KB!) approach to state management in React using functional lenses (a type of profunctor optics). A lens is made of two functions: **get** (like selectors in Redux, or computed values in MobX) and **set** (the opposite of a selector, creates new parent state). This way, parent state and child state are kept in sync, updating back and forth automatically.

```
npm install --save @staltz/with-profunctor-state
```

See also [@staltz/**use**-profunctor-state](https://github.com/staltz/use-profunctor-state).

## Example

Suppose your app handles temperatures in Fahrenheit, but one component works only with Celsius. You can create a conversion layer between those two with `promap(get, set)`.

Open this also in a [CodeSandbox](https://codesandbox.io/s/0yy62jrjkw).

```js
const initialState = {fahrenheit: 70, other: {}}

function ProApp({state, setState, promap}) {
  const celsiusProf = promap(
    state => fToC(state.fahrenheit),
    (celsius, state) => ({ ...state, fahrenheit: cToF(celsius) })
  );

  return (
    <div>
      <div>Global app state: {JSON.stringify(state)}</div>
      <ProThermometer {...celsiusProf} />
    </div>
  );
}

const App = withProfunctorState(ProApp, initialState);
```

Because promap is composable, you can also split the conversion layer into multiple parts:

```js
const celsiusProf = promap(
  state => state.fahrenheit,
  (f, state) => ({ ...state, fahrenheit: f })
)
.promap(fToC, cToF);
```

The ProThermometer component received props `state`, `setState` and `promap` from the spread of `celsiusProf`:

- `state`: in this case it's a number representing celsius
- `setState`: does what you think it does!
- `promap`: use this if ProThermometer would have children components

```js
function ProThermometer({ state, setState, promap }) {
  const onColder = () => setState(prev => prev - 5);
  const onHotter = () => setState(prev => prev + 5);
  return (
    <div>
      <button onClick={onColder}>Colder</button>
      <button onClick={onHotter}>Hotter</button>
      <Thermometer value={state} max="100" steps="4" format="°C" />
    </div>
  );
}
```

## Benefits

#### Simpler architecture

- Global app state == Props == Local component state
- No actions, no reducers, no dispatch, no store
- Selector/unselector conversion layers in the component tree

#### Familiar

- `state` and `setState` work just like you would assume
- Easy to migrate your apps to use profunctors

#### Fractal

- Build the parent components like you build the smaller components
- Same pattern applies to all components, both Presentational and Container

#### Decoupling

- Every child component assumes nothing about its parent component
- Pro Components can be published to NPM as-is

#### Functional

- Lenses are composable and operate immutably, just like Redux selectors
- Chain `.promap` calls like you would chain `.map` calls
- Backed by [mathematical theory](https://github.com/hablapps/DontFearTheProfunctorOptics/)

#### Performance similar to Redux

- Sprinkle `React.memo()` here and there to avoid full-app rerenders

#### Small: 2.8 KB and 65 lines of code

#### TypeScript support

## Downsides

Compared to Redux and similar (ngrx, Vuex):

- No actions means no support for Redux DevTools
- For preventing performance issues, better use `React.memo` (almost always?)
- This library itself is not used in production yet

## API

#### `withProfunctorState(ProComponent, initial)`

Higher-order component that accepts as input a Pro Component (component that wants props `state`, `setState`, `promap`, see below for more info), an initial state object, and returns a new component that provides the initial state to the Pro Component.

## Pro Components

A Pro Component is any component that expects all or some of these props `{state, setState, promap}`.

- `state`: the data, initially this will be `initial`
- `setState`: works just like React's traditional setState
  - `setState(newState)` or
  - `setState(prev => ...)`
- `promap(get, set)`: creates a new profunctor state object based on the current one, given two functions:
  - `get: parentState => childState`
  - `set: (newChild, oldParent) => newParent`

Promap also alternatively supports a lens object, which is simply `promap({get, set})` instead of `promap(get, set)`. This is useful in case you want to publish a lens object elsewhere and simply pass it into the promap.

A Pro Component can put its local state in the `state` prop using `setState`. You can also think of this `setState` as `setProps`. Writing components in this style is familiar, because `setState` works just like the traditional API.

However, now we have the added benefit that Pro Components can be published as-is (they are just functions!) to NPM, and there is no need to import `@staltz/with-profunctor-state` as a dependency of a Pro Component. This way you get encapsulated and composable pieces of state management that can be shared across applications. Pro Components can either be presentational or logic-heavy container components.

## FAQ

#### What about performance?

By default, each child's `setState` will cause a top-level state update (up until `withProfunctorState`) which will rerender the entire hierarchy below. This is a bad thing, but it's not unlike Redux, where you need to carefully design `shouldComponentUpdate`. With profunctor state, just add `React.memo` to a Pro Component and that should do the same as `shouldComponentUpdate`, remember to also use the `propsAreEqual` argument too.

```diff
-const ProThermometer = ({ state, setState, promap }) => {
+const ProThermometer = React.memo(({ state, setState, promap }) => {
   const onColder = () => setState(prev => prev - 5);
   const onHotter = () => setState(prev => prev + 5);
   return (
     <div>
       <button onClick={onColder}>Colder</button>
       <button onClick={onHotter}>Hotter</button>
       <Thermometer value={state} max="100" steps="4" format="°C" />
     </div>
   );
-}
+}, (prev, next) => prev.state === prev.next);
```

Check [this CodeSandbox](https://codesandbox.io/s/mmpql0mvxy) with `React.memo` usage, where background colors change upon re-render.

#### Can I still have truly internal local state?

Yes. With React Hooks (See [@staltz/use-profunctor-state](https://github.com/staltz/use-profunctor-state) hook) it will be easy to add the `useState` into a function Pro Component, but before hooks become official in React, you'll have to rely on normal class components to use the traditional `this.setState`. Note that this may raise some confusion, as you'll have both `this.props.setState` (shared with the parent) and `this.setState` (internal local state). For instance:

```diff
 class ProThermometer extends Component {
+  state = {steps: 4};

   lessHeat = () => this.props.setState(prev => prev - 5);

   moreHeat = () => this.props.setState(prev => prev + 5);

   render() {
    return (
      <div>
        <button onClick={this.lessHeat}>Colder</button>
        <button onClick={this.moreHeat}>Hotter</button>
-        <Thermometer value={this.props.state} max="100" steps="4" format="°C" />
+        <Thermometer value={this.props.state} max="100" steps={this.state.steps} format="°C" />
      </div>
    );
   }
 }
```

#### Is this production-ready?

Theoretically, yes, it was designed after [Cycle State](https://cycle.js.org/api/state.html). The community has been using functional lenses in Cycle State (a.k.a. [cycle-onionify](https://github.com/staltz/cycle-onionify/)) for at least a year, also in production. Lenses are also not new, they're in JS libraries like [Ramda](http://ramdajs.com/) and [Partial Lenses](https://github.com/calmm-js/partial.lenses), but much more common in functional languages like Haskell.

In practice, this specific library has not been used in production, and you must be careful to handle performance issues correctly (read above). With such a small implementation, the risks associated with using this in production are lower.

#### Why `@staltz/with-profunctor-state` and not `with-profunctor-state`?

First, I don't want to pollute the NPM registry. Second, I believe most people should author packages under their own scope (just like in GitHub!), so that forks can indicate who is maintaining the package, because I don't intend to maintain this package, although it's small and might not even need maintenance.

## License

MIT
