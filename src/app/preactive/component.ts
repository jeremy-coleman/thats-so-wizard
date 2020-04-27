import * as Preact from 'preact'
import { ComputedValue } from "./reactive";
import { VNode } from "preact";

class Component<P = {}> extends Preact.Component<P> {
  _view: ComputedValue<VNode<any>>;

  constructor(props) {
    super(props);
    this._view = new ComputedValue(() => this.view(this.props));
    this._view.dependency.add(this._update);
  }

  willMount(props) {}
  componentWillMount() {
    this.willMount(this.props);
  }

  didMount(props) {}
  componentDidMount() {
    this.didMount(this.props);
  }

  willUpdate(props) {}
  componentWillUpdate(nextProps) {
    this._view.stale = true;
    this.willUpdate(nextProps);
  }

  didUpdate(props) {}
  componentDidUpdate() {
    this.didUpdate(this.props);
  }

  willUnmount(props) {}
  componentWillUnmount() {
    this.willUnmount(this.props);
    this._view.stop();
    this._view.dependency.remove(this._update);
  }

  shouldComponentUpdate() {
    return false;
  }

  _updating = false;

  _update = () => {
    if (!this._updating) {
      this._updating = true;

      Promise.resolve().then(() => {
        this.forceUpdate(), (this._updating = false);
      });
    }
  };

  view(props) {
    return null;
  }

  render(){
    return this._view.get();
  }
}

export { Component };
export default Component;

// _update = () => {
// 	if (!this._updating) {
// 		this._updating = true

// 		//idk what's better?

// //ball example has less lag using RAF.. the RAFs shouldn't accumulate and should be limited to 1 per update
// // idk how to test for the equivalent of something like window.requestAnimationFrameStack.length

// 		// requestAnimationFrame(() => {
// 		// 	this.forceUpdate()
// 		// 	this._updating = false
// 		// })

// 		setTimeout(() => {
// 			this.forceUpdate()
// 			this._updating = false
// 		})
// 	}
// }
