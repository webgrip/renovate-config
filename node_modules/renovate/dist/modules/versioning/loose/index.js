import { regEx } from "../../../util/regex.js";
import { GenericVersioningApi } from "../generic.js";
//#region lib/modules/versioning/loose/index.ts
const id = "loose";
const versionPattern = regEx(/^[vV]?(\d+(?:\.\d+)*)(.*)$/);
const commitHashPattern = regEx(/^[a-f0-9]{7,40}$/);
const numericPattern = regEx(/^[0-9]+$/);
var LooseVersioningApi = class extends GenericVersioningApi {
	_parse(version) {
		if (commitHashPattern.test(version) && !numericPattern.test(version)) return null;
		const matches = versionPattern.exec(version);
		if (!matches) return null;
		const [, prefix, suffix] = matches;
		const release = prefix.split(".").map(Number);
		if (release.length > 6) return null;
		return {
			release,
			suffix: suffix || ""
		};
	}
	_compare(version, other) {
		const parsed1 = this._parse(version);
		const parsed2 = this._parse(other);
		// istanbul ignore if
		if (!(parsed1 && parsed2)) return 1;
		const length = Math.max(parsed1.release.length, parsed2.release.length);
		for (let i = 0; i < length; i += 1) {
			const part1 = parsed1.release[i];
			const part2 = parsed2.release[i];
			if (part1 === void 0) return -1;
			if (part2 === void 0) return 1;
			if (part1 !== part2) return part1 - part2;
		}
		if (parsed1.suffix && parsed2.suffix) return parsed1.suffix.localeCompare(parsed2.suffix, void 0, { numeric: true });
		if (parsed1.suffix) return -1;
		if (parsed2.suffix) return 1;
		// istanbul ignore next
		return 0;
	}
};
const api = new LooseVersioningApi();
//#endregion
export { api as default, id };

//# sourceMappingURL=index.js.map