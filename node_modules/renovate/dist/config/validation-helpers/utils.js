import { regEx } from "../../util/regex.js";
import { logger } from "../../logger/index.js";
import { isNonEmptyArray, isNonEmptyString, isNumber, isString } from "@sindresorhus/is";
import jsonata from "jsonata";
//#region lib/config/validation-helpers/utils.ts
function getParentName(parentPath) {
	return parentPath ? parentPath.replace(regEx(/\.?encrypted$/), "").replace(regEx(/\[\d+\]$/), "").split(".").pop() : ".";
}
function validatePlainObject(val) {
	for (const [key, value] of Object.entries(val)) if (!isString(value)) return key;
	return true;
}
function validateNumber(key, val, allowsNegative, currentPath, subKey) {
	const errors = [];
	const path = `${currentPath}${subKey ? `.${subKey}` : ""}`;
	if (isNumber(val)) {
		if (val < 0 && !allowsNegative) errors.push({
			topic: "Configuration Error",
			message: `Configuration option \`${path}\` should be a positive integer. Found negative value instead.`
		});
	} else errors.push({
		topic: "Configuration Error",
		message: `Configuration option \`${path}\` should be an integer. Found: ${JSON.stringify(val)} (${typeof val}).`
	});
	return errors;
}
/**  An option is a false global if it has the same name as a global only option
*   but is actually just the field of a non global option or field an children of the non global option
*   eg. token: it's global option used as the bot's token as well and
*   also it can be the token used for a platform inside the hostRules configuration
*/
function isFalseGlobal(optionName, parentPath) {
	if (parentPath?.includes("hostRules")) {
		// v8 ignore else -- TODO: add test #40625
		if (optionName === "token" || optionName === "username" || optionName === "password") return true;
	}
	return false;
}
function hasField(customManager, field) {
	const templateField = `${field}Template`;
	const fieldStr = customManager.customType === "regex" ? `(?<${field}>` : field;
	return !!(customManager[templateField] ?? customManager.matchStrings?.some((matchString) => matchString.includes(fieldStr)));
}
function validateRegexManagerFields(customManager, currentPath, errors) {
	if (isNonEmptyArray(customManager.matchStrings)) for (const matchString of customManager.matchStrings) try {
		regEx(matchString);
	} catch (err) {
		logger.debug({ err }, "customManager.matchStrings regEx validation error");
		errors.push({
			topic: "Configuration Error",
			message: `Invalid regExp for ${currentPath}: \`${matchString}\``
		});
	}
	else errors.push({
		topic: "Configuration Error",
		message: "Each Custom Manager `matchStrings` array must have at least one item."
	});
	for (const field of ["currentValue", "datasource"]) if (!hasField(customManager, field)) errors.push({
		topic: "Configuration Error",
		message: `Regex Managers must contain ${field}Template configuration or regex group named ${field}`
	});
	if (!["depName", "packageName"].some((field) => hasField(customManager, field))) errors.push({
		topic: "Configuration Error",
		message: `Regex Managers must contain depName or packageName regex groups or templates`
	});
}
function validateJSONataManagerFields(customManager, currentPath, errors) {
	if (!isNonEmptyString(customManager.fileFormat)) errors.push({
		topic: "Configuration Error",
		message: "Each JSONata manager must contain a fileFormat field."
	});
	if (isNonEmptyArray(customManager.matchStrings)) for (const matchString of customManager.matchStrings) try {
		jsonata(matchString);
	} catch (err) {
		logger.debug({ err }, "customManager.matchStrings JSONata query validation error");
		errors.push({
			topic: "Configuration Error",
			message: `Invalid JSONata query for ${currentPath}: \`${matchString}\``
		});
	}
	else errors.push({
		topic: "Configuration Error",
		message: `Each Custom Manager must contain a non-empty matchStrings array`
	});
	for (const field of ["currentValue", "datasource"]) if (!hasField(customManager, field)) errors.push({
		topic: "Configuration Error",
		message: `JSONata Managers must contain ${field}Template configuration or ${field} in the query `
	});
	if (!["depName", "packageName"].some((field) => hasField(customManager, field))) errors.push({
		topic: "Configuration Error",
		message: `JSONata Managers must contain depName or packageName in the query or their templates`
	});
}
//#endregion
export { getParentName, isFalseGlobal, validateJSONataManagerFields, validateNumber, validatePlainObject, validateRegexManagerFields };

//# sourceMappingURL=utils.js.map