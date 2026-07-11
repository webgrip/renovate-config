import { regEx } from "../../../../util/regex.js";
import { isString } from "@sindresorhus/is";
//#region lib/workers/repository/process/lookup/current.ts
function getCurrentVersion(currentValue, lockedVersion, versioningApi, rangeStrategy, latestVersion, allVersions) {
	// istanbul ignore if
	if (!isString(currentValue)) return null;
	let useVersions = allVersions.filter((v) => versioningApi.matches(v, currentValue));
	if (useVersions.length === 1) return useVersions[0];
	if (latestVersion && versioningApi.matches(latestVersion, currentValue)) useVersions = useVersions.filter((v) => !versioningApi.isGreaterThan(v, latestVersion));
	if (rangeStrategy === "pin") return lockedVersion || versioningApi.getSatisfyingVersion(useVersions, currentValue);
	if (rangeStrategy === "bump") return versioningApi.minSatisfyingVersion(useVersions, currentValue);
	const satisfyingVersion = versioningApi.getSatisfyingVersion(useVersions, currentValue);
	if (satisfyingVersion) return satisfyingVersion;
	if (versioningApi.isVersion(currentValue)) return currentValue;
	if (versioningApi.isSingleVersion(currentValue)) return currentValue.replace(regEx(/=/g), "").trim();
	return null;
}
//#endregion
export { getCurrentVersion };

//# sourceMappingURL=current.js.map