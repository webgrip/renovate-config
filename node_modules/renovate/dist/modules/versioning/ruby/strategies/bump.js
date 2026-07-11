import { parseRanges, stringifyRanges } from "../range.js";
import { adapt, trimZeroes } from "../version.js";
import { replacePart } from "./replace.js";
import { gt, gte, lt } from "@renovatebot/ruby-semver";
//#region lib/modules/versioning/ruby/strategies/bump.ts
var bump_default = ({ range, to }) => {
	return stringifyRanges(parseRanges(range).map((part) => {
		const { operator, version: ver } = part;
		switch (operator) {
			case "<": return gte(to, ver) ? replacePart(part, to) : part;
			case "<=": return gt(to, ver) ? replacePart(part, to) : part;
			case "~>": {
				const trimmed = adapt(to, ver);
				if (trimZeroes(trimmed) === trimZeroes(to)) return {
					...part,
					version: trimmed,
					companion: void 0
				};
				else return {
					...part,
					version: trimmed,
					companion: {
						operator: ">=",
						delimiter: " ",
						version: to
					}
				};
			}
			case "!=":
				if (lt(ver, to)) return {
					...part,
					operator: ">=",
					version: to
				};
				return part;
			default: return replacePart(part, to);
		}
	}));
};
//#endregion
export { bump_default as default };

//# sourceMappingURL=bump.js.map