import { getEnv } from "../env.js";
import { GlobalConfig } from "../../config/global.js";
import { isArray, isNumber, isString } from "@sindresorhus/is";
//#region lib/util/git/config.ts
let noVerify = ["push", "commit"];
function setNoVerify(value) {
	if (!isArray(value, isString)) throw new Error("config error: gitNoVerify should be an array of strings");
	noVerify = value;
}
function getNoVerify() {
	return noVerify;
}
function simpleGitConfig() {
	const unsafe = {
		allowUnsafeSshCommand: true,
		allowUnsafeConfigEnvCount: true
	};
	if (getEnv().RENOVATE_X_CLEAR_HOOKS) unsafe.allowUnsafeHooksPath = true;
	const config = {
		completion: {
			onClose: true,
			onExit: false
		},
		config: ["core.quotePath=false"],
		unsafe
	};
	const gitTimeout = GlobalConfig.get("gitTimeout");
	if (isNumber(gitTimeout) && gitTimeout > 0) config.timeout = { block: gitTimeout };
	return config;
}
//#endregion
export { getNoVerify, setNoVerify, simpleGitConfig };

//# sourceMappingURL=config.js.map