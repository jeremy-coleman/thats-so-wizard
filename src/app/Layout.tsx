import { h } from "preact";
import { Link } from "./preact-router";
import { styled } from "./styled";

export const Card = styled('div', (props) => ({
	display: 'block',
  position: 'relative',
  background: '#fff',
  borderRadius: 2,
  margin: '0 0 8px',
  padding: 16,
  boxShadow: '0 1px 3px 0 rgba(33, 33, 33, 0.2), 0 1px 1px 0 rgba(33, 33, 33, 0.14), 0 2px 1px -1px rgba(33, 33, 33, 0.12)',
}))

const Column = styled("div", (props) => ({
  display: "flex",
  flex: "1 1 auto",
  flexDirection: "column",
  justifyContent: "stretch",
}));

const Row = styled("div", (props) => ({
  display: "flex",
  flex: "1 1 auto",
  flexDirection: "row",
  justifyContent: "stretch",
}));

const MainWorkSpace = styled("div", (props) => ({
  display: "flex",
  height: "100%",
  width: "100%",
  overscrollX: "scroll",
}));

const MuiFontIcon = ({ iconName, label }) => (
  <div className="v-align">
    <i className="material-icons">{iconName}</i>
    <span className="icon-label-font">{label}</span>
  </div>
);

const IconBarLink = (props) => (
  <Link href={"/" + props.route} className="icon-link">
    <MuiFontIcon iconName={props.iconName} label={props.label} />
  </Link>
);

const IconNavBar = () => {
  return (
    <div className={"left-nav"}>
      <IconBarLink route="" iconName={"dashboard"} label="home" />
      <IconBarLink route="raf" iconName={"insert_chart"} label="raf" />
      <IconBarLink route="settings" iconName={"settings"} label="settings" />
    </div>
  );
};

export const Footer = () => (
  <footer className="footer-root">
    <span className="footer-left">left</span>
    <span className="footer-right">right</span>
  </footer>
);

let Header = () => (
  <header className="command-bar">
    <h1>Preact Starter</h1>
    <span className="command-bar-icons">
      <IconBarLink route="" iconName={"home"} label="home" />
    </span>
  </header>
);

export const Layout = (props) => {
  return (
    <Column>
      <Row>
        <IconNavBar />
        <Column>
          <Header />
          <MainWorkSpace>
            <Row>{props.children}</Row>
          </MainWorkSpace>
        </Column>
      </Row>
      <Footer />
    </Column>
  );
};
