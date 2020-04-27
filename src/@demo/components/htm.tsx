

import { html } from 'htm/preact'

//install https://github.com/mjbvz/vscode-lit-html for syntax highlighting
//the plugin section of the tsconfig provides the checker, and configs. 
//i think its way easier and more portable than configuring in vscode, generally seems faster also
export const HtmComponent = () => {
	return html`
			<button 
				onTypo=${() => {console.log("not expecting to see this")}}
				onClick=${(e) => (console.log(e))}
			>
			AND THE CROWD GOES WILD
			</button>
		`
}