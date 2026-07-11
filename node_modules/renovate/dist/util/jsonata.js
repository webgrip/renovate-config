import { get, set } from "./cache/memory/index.js";
import { detectPlatform } from "./common.js";
import { toSha256 } from "./hash.js";
import jsonata from "jsonata";
//#region lib/util/jsonata.ts
function getExpression(input) {
	const cacheKey = `jsonata:${toSha256(input)}`;
	const cachedExpression = get(cacheKey);
	// istanbul ignore if: cannot test
	if (cachedExpression) return cachedExpression;
	let result;
	try {
		const expression = jsonata(input);
		expression.registerFunction("detectPlatform", (url) => detectPlatform(url), "<s-:s>");
		const originalEvaluate = expression.evaluate.bind(expression);
		expression.evaluate = (data, bindings = {}) => {
			return originalEvaluate(data, bindings);
		};
		result = expression;
	} catch (err) {
		result = new Error(err.message);
	}
	set(cacheKey, result);
	return result;
}
//#endregion
export { getExpression };

//# sourceMappingURL=jsonata.js.map