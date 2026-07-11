import { regEx } from "../../../util/regex.js";
import api$1 from "../maven/index.js";
import { TokenType, compare, isValid, isVersion, parse, parseMavenBasedRange, parsePrefixRange, parseSingleVersionRange } from "./compare.js";
//#region lib/modules/versioning/gradle/index.ts
const id = "gradle";
const equals = (a, b) => compare(a, b) === 0;
const getMajor = (version) => {
	const tokens = parse(version?.replace(regEx(/^v/i), ""));
	if (tokens) {
		const majorToken = tokens?.[0];
		if (majorToken?.type === TokenType.Number) return majorToken.val;
	}
	return null;
};
const getMinor = (version) => {
	const tokens = parse(version?.replace(regEx(/^v/i), ""));
	if (tokens) {
		const majorToken = tokens[0];
		const minorToken = tokens[1];
		if (majorToken?.type === TokenType.Number && minorToken?.type === TokenType.Number) return minorToken.val;
		return 0;
	}
	return null;
};
const getPatch = (version) => {
	const tokens = parse(version?.replace(regEx(/^v/i), ""));
	if (tokens) {
		const majorToken = tokens[0];
		const minorToken = tokens[1];
		const patchToken = tokens[2];
		if (majorToken?.type === TokenType.Number && minorToken?.type === TokenType.Number && patchToken?.type === TokenType.Number) return patchToken.val;
		return 0;
	}
	return null;
};
const isGreaterThan = (a, b) => compare(a, b) === 1;
const unstable = new Set([
	"dev",
	"a",
	"alpha",
	"b",
	"beta",
	"m",
	"mt",
	"milestone",
	"rc",
	"cr",
	"preview",
	"snapshot"
]);
const isStable = (version) => {
	const tokens = parse(version);
	if (tokens) {
		for (const token of tokens) if (token.type === TokenType.String) {
			const val = token.val.toString().toLowerCase();
			if (unstable.has(val)) return false;
		}
		return true;
	}
	return false;
};
const matches = (a, b) => {
	const versionTokens = parse(a);
	if (!a || !versionTokens || !b) return false;
	if (isVersion(b)) return equals(a, b);
	const singleVersionRange = parseSingleVersionRange(b);
	if (singleVersionRange) {
		const { val } = singleVersionRange;
		return equals(a, val);
	}
	const prefixRange = parsePrefixRange(b);
	if (prefixRange) {
		const tokens = prefixRange.tokens;
		if (tokens.length === 0) return true;
		return equals(versionTokens.slice(0, tokens.length).map(({ val }) => val).join("."), tokens.map(({ val }) => val).join("."));
	}
	const mavenBasedRange = parseMavenBasedRange(b);
	if (!mavenBasedRange) return false;
	const { leftBound, leftVal, rightBound, rightVal } = mavenBasedRange;
	let leftResult = true;
	let rightResult = true;
	if (leftVal) leftResult = leftBound === "exclusive" ? compare(leftVal, a) === -1 : compare(leftVal, a) !== 1;
	if (rightVal) rightResult = rightBound === "exclusive" ? compare(a, rightVal) === -1 : compare(a, rightVal) !== 1;
	return leftResult && rightResult;
};
function getSatisfyingVersion(versions, range) {
	return versions.reduce((result, version) => {
		if (matches(version, range)) {
			if (!result) return version;
			if (isGreaterThan(version, result)) return version;
		}
		return result;
	}, null);
}
function minSatisfyingVersion(versions, range) {
	return versions.reduce((result, version) => {
		if (matches(version, range)) {
			if (!result) return version;
			if (compare(version, result) === -1) return version;
		}
		return result;
	}, null);
}
function getNewValue({ currentValue, rangeStrategy, newVersion }) {
	if (isVersion(currentValue)) return newVersion;
	const prefixRange = parsePrefixRange(currentValue);
	const parsedNewVersion = parse(newVersion);
	if (prefixRange && parsedNewVersion) if (prefixRange.tokens.length > 0) if (prefixRange.tokens.length <= parsedNewVersion.length) return `${prefixRange.tokens.map((_, i) => parsedNewVersion[i].val).join(".")}.+`;
	else return newVersion;
	else return null;
	const mavenRange = parseMavenBasedRange(currentValue);
	if (mavenRange?.preferredVal) {
		const { leftVal, rightVal, preferredVal } = mavenRange;
		const baseRange = currentValue.slice(0, currentValue.lastIndexOf(`!!${preferredVal}`));
		const newBaseRange = api$1.getNewValue({
			currentValue: baseRange,
			rangeStrategy,
			newVersion
		});
		// v8 ignore if: the implementation has a non-null return type
		if (newBaseRange === null) return null;
		const preferredIsBoundary = preferredVal === leftVal || preferredVal === rightVal;
		const newParsed = parseMavenBasedRange(newBaseRange);
		const preferredStillPresent = newParsed?.leftVal === preferredVal || newParsed?.rightVal === preferredVal;
		return `${newBaseRange}!!${preferredIsBoundary && !preferredStillPresent ? newVersion : preferredVal}`;
	}
	return api$1.getNewValue({
		currentValue,
		rangeStrategy,
		newVersion
	});
}
const api = {
	equals,
	getMajor,
	getMinor,
	getPatch,
	isCompatible: isVersion,
	isGreaterThan,
	isSingleVersion: isVersion,
	isStable,
	isValid,
	isVersion,
	matches,
	getSatisfyingVersion,
	minSatisfyingVersion,
	getNewValue,
	sortVersions: compare
};
//#endregion
export { api as default, id };

//# sourceMappingURL=index.js.map