
//require('preact/devtools')
import { h, render } from "preact";
import { Provider } from 'unistore/full/preact';
import { App } from "./routes";
import {store} from './store'


window["h"] = h;

//type P = typeof document.body.style.setProperty;
let bodyProp = (a, b, c?) => document.body.style.setProperty(a, b, c);

bodyProp("--cog-primary", "orange");
bodyProp("--cog-secondary", "orange");
bodyProp("--cog-bg-dark", "#424242");
bodyProp("--cog-text-light", "white");
bodyProp("--cog-theme-primary", "#424242");
bodyProp("--cog-theme-secondary", "#424242");
bodyProp("--intent-success", "green");
bodyProp("--intent-warning", "orange");
bodyProp("--intent-fail", "red");
bodyProp("--intent-danger", "#a80000");


window["h"] = h




const mountApp = ({selector}) => {
    render((
      <Provider store={store}>
        <App />
      </Provider>
    ), document.querySelector(selector))
  }
  
mountApp({selector: "#content"})

export { mountApp };


if (process.env.NODE_ENV === 'development') {
    
    if(module && module['hot']){
        module['hot'].accept()
    }
}


// let MaterialIconLink=document.createElement("link")
// MaterialIconLink.href="https://fonts.googleapis.com/icon?family=Material+Icons"
// MaterialIconLink.rel="stylesheet"
// document.head.appendChild(MaterialIconLink)

// 	if ('serviceWorker' in navigator && location.protocol === 'https:') {
// 		navigator.serviceWorker.register('/sw.js');
// 	}
