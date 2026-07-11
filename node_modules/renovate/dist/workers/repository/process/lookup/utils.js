import { compile } from "../../../../util/template/index.js";
import { get } from "../../../../modules/versioning/index.js";
import { getRangeStrategy } from "../../../../modules/manager/index.js";
import { isNonEmptyString, isNullOrUndefined } from "@sindresorhus/is";
//#region lib/workers/repository/process/lookup/utils.ts
function addReplacementUpdateIfValid(updates, config) {
	const replacementNewName = determineNewReplacementName(config);
	const replacementNewValue = determineNewReplacementValue(config);
	if (config.packageName !== replacementNewName || config.currentValue !== replacementNewValue) updates.push({
		updateType: "replacement",
		newName: replacementNewName,
		newValue: replacementNewValue
	});
}
function isReplacementRulesConfigured(config) {
	return isNonEmptyString(config.replacementName) || isNonEmptyString(config.replacementNameTemplate) || isNonEmptyString(config.replacementVersion) || isNonEmptyString(config.replacementVersionTemplate);
}
function determineNewReplacementName(config) {
	if (config.replacementName) return config.replacementName;
	if (config.replacementNameTemplate) return compile(config.replacementNameTemplate, config, true);
	return config.packageName;
}
function determineNewReplacementValue(config) {
	const newVersion = getNewVersion(config);
	if (!newVersion) return config.currentValue;
	const versioningApi = get(config.versioning);
	const rangeStrategy = getRangeStrategy(config);
	return versioningApi.getNewValue({
		currentValue: config.currentValue,
		newVersion,
		rangeStrategy,
		isReplacement: true
	});
}
function getNewVersion(config) {
	if (!isNullOrUndefined(config.replacementVersion)) return config.replacementVersion;
	if (!isNullOrUndefined(config.replacementVersionTemplate)) return compile(config.replacementVersionTemplate, config, true);
	return null;
}
//#endregion
export { addReplacementUpdateIfValid, isReplacementRulesConfigured };

//# sourceMappingURL=utils.js.map