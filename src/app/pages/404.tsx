import { h } from "preact";
import { Card } from "../Layout";

export let TestCard = (props) => {
  return (
    <div className="card">
      <button onClick={() => {
        window.location.hash = "/"
      }}>{"<- go home"}</button>
    </div>
  );
};

export let Error404 = (props) => (
  <div className="page page__404">
    <Card>
      <h1>404 Page</h1>
      <p>Looks like you were given a bad link ;-)</p>
      <pre>{props.url}</pre>
    </Card>
    <TestCard />
  </div>
);
