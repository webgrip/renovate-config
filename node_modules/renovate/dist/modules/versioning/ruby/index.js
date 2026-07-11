import { regEx } from "../../../util/regex.js";
import { logger } from "../../../logger/index.js";
import { isSingleOperator, isValidOperator } from "./operator.js";
import { ltr, parse } from "./range.js";
import { parse as parse$1 } from "./version.js";
import replace_default from "./strategies/replace.js";
import bump_default from "./strategies/bump.js";
import widen_default from "./strategies/widen.js";
import "./strategies/index.js";
import { eq, gt, maxSatisfying, minSatisfying, satisfies, valid } from "@renovatebot/ruby-semver";
//#region lib/modules/versioning/ruby/index.ts
const id = "ruby";
function vtrim(version) {
	if (typeof version === "string") return version.replace(regEx(/^v/), "").replace(regEx(/('|")/g), "");
	return version;
}
const equals = (left, right) => eq(vtrim(left), vtrim(right));
const getMajor = (version) => parse$1(vtrim(version)).major;
const getMinor = (version) => parse$1(vtrim(version)).minor;
const getPatch = (version) => parse$1(vtrim(version)).patch;
const isVersion = (version) => !!valid(vtrim(version));
const isGreaterThan = (left, right) => gt(vtrim(left), vtrim(right));
const isLessThanRange = (version, range) => !!ltr(vtrim(version), vtrim(range));
const isSingleVersion = (range) => {
	const { version, operator } = parse(vtrim(range));
	return operator ? isVersion(version) && isSingleOperator(operator) : isVersion(version);
};
function isStable(version) {
	const v = vtrim(version);
	return parse$1(v).prerelease ? false : isVersion(v);
}
const isValid = (input) => input.split(",").map((piece) => vtrim(piece.trim())).every((range) => {
	const { version, operator } = parse(range);
	return operator ? isVersion(version) && isValidOperator(operator) : isVersion(version);
});
const matches = (version, range) => satisfies(vtrim(version), vtrim(range));
function getSatisfyingVersion(versions, range) {
	return maxSatisfying(versions.map(vtrim), vtrim(range));
}
function minSatisfyingVersion(versions, range) {
	return minSatisfying(versions.map(vtrim), vtrim(range));
}
const getPinnedValue = (value) => {
	return vtrim(value);
};
const getNewValue = ({ currentValue, rangeStrategy, currentVersion, newVersion }) => {
	let newValue = null;
	if (isVersion(currentValue)) newValue = currentValue.startsWith("v") && !newVersion.startsWith("v") ? `v${newVersion}` : newVersion;
	else if (currentValue.replace(regEx(/^=\s*/), "") === currentVersion) newValue = currentValue.replace(currentVersion, newVersion);
	else switch (rangeStrategy) {
		case "update-lockfile":
			if (satisfies(newVersion, vtrim(currentValue))) newValue = vtrim(currentValue);
			else return getNewValue({
				currentValue,
				rangeStrategy: "replace",
				currentVersion,
				newVersion
			});
			break;
		case "bump":
			newValue = bump_default({
				range: vtrim(currentValue),
				to: vtrim(newVersion)
			});
			break;
		case "auto":
		case "replace":
			newValue = replace_default({
				range: vtrim(currentValue),
				to: vtrim(newVersion)
			});
			break;
		case "widen":
			newValue = widen_default({
				range: vtrim(currentValue),
				to: vtrim(newVersion)
			});
			break;
		// istanbul ignore next
		default: logger.warn({ rangeStrategy }, "Unsupported range strategy");
	}
	if (newValue && regEx(/^('|")/).exec(currentValue)) {
		const delimiter = currentValue[0];
		return newValue.split(",").map((element) => element.replace(regEx(`^(?<whitespace>\\s*)`), `$<whitespace>${delimiter}`)).map((element) => element.replace(/(?<whitespace>\s*)$/, `${delimiter}$<whitespace>`)).join(",");
	}
	return newValue;
};
const sortVersions = (left, right) => gt(vtrim(left), vtrim(right)) ? 1 : -1;
const api = {
	equals,
	getMajor,
	getMinor,
	getPatch,
	isCompatible: isVersion,
	isGreaterThan,
	isLessThanRange,
	isSingleVersion,
	isStable,
	isValid,
	isVersion,
	matches,
	getSatisfyingVersion,
	minSatisfyingVersion,
	getPinnedValue,
	getNewValue,
	sortVersions
};
//#endregion
export { api as default, id, isVersion };

//# sourceMappingURL=index.js.map