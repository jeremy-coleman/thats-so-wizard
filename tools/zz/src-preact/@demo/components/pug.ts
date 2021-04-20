import { VNode , h} from "preact";
import * as React from 'preact'

declare const pug: (strings: TemplateStringsArray, ...values: any[]) => VNode;

export const PugComponent = (props) => pug`
.wrapper
  if props.shouldShowGreeting
    p.greeting Hello World!

  button(onClick=props.notify) Pug Button
`