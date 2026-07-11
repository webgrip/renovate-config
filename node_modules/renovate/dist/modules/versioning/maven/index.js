import { coerceString } from "../../../util/string.js";
import { QualifierTypes, autoExtendMavenRange, compare, isValid, isVersion, parseRange, qualifierType, tokenize } from "./compare.js";
//#region lib/modules/versioning/maven/index.ts
const id = "maven";
const equals = (a, b) => compare(a, b) === 0;
function matches(a, b) {
	if (!b) return false;
	if (isVersion(b)) return equals(a, b);
	const ranges = parseRange(b);
	if (!ranges) return false;
	return ranges.reduce((result, range) => {
		if (result) return result;
		const { leftType, leftValue, rightType, rightValue } = range;
		let leftResult = true;
		let rightResult = true;
		if (leftValue) leftResult = leftType === "EXCLUDING_POINT" ? compare(leftValue, a) === -1 : compare(leftValue, a) !== 1;
		if (rightValue) rightResult = rightType === "EXCLUDING_POINT" ? compare(a, rightValue) === -1 : compare(a, rightValue) !== 1;
		return leftResult && rightResult;
	}, false);
}
const getMajor = (version) => {
	if (isVersion(version)) return +tokenize(version)[0].val;
	return null;
};
const getMinor = (version) => {
	if (isVersion(version)) {
		const minorToken = tokenize(version)[1];
		if (minorToken?.type === "TYPE_NUMBER") return +minorToken.val;
		return 0;
	}
	return null;
};
const getPatch = (version) => {
	if (isVersion(version)) {
		const tokens = tokenize(version);
		const minorToken = tokens[1];
		const patchToken = tokens[2];
		if (patchToken && minorToken.type === "TYPE_NUMBER" && patchToken.type === "TYPE_NUMBER") return +patchToken.val;
		return 0;
	}
	return null;
};
const isGreaterThan = (a, b) => compare(a, b) === 1;
const isStable = (version) => {
	if (isVersion(version)) {
		const tokens = tokenize(version);
		for (const token of tokens) if (token.type === "TYPE_QUALIFIER") {
			const qualType = qualifierType(token);
			if (qualType && qualType < QualifierTypes.Release) return false;
		}
		return true;
	}
	return false;
};
// istanbul ignore next
const getSatisfyingVersion = (versions, range) => versions.reduce((result, version) => {
	if (matches(version, range)) {
		if (!result) return version;
		if (isGreaterThan(version, result)) return version;
	}
	return result;
}, null);
function getNewValue({ currentValue, rangeStrategy, newVersion }) {
	if (isVersion(currentValue) || rangeStrategy === "pin") return newVersion;
	return coerceString(autoExtendMavenRange(currentValue, newVersion), currentValue);
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
	minSatisfyingVersion: getSatisfyingVersion,
	getNewValue,
	sortVersions: compare
};
//#endregion
export { api as default, id };

//# sourceMappingURL=index.js.map