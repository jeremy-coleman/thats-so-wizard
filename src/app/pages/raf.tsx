import { h } from "preact";
import { Component, Value } from "../preactive";
const CountStore = new Value({ count: 5 });


function rafIterator() {
  var tick = 0;
  var frame;

  var obj = {
    next: () => new Promise<{value: number, done: boolean}>((resolve) => {
        frame = requestAnimationFrame(() => {
          resolve({ value: tick++, done: false });
        });
    }),
    return: () => {
      cancelAnimationFrame(frame);
      return { value: tick, done: true };
    }
  };
  obj[Symbol["asyncIterator"]] =()=>obj;
  return obj;
}

async function main(el) {
  const canvas = document.createElement("canvas");
  canvas.width = 400;
  canvas.height = 400;
  //h("<canvas width="400" height="400"></canvas>", {width: 400, height: 400})

  const context = canvas.getContext("2d");

  el.append(canvas);
  //@ts-ignore
  for await (const tick of rafIterator()) {
    context.fillStyle = `hsl(${tick % 360}deg, 60%, 70%)`;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#000";
    context.fillText(tick, canvas.width / 2, canvas.height / 2);
  }
}


export class RafPage extends Component<any> {
  handleValueClick = () => {
    CountStore.update((c) => Object.assign(c, { count: c.count + 55 })),
    main(document.querySelector("#raf-thing")),
    console.log(CountStore.get());
  };

  view() {
    return (
      <div>
        <div>Async RAF demo</div>
        <button onClick={this.handleValueClick}>Add color square</button>
        <p>reactive store count</p>
        <div>{CountStore.get().count}</div>
        <div id="raf-thing"></div>
      </div>
    );
  }
}
