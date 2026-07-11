//#region lib/workers/repository/process/lookup/bucket.ts
function getBucket(config, currentVersion, newVersion, versioningApi) {
	const { separateMajorMinor, separateMultipleMajor, separateMultipleMinor, separateMinorPatch } = config;
	if (!separateMajorMinor) return "latest";
	const fromMajor = versioningApi.getMajor(currentVersion);
	const toMajor = versioningApi.getMajor(newVersion);
	// istanbul ignore if: error case
	if (toMajor === null) return null;
	if (fromMajor !== toMajor) {
		if (separateMultipleMajor) return `v${toMajor}`;
		return "major";
	}
	const fromMinor = versioningApi.getMinor(currentVersion);
	const toMinor = versioningApi.getMinor(newVersion);
	// istanbul ignore if: error case
	if (fromMinor === null || toMinor === null) return "non-major";
	if (fromMinor !== toMinor) {
		if (separateMultipleMinor) return `v${toMajor}.${toMinor}`;
		if (separateMinorPatch) return "minor";
		return "non-major";
	}
	if (separateMinorPatch) return "patch";
	return "non-major";
}
//#endregion
export { getBucket };

//# sourceMappingURL=bucket.js.map