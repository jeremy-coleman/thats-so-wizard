import * as React from "react";
import ReactDOM from "react-dom";
import { MobxApp } from "./mobx-app";

//import './style.less'

var App = () => {
  return (
    <div>
      <header>Mobx Counter</header>
      <section>
        <MobxApp />
      </section>
    </div>
  );
};

const mountApp = ({ selector }) => {
  ReactDOM.render(
      <App />,
    document.querySelector(selector)
  );
};

mountApp({ selector: "#content" });

export { mountApp };

//if (process.env.NODE_ENV === "development") {
  // if (module && module["hot"]) {
  //   module["hot"].accept();
  // }
//}
