import { h, render, Component } from 'preact'
import { createStore, Provider, connect } from 'unistore/full/preact'
import {MobxApp} from './mobx-app'

//import './style.less'

interface State {
  count: number
}

let store = createStore<State>({ count: 0 })

let actions = () => ({
  increment (state: State): State {
    return { count: state.count + 1 }
  },

  decrement (state: State): State {
    return { count: state.count - 1 }
  }
})

interface Props {
  count?: number,
  increment?: any,
  decrement?: any
}

@connect('count', actions)
class UnistoreApp extends Component<Props, any> {
  render () {
    return (
      <div>
          <p>Count: {this.props.count}</p>
          <button onClick={this.props.increment}>Increment</button>
          <button onClick={this.props.decrement}>Decrement</button>
      </div>
    )
  }
}


class App extends Component<Props, any> {
  render () {
    return (
      <div>
        <header>Unistore Counter</header>
        <section>
			<UnistoreApp/>
        </section>

        <header>Mobx Counter</header>
        <section>
          <MobxApp/>
        </section>
        
      </div>
    )
  }
}

render((
  <Provider store={store}>
    <App />
  </Provider>
), document.getElementById('content'))

//document.body also works fine

if(module && module['hot']){
  module['hot'].accept()
}
