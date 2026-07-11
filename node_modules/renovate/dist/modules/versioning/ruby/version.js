import { regEx } from "../../../util/regex.js";
import { eq, major, minor, patch, prerelease } from "@renovatebot/ruby-semver";
import { create } from "@renovatebot/ruby-semver/dist/ruby/version.js";
//#region lib/modules/versioning/ruby/version.ts
function releaseSegments(version) {
	const v = create(version);
	if (v) return v.release().getSegments();
	/* istanbul ignore next */
	return [];
}
const parse = (version) => ({
	major: major(version),
	minor: minor(version),
	patch: patch(version),
	prerelease: prerelease(version)
});
const floor = (version) => {
	const segments = releaseSegments(version);
	if (segments.length <= 1) return segments.join(".");
	return [...segments.slice(0, -1), 0].join(".");
};
const adapt = (left, right) => left.split(".").slice(0, right.split(".").length).join(".");
const trimZeroes = (version) => {
	const segments = version.split(".");
	while (segments.length > 0 && segments[segments.length - 1] === "0") segments.pop();
	return segments.join(".");
};
const pgteUpperBound = (version) => {
	const segments = releaseSegments(version);
	if (segments.length > 1) segments.pop();
	return incrementLastSegment(segments.join("."));
};
// istanbul ignore next
const incrementLastSegment = (version) => {
	const segments = releaseSegments(version);
	const nextLast = parseInt(segments.pop(), 10) + 1;
	return [...segments, nextLast].join(".");
};
// istanbul ignore next
const incrementMajor = (maj, min, ptch, pre) => min === 0 || ptch === 0 || pre.length === 0 ? maj + 1 : maj;
// istanbul ignore next
const incrementMinor = (min, ptch, pre) => ptch === 0 || pre.length === 0 ? min + 1 : min;
// istanbul ignore next
const incrementPatch = (ptch, pre) => pre.length === 0 ? ptch + 1 : ptch;
// istanbul ignore next
const increment = (from, to) => {
	const parsed = parse(from);
	const { major: maj, prerelease: pre } = parsed;
	let { minor: min, patch: ptch } = parsed;
	min = min || 0;
	ptch = ptch || 0;
	let nextVersion;
	const adapted = adapt(to, from);
	if (eq(from, adapted)) return incrementLastSegment(from);
	const isStable = (x) => regEx(/^[0-9.-/]+$/).test(x);
	if (major(from) !== major(adapted)) nextVersion = [
		incrementMajor(maj, min, ptch, pre ?? []),
		0,
		0
	].join(".");
	else if (minor(from) !== minor(adapted)) nextVersion = [
		maj,
		incrementMinor(min, ptch, pre ?? []),
		0
	].join(".");
	else if (patch(from) !== patch(adapted)) nextVersion = [
		maj,
		min,
		incrementPatch(ptch, pre ?? [])
	].join(".");
	else if (isStable(from) && isStable(adapted)) nextVersion = [
		maj,
		min,
		incrementPatch(ptch, pre ?? [])
	].join(".");
	else nextVersion = [
		maj,
		min,
		ptch
	].join(".");
	return increment(nextVersion, to);
};
// istanbul ignore next
const decrement = (version) => {
	return releaseSegments(version).reverse().reduce((accumulator, segment, index) => {
		if (index === 0) return [segment - 1];
		if (accumulator[index - 1] === -1) return [
			...accumulator.slice(0, index - 1),
			0,
			segment - 1
		];
		return [...accumulator, segment];
	}, []).reverse().join(".");
};
//#endregion
export { adapt, decrement, floor, increment, parse, pgteUpperBound, trimZeroes };

//# sourceMappingURL=version.js.map