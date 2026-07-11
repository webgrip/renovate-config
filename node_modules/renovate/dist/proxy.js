import { logger } from "./logger/index.js";
import { isNonEmptyString } from "@sindresorhus/is";
import { createGlobalProxyAgent } from "global-agent";
//#region lib/proxy.ts
const envVars = [
	"HTTP_PROXY",
	"HTTPS_PROXY",
	"NO_PROXY"
];
let agent = false;
function bootstrap() {
	envVars.forEach((envVar) => {
		/* v8 ignore next -- env is case-insensitive on windows */
		if (typeof process.env[envVar] === "undefined" && typeof process.env[envVar.toLowerCase()] !== "undefined") process.env[envVar] = process.env[envVar.toLowerCase()];
		if (process.env[envVar]) {
			logger.debug(`Detected ${envVar} value in env`);
			process.env[envVar.toLowerCase()] = process.env[envVar];
		}
	});
	if (isNonEmptyString(process.env.HTTP_PROXY) || isNonEmptyString(process.env.HTTPS_PROXY)) {
		createGlobalProxyAgent({ environmentVariableNamespace: "" });
		agent = true;
	} else agent = false;
}
function hasProxy() {
	return agent === true;
}
//#endregion
export { bootstrap, hasProxy };

//# sourceMappingURL=proxy.js.map