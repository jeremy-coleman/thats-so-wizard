//https://github.com/mcrowe/pstyled/blob/master/src/index.ts
import { h } from "preact";


/** @example
const Box = styled('div', {display: 'flex'})

const Row = styled(Box, {flexDirection: 'row'})

const Button = styled('button', props => ({
  backgroundColor: props.primary ? 'green' : 'gray'
  }))
  
*/
export function styled(comp, style?) {
  if (!style) {
    style = comp;
    comp = "div";
  }

  return (props) => {
    const compStyle = typeof style == "function" ? style(props) : style;
    const combinedStyle = props.isStyled
      ? { ...compStyle, ...props.style }
      : { ...props.style, ...compStyle };
    const compProps = { ...props, style: combinedStyle, isStyled: true };
    return h(comp, compProps);
  };
}

