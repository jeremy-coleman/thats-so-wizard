
import * as React from 'react'


declare const pug: (strings: TemplateStringsArray, ...values: any[]) => JSX.Element;

export const PugComponent = (props) => pug`
.wrapper
  if props.shouldShowGreeting
    p.greeting Hello World!

  button(onClick=props.notify) Pug Button
`