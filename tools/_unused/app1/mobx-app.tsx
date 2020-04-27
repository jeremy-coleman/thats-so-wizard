
import { action, observable } from "mobx"
import { observer } from "mobx-react"
import { Component, h,  } from "preact"
import {html} from 'htm/preact'

//install https://github.com/mjbvz/vscode-lit-html for syntax highlighting
//the plugin section of the tsconfig provides the checker, and configs. 
//i think its way easier and more portable than configuring in vscode, generally seems faster also
const DoesTslitPluginWork = () => {
	return html`
			<button 
				onTypo=${() => {console.log("not expecting to see this")}}
				onClick=${(e) => (console.log(e))}
			>
			AND THE CROWD GOES WILD
			</button>
		`
}

export class CounterStore {
	@observable count: number = 0

	@action increment() {
		this.count++
	}
}

@observer
export class Counter extends Component<{store: CounterStore}, any> {
	private incrementHandler = () => this.props.store.increment()

	render() {
		const {store} = this.props
		return (
			<div className="counter">
				<strong>{store.count}</strong>
				<button onClick={this.incrementHandler}>increment</button>
				<DoesTslitPluginWork/>
			</div>
		)
	}
}

export class AppStore {
	@observable 
	counter = new CounterStore()
}

export const store = new AppStore()

@observer
class App extends Component<{store: AppStore}, any> {

	render() {
		const {store} = this.props
		return (
			<div className="app">
				<Counter store={store.counter}/>
			</div>
		)
	}
}

export let MobxApp = () => <App store={store}/>