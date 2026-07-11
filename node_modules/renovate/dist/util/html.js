import { parse } from "node-html-parser";
//#region lib/util/html.ts
function parse$1(html, config) {
	if (typeof config !== "undefined") return parse(html, config);
	return parse(html);
}
//#endregion
export { parse$1 as parse };

//# sourceMappingURL=html.js.map