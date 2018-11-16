import {createElement, Component, ComponentClass} from 'react';

export type Updater<S> = (prev: S) => S;
export type SetState<S> = (updater: S | Updater<S>) => void;
export type Getter<S, T> = (outer: S) => T;
export type Setter<S, T> = (newInner: T, prevOuter: S) => S;
export type Lens<S, T> = {get: Getter<S, T>; set: Setter<S, T>};

export class ProfunctorState<S> {
  constructor(public state: S, public setState: SetState<S>) {}

  promap<T>(lens: Lens<S, T>): ProfunctorState<T>;
  promap<T>(get: Getter<S, T>, set: Setter<S, T>): ProfunctorState<T>;
  promap<T>(
    a: Getter<S, T> | Lens<S, T>,
    b?: Setter<S, T>,
  ): ProfunctorState<T> {
    const get = typeof a === 'object' ? a.get : a;
    const set = typeof a === 'object' ? a.set : (b as Setter<S, T>);
    const innerSetState = (newInnerStateOrUpdate: T | Updater<T>) => {
      this.setState(prevState => {
        const innerState = get(prevState);
        const newInnerState =
          typeof newInnerStateOrUpdate === 'function'
            ? (newInnerStateOrUpdate as Updater<T>)(innerState)
            : (newInnerStateOrUpdate as T);
        if (newInnerState === innerState) return prevState;
        return set(newInnerState, prevState);
      });
    };
    const innerState = get(this.state);
    const prof = new ProfunctorState(innerState, innerSetState);
    prof.promap = prof.promap.bind(prof);
    return prof;
  }
}

export function withProfunctorState<S = any>(component: any, initial: S) {
  const WPS: ComponentClass<any, S> = class extends Component<any, S> {
    constructor(props: any) {
      super(props);
      this.state = initial;
      const prof = new ProfunctorState(initial, this.setState.bind(this));
      prof.promap = prof.promap.bind(prof);
      this.prof = prof;
    }

    private prof: ProfunctorState<S>;

    public render() {
      const {props, prof} = this;
      prof.state = this.state;
      return createElement(component, {props, prof});
    }
  };
  WPS.displayName =
    'WithProfunctorState(' +
    (component.displayName || component.name || 'Component') +
    ')';
  return WPS;
}

export default withProfunctorState;
