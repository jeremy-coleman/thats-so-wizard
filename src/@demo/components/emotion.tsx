
import { h,  } from "preact"
import {css} from 'emotion'

const blueBorder = css`border: 5px solid blue`

export const BlueBorderEmotion = (props) => {
	return <button className={blueBorder} {...props}>emotion</button>
}