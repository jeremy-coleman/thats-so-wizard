import {
  BlueBorderEmotion,
  BlueBorderStyled,
  HtmComponent,
  PugComponent,
} from "@demo/components";
import { actions } from "app/store";
import { Component, h } from "preact";
import { connect } from "unistore/full/preact";
import { Card } from "../Layout";

interface Props {
  count?: number;
  increment?: any;
  decrement?: any;
}

@connect("count", actions)
class UnistoreApp extends Component<Props, any> {
  render() {
    return (
      <div>
        <p>Count: {this.props.count}</p>
        <button onClick={this.props.increment}>Increment</button>
        <button onClick={this.props.decrement}>Decrement</button>
      </div>
    );
  }
}

export let Home = (props) => (
  <div className="page page__home">
    <Card>
      <h1>Home</h1>
      <p>This is the home page.</p>
      <p>You should check out:</p>
      <nav>
        <button
          onClick={() => {
            window.location.hash = "/2342342";
          }}
        >
          {"404 test"}
        </button>
      </nav>
    </Card>

    <Card>
      <UnistoreApp />
      <BlueBorderStyled>styled components</BlueBorderStyled>
      <BlueBorderEmotion>emotion</BlueBorderEmotion>
      <PugComponent>pug</PugComponent>
      <HtmComponent />
    </Card>
  </div>
);
