//#region lib/workers/repository/process/lookup/update-type.ts
function getUpdateType(config, versioningApi, currentVersion, newVersion) {
	if (versioningApi.isSame && !versioningApi.isSame("major", newVersion, currentVersion)) return "major";
	if (versioningApi.getMajor(newVersion) > versioningApi.getMajor(currentVersion)) return "major";
	if (versioningApi.getMinor(newVersion) > versioningApi.getMinor(currentVersion)) return "minor";
	return "patch";
}
//#endregion
export { getUpdateType };

//# sourceMappingURL=update-type.js.map