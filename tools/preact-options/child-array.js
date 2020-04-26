import { options } from 'preact';

const old = options.vnode;

options.vnode = vnode => {
  vnode[0] = vnode; // props.childre[0] === props.children tee hee
  if (old) old(vnode);
};