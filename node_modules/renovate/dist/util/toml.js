import { regEx } from "./regex.js";
import { stripTemplates } from "./string.js";
import { getStaticTOMLValue, parseTOML } from "toml-eslint-parser";
//#region lib/util/toml.ts
function parse(input) {
	return getStaticTOMLValue(parseTOML(input, { tomlVersion: "1.0" }));
}
function massage(input) {
	return stripTemplates(input.replace(regEx(/^\s*{{.+?}}\s*=.*$/gm), ""));
}
//#endregion
export { massage, parse };

//# sourceMappingURL=toml.js.map