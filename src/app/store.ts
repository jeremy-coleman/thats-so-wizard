import { createStore } from 'unistore/full/preact';

interface State {
    count: number
  }
  
  export let store = createStore<State>({ count: 0 })
  
  export let actions = () => ({
    increment (state: State): State {
      return { count: state.count + 1 }
    },
  
    decrement (state: State): State {
      return { count: state.count - 1 }
    }
  })