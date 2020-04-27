import { Component, h } from "preact";
import { Layout } from "./Layout";
import { Error404 } from "./pages/404";
import { Home } from "./pages/home";
import { RafPage } from "./pages/raf";
//import { SettingsPage } from "./pages/settings";
import { createHashHistory, Router } from "./preact-router";

import {lazy} from 'preact/compat'
//import { SettingsPage } from "./pages/settings";

const Settings = lazy(() => import("./pages/settings"))

//track pages on route change
//const onChange = obj => window.ga && ga.send('pageview', { dp:obj.url });

const history = createHashHistory()

const onChange = (routerData) => {
  //console.log(routerData)
  console.log("ROUTE CHANGE:", routerData.url)
};


export class App extends Component<any, any> {
  render() {
    return (
      <Layout>
        <Router onChange={onChange} history={history}>
          <Home path="/" />
          <Settings path="/settings" />
          <RafPage path="/raf" />
          <Error404 default />
        </Router>
      </Layout>
    );
  }
}
