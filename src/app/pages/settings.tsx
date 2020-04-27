import { h } from "preact";

let setPrimaryColor = async (color) =>
  void (await document.body.style.setProperty("--primary", color));

let setPrimaryThemeVariables = async (color) =>
  void (await document.body.style.setProperty("--primary", color));

let fromSelector = async (elementQuery, color) =>
  void (await document.querySelector<any>(`${elementQuery}`).style.setProperty("--primary", color));

let pickRandomColor = () => "#" + (((1 << 24) * Math.random()) | 0).toString(16);

const ThemeButton = () => (
  <button
    onClick={() => {
      setPrimaryThemeVariables(pickRandomColor());
    }}
  >
    body theme
  </button>
);

const ThemeButtonInner = () => (
  <button
    onClick={() => {
      fromSelector("#main-content-body-child", pickRandomColor());
    }}
  >
    click me
  </button>
);

const ThemeButtonTwo = () => (
  <button onClick={() => {setPrimaryColor("green")}}>
    set green
  </button>
);

let varStyle = {
  backgroundColor: "var(--primary)"
};

let pagecss = {
  padding: "16px 32px",
  minHeight: "100%",
  width: "100%"
};

let flexfull = {
  flex: "1 1 auto"
};

export let SettingsPage = (props) => (
  <div style={Object.assign(pagecss, varStyle)}>
    <div style={{ alignContent: "stretch" }}>
      Header
      <ThemeButton />
      <ThemeButtonTwo />
      <ThemeButtonInner />
    </div>
    <div style={flexfull}>
      Body
      <div style={varStyle} id="main-content-body-child">
        using same variable as parent (var(--primary))
      </div>
    </div>
  </div>
);

export default SettingsPage
