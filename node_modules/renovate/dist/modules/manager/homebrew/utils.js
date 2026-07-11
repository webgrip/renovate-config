import { escapeRegExp, regEx } from "../../../util/regex.js";
//#region lib/modules/manager/homebrew/utils.ts
function extractRubyString(content, keyword) {
	const regex = regEx(new RegExp(`\\b${keyword}\\s+(?:"(?<double>[^"]+)"|'(?<single>[^']+)')`));
	const match = content.match(regex);
	return match?.groups?.double ?? match?.groups?.single ?? null;
}
function updateRubyString(content, keyword, oldValue, newValue) {
	const doubleQuote = new RegExp(`(\\b${keyword}\\s+)"${escapeRegExp(oldValue)}"`, "g");
	const singleQuote = new RegExp(`(\\b${keyword}\\s+)'${escapeRegExp(oldValue)}'`, "g");
	const result = content.replace(doubleQuote, `$1"${newValue}"`).replace(singleQuote, `$1'${newValue}'`);
	return result === content ? null : result;
}
//#endregion
export { extractRubyString, updateRubyString };

//# sourceMappingURL=utils.js.map