import { CONFIG_SECRETS_EXPOSED, CONFIG_VALIDATION, MISSING_API_CREDENTIALS, RepositoryErrors } from "../../constants/error-messages.js";
import { logger } from "../../logger/index.js";
//#region lib/workers/repository/result.ts
function processResult(config, res) {
	const enabledStatuses = [
		CONFIG_SECRETS_EXPOSED,
		CONFIG_VALIDATION,
		MISSING_API_CREDENTIALS
	];
	let status;
	let enabled;
	let onboarded;
	// istanbul ignore next
	if (RepositoryErrors.includes(res)) {
		status = "disabled";
		enabled = false;
	} else if (config.repoIsActivated) {
		status = "activated";
		enabled = true;
		onboarded = true;
	} else if (enabledStatuses.includes(res) || config.repoIsOnboarded) {
		status = "onboarded";
		enabled = true;
		onboarded = true;
	} else if (config.repoIsOnboarded === false) {
		status = "onboarding";
		enabled = true;
		onboarded = false;
	} else {
		logger.debug(`Unknown res: ${res}`);
		status = "unknown";
	}
	logger.debug(`Repository result: ${res}, status: ${status}, enabled: ${enabled}, onboarded: ${onboarded}`);
	return {
		res,
		status,
		enabled,
		onboarded
	};
}
//#endregion
export { processResult };

//# sourceMappingURL=result.js.map