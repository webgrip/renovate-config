import { logger } from "../../../../logger/index.js";
import { toMs } from "../../../../util/pretty-time.js";
import { mergeChildConfig } from "../../../../config/utils.js";
import { coerceNumber } from "../../../../util/number.js";
import { getElapsedMs } from "../../../../util/date.js";
import "../../../../config/index.js";
import { getMergeConfidenceLevel, isActiveConfidenceLevel, satisfiesConfidenceLevel } from "../../../../util/merge-confidence/index.js";
import { applyPackageRules } from "../../../../util/package-rules/index.js";
import { postprocessRelease } from "../../../../modules/datasource/postprocess-release.js";
import { getUpdateType } from "./update-type.js";
import { isNonEmptyString, isNullOrUndefined } from "@sindresorhus/is";
//#region lib/workers/repository/process/lookup/filter-checks.ts
async function filterInternalChecks(config, versioningApi, bucket, sortedReleases) {
	const { currentVersion, datasource, depName, packageName, internalChecksFilter } = config;
	let release = void 0;
	let pendingChecks = false;
	let pendingReleases = [];
	if (internalChecksFilter === "none") release = sortedReleases.pop();
	else {
		const candidateVersionsWithoutReleaseTimestamp = {
			"timestamp-required": [],
			"timestamp-optional": []
		};
		for (let candidateRelease of sortedReleases.reverse()) {
			let releaseConfig = mergeChildConfig(config, candidateRelease);
			releaseConfig.updateType = getUpdateType(releaseConfig, versioningApi, currentVersion, candidateRelease.version);
			releaseConfig = mergeChildConfig(releaseConfig, releaseConfig[releaseConfig.updateType]);
			releaseConfig = await applyPackageRules(releaseConfig, "update-type");
			const updatedCandidateRelease = await postprocessRelease(releaseConfig, candidateRelease);
			if (!updatedCandidateRelease) continue;
			candidateRelease = updatedCandidateRelease;
			const { minimumConfidence, minimumReleaseAge, updateType } = releaseConfig;
			const minimumReleaseAgeMs = isNonEmptyString(minimumReleaseAge) ? coerceNumber(toMs(minimumReleaseAge), 0) : 0;
			if (minimumReleaseAgeMs) {
				const minimumReleaseAgeBehaviour = releaseConfig.minimumReleaseAgeBehaviour;
				// v8 ignore else -- TODO: add test #40625
				if (candidateRelease.releaseTimestamp) {
					if (getElapsedMs(candidateRelease.releaseTimestamp) < minimumReleaseAgeMs) {
						logger.trace({
							depName,
							check: "minimumReleaseAge"
						}, `Release ${candidateRelease.version} is pending status checks`);
						pendingReleases.unshift(candidateRelease);
						continue;
					}
				} else if (isNullOrUndefined(candidateRelease.releaseTimestamp) && minimumReleaseAgeBehaviour === "timestamp-required") {
					candidateVersionsWithoutReleaseTimestamp[minimumReleaseAgeBehaviour].push(candidateRelease.version);
					pendingReleases.unshift(candidateRelease);
					continue;
				} else if (isNullOrUndefined(candidateRelease.releaseTimestamp) && minimumReleaseAgeBehaviour === "timestamp-optional") candidateVersionsWithoutReleaseTimestamp[minimumReleaseAgeBehaviour].push(candidateRelease.version);
			}
			if (isActiveConfidenceLevel(minimumConfidence)) {
				if (!satisfiesConfidenceLevel(await getMergeConfidenceLevel(datasource, packageName, currentVersion, candidateRelease.version, updateType) ?? "neutral", minimumConfidence)) {
					logger.trace({
						depName,
						check: "minimumConfidence"
					}, `Release ${candidateRelease.version} is pending status checks`);
					pendingReleases.unshift(candidateRelease);
					continue;
				}
			}
			release = candidateRelease;
			break;
		}
		if (candidateVersionsWithoutReleaseTimestamp["timestamp-required"].length) logger.once.debug({
			depName,
			versions: candidateVersionsWithoutReleaseTimestamp["timestamp-required"],
			check: "minimumReleaseAge"
		}, `Marking ${candidateVersionsWithoutReleaseTimestamp["timestamp-required"].length} release(s) as pending, as they do not have a releaseTimestamp and we're running with minimumReleaseAgeBehaviour=timestamp-required`);
		if (candidateVersionsWithoutReleaseTimestamp["timestamp-optional"].length) {
			logger.once.warn("Some release(s) did not have a releaseTimestamp, but as we're running with minimumReleaseAgeBehaviour=timestamp-optional, proceeding. See debug logs for more information");
			logger.once.debug({
				depName,
				versions: candidateVersionsWithoutReleaseTimestamp["timestamp-optional"],
				check: "minimumReleaseAge"
			}, `${candidateVersionsWithoutReleaseTimestamp["timestamp-optional"].length} release(s) did not have a releaseTimestamp, but as we're running with minimumReleaseAgeBehaviour=timestamp-optional, proceeding`);
		}
		if (!release) {
			// v8 ignore else -- TODO: add test #40625
			if (pendingReleases.length) {
				logger.trace({
					depName,
					bucket
				}, "All releases are pending - using latest");
				release = pendingReleases.pop();
				pendingReleases = [];
				if (internalChecksFilter === "strict") pendingChecks = true;
			}
		}
	}
	return {
		release,
		pendingChecks,
		pendingReleases
	};
}
//#endregion
export { filterInternalChecks };

//# sourceMappingURL=filter-checks.js.map