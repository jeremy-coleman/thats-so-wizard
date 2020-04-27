import { cloneElement, Component, createElement, h, JSX, toChildArray } from "preact";

const EMPTY = {};

export function assign(obj, props) {
  for (let i in props) {
    obj[i] = props[i];
  }
  return obj;
}

export function exec(url, route, opts) {
  let reg = /(?:\?([^#]*))?(#.*)?$/,
    c = url.match(reg),
    matches = {},
    ret;
  if (c && c[1]) {
    let p = c[1].split("&");
    for (let i = 0; i < p.length; i++) {
      let r = p[i].split("=");
      matches[decodeURIComponent(r[0])] = decodeURIComponent(r.slice(1).join("="));
    }
  }
  url = segmentize(url.replace(reg, ""));
  route = segmentize(route || "");
  let max = Math.max(url.length, route.length);
  for (let i = 0; i < max; i++) {
    if (route[i] && route[i].charAt(0) === ":") {
      let param = route[i].replace(/(^\:|[+*?]+$)/g, ""),
        flags = (route[i].match(/[+*?]+$/) || EMPTY)[0] || "",
        plus = ~flags.indexOf("+"),
        star = ~flags.indexOf("*"),
        val = url[i] || "";
      if (!val && !star && (flags.indexOf("?") < 0 || plus)) {
        ret = false;
        break;
      }
      matches[param] = decodeURIComponent(val);
      if (plus || star) {
        matches[param] = url
          .slice(i)
          .map(decodeURIComponent)
          .join("/");
        break;
      }
    } else if (route[i] !== url[i]) {
      ret = false;
      break;
    }
  }
  if (opts.default !== true && ret === false) return false;
  return matches;
}

export function pathRankSort(a, b) {
  return a.rank < b.rank ? 1 : a.rank > b.rank ? -1 : a.index - b.index;
}

// filter out VNodes without attributes (which are unrankeable), and add `index`/`rank` properties to be used in sorting.
export function prepareVNodeForRanking(vnode, index) {
  vnode.index = index;
  vnode.rank = rankChild(vnode);
  return vnode.props;
}

export function segmentize(url) {
  return url.replace(/(^\/+|\/+$)/g, "").split("/");
}

export function rankSegment(segment) {
  return segment.charAt(0) == ":" ? 1 + "*+?".indexOf(segment.charAt(segment.length - 1)) || 4 : 5;
}

export function rank(path) {
  return segmentize(path)
    .map(rankSegment)
    .join("");
}

function rankChild(vnode) {
  return vnode.props.default ? 0 : rank(vnode.props.path);
}

export interface Location {
  pathname: string;
  search: string;
}

export interface CustomHistory {
  listen(callback: (location: Location) => void): () => void;
  location: Location;
  push(path: string): void;
  replace(path: string): void;
}

let customHistory = null;

const ROUTERS = [];

const subscribers: Array<(url: string) => void> = [];

function setUrl(url, type = "push") {
  if (customHistory && customHistory[type]) {
    customHistory[type](url);
  } else if (typeof history !== "undefined" && history[type + "State"]) {
    history[type + "State"](null, null, url);
  }
}

function getCurrentUrl() {
  let url;
  if (customHistory && customHistory.location) {
    url = customHistory.location;
  } else if (customHistory && customHistory.getCurrentLocation) {
    url = customHistory.getCurrentLocation();
  } else {
    url = typeof location !== "undefined" ? location : EMPTY;
  }
  return `${url.pathname || ""}${url.search || ""}`;
}

function route(url, replace = false) {
  if (typeof url !== "string" && url.url) {
    replace = url.replace;
    url = url.url;
  }

  // only push URL into history if we can handle it
  if (canRoute(url)) {
    setUrl(url, replace ? "replace" : "push");
  }

  return routeTo(url);
}

/** Check if the given URL can be handled by any router instances. */
function canRoute(url) {
  for (let i = ROUTERS.length; i--; ) {
    if (ROUTERS[i].canRoute(url)) return true;
  }
  return false;
}

/** Tell all router instances to handle the given URL.  */
function routeTo(url) {
  let didRoute = false;
  for (let i = 0; i < ROUTERS.length; i++) {
    if (ROUTERS[i].routeTo(url) === true) {
      didRoute = true;
    }
  }
  for (let i = subscribers.length; i--; ) {
    subscribers[i](url);
  }
  return didRoute;
}

function routeFromLink(node) {
  // only valid elements
  if (!node || !node.getAttribute) return;

  let href = node.getAttribute("href");
  let target = node.getAttribute("target");

  // ignore links with targets and non-path URLs
  if (!href || !href.match(/^\//g) || (target && !target.match(/^_?self$/i))) return;

  // attempt to route, if no match simply cede control to browser
  return route(href);
}

function handleLinkClick(e) {
  if (e.button == 0) {
    routeFromLink(e.currentTarget || e.target || this);
    return prevent(e);
  }
}

function prevent(e) {
  if (e) {
    if (e.stopImmediatePropagation) e.stopImmediatePropagation();
    if (e.stopPropagation) e.stopPropagation();
    e.preventDefault();
  }
  return false;
}

function delegateLinkHandler(e) {
  // ignore events the browser takes care of already:
  if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey || e.button !== 0) return;

  let t = e.target;
  do {
    if (String(t.nodeName).toUpperCase() === "A" && t.getAttribute("href")) {
      if (t.hasAttribute("native")) return;
      // if link is handled by the router, prevent browser defaults
      if (routeFromLink(t)) {
        return prevent(e);
      }
    }
  } while ((t = t.parentNode));
}

let eventListenersInitialized = false;

function initEventListeners() {
  if (eventListenersInitialized) return;

  if (typeof addEventListener === "function") {
    if (!customHistory) {
      addEventListener("popstate", () => {
        routeTo(getCurrentUrl());
      });
    }
    addEventListener("click", delegateLinkHandler);
  }
  eventListenersInitialized = true;
}

const StaticLink = (props) => {
  const { as = "span", ...otherProps } = props;
  return createElement(as, assign({ onClick: handleLinkClick }, otherProps));
};

const Route = (props) => createElement(props.component, props);

class Router extends Component<any, any> {
  static subscribers = subscribers;
  static getCurrentUrl = getCurrentUrl;
  static route = route;
  static Router = Router;
  static Route = Route;
  static Link = StaticLink;

  _didRoute: boolean;
  updating: any;
  unlisten: any;
  previousUrl: any;

  constructor(props) {
    super(props);
    if (props.history) {
      customHistory = props.history;
    }

    this.state = {
      url: props.url || getCurrentUrl()
    };

    initEventListeners();
  }

  shouldComponentUpdate(props) {
    if (props.static !== true) return true;
    return props.url !== this.props.url || props.onChange !== this.props.onChange;
  }

  /** Check if the given URL can be matched against any children */
  canRoute(url) {
    const children = toChildArray(this.props.children);
    return this.getMatchingChildren(children, url, false).length > 0;
  }

  /** Re-render children with a new URL to match against. */
  routeTo(url) {
    this._didRoute = false;
    this.setState({ url });

    // if we're in the middle of an update, don't synchronously re-route.
    if (this.updating) return this.canRoute(url);

    this.forceUpdate();
    return this._didRoute;
  }

  componentWillMount() {
    ROUTERS.push(this);
    this.updating = true;
  }

  componentDidMount() {
    if (customHistory) {
      this.unlisten = customHistory.listen((location) => {
        this.routeTo(`${location.pathname || ""}${location.search || ""}`);
      });
    }
    this.updating = false;
  }

  componentWillUnmount() {
    if (typeof this.unlisten === "function") this.unlisten();
    ROUTERS.splice(ROUTERS.indexOf(this), 1);
  }

  componentWillUpdate() {
    this.updating = true;
  }

  componentDidUpdate() {
    this.updating = false;
  }

  getMatchingChildren(children, url, invoke) {
    return children
      .filter(prepareVNodeForRanking)
      .sort(pathRankSort)
      .map((vnode) => {
        let matches = exec(url, vnode.props.path, vnode.props);
        if (matches) {
          if (invoke !== false) {
            let newProps: any = { url, matches };
            assign(newProps, matches);
            delete newProps.ref;
            delete newProps.key;
            return cloneElement(vnode, newProps);
          }
          return vnode;
        }
      })
      .filter(Boolean);
  }

  render({ children, onChange }, { url }) {
    let active = this.getMatchingChildren(toChildArray(children), url, true);

    let current = active[0] || null;
    this._didRoute = !!current;

    let previous = this.previousUrl;
    if (url !== previous) {
      this.previousUrl = url;
      if (typeof onChange === "function") {
        onChange({
          router: this,
          url,
          previous,
          active,
          current
        });
      }
    }

    return current;
  }
}

Router.subscribers = subscribers;
Router.getCurrentUrl = getCurrentUrl;
Router.route = route;
Router.Router = Router;
Router.Route = Route;
Router.Link = StaticLink;

export type LinkProps = {
  activeClassName: string;
  path: string;
  as: any;
} & JSX.HTMLAttributes;

type RoutableProps = {
  path?: string;
  default?: boolean;
};

const Link = ({ activeClassName, path, ...props }: any) => 
(
  <Match path={path || props.href}>
    {({ matches }) => (
      <StaticLink
        {...props}
        class={[props.class || props.className, matches && activeClassName]
          .filter(Boolean)
          .join(" ")}
      />
    )}
  </Match>
);

export class Match extends Component<RoutableProps, {}> {
  static Link = Link;
  update = (url) => {
    this.nextUrl = url;
    this.setState({});
  };
  nextUrl: any;
  componentDidMount() {
    subscribers.push(this.update);
  }
  componentWillUnmount() {
    subscribers.splice(subscribers.indexOf(this.update) >>> 0, 1);
  }
  render(props) {
    let url = this.nextUrl || getCurrentUrl(),
      path = url.replace(/\?.+$/, "");
    this.nextUrl = null;
    return props.children({
      url,
      path,
      matches: path === props.path
    });
  }
}

Match.Link = Link;





export class HashHistory implements CustomHistory {
    constructor(private window: Window) { }

    listen(callback: (location: Location) => void) {
        const hashchangeListener = () => {
            callback(this.location);
        };
        this.window.addEventListener('hashchange', hashchangeListener, false);
        return () => {
            this.window.removeEventListener('hashchange', hashchangeListener);
        };
    }

    get location(): Location {
        const pathname = this.window.location.hash.slice(1);
        return { pathname, search: '' };
    }

    push(url: string): void {
        this.window.history.pushState(null, null, `#${url}`);
    }

    replace(url: string): void {
        this.window.history.replaceState(null, null, `#${url}`);
    }
}

function createHashHistory(): CustomHistory {
    return new HashHistory(window);
}

export { subscribers, getCurrentUrl, route, Router, Route, StaticLink, createHashHistory, Link };
export default Router;
