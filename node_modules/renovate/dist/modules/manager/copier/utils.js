import { logger } from "../../../logger/index.js";
import { isNonEmptyString } from "@sindresorhus/is";
//#region lib/modules/manager/copier/utils.ts
function getPythonVersionConstraint(config) {
	const { constraints = {} } = config;
	const { python } = constraints;
	if (isNonEmptyString(python)) {
		logger.debug("Using python constraint from config");
		return python;
	}
}
function getCopierVersionConstraint(config) {
	const { constraints = {} } = config;
	const { copier } = constraints;
	if (isNonEmptyString(copier)) {
		logger.debug("Using copier constraint from config");
		return copier;
	}
	return "";
}
//#endregion
export { getCopierVersionConstraint, getPythonVersionConstraint };

//# sourceMappingURL=utils.js.map