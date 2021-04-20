import { observable } from "mobx";
import { observer } from "mobx-react";
import * as React from "react";

export const Counter = observer((props) => {
  let incrementHandler = () => props.store.increment();

  const { store } = props;
  return (
    <div className="counter">
      <strong>{store.count}</strong>
      <button onClick={incrementHandler}>increment</button>
    </div>
  );
});

export const store = observable({
  counter: {
    count: 0,
    increment() {
      this.count++;
    },
  },
});

const App = observer((props) => {
  const { store } = props;
  return (
    <div className="app">
      <Counter store={store.counter} />
    </div>
  );
});

export let MobxApp = () => <App store={store} />;
