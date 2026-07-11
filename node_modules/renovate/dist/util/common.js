import { GlobalConfig } from "../config/global.js";
import { logger } from "../logger/index.js";
import { AZURE_API_USING_HOST_TYPES, BITBUCKET_API_USING_HOST_TYPES, BITBUCKET_SERVER_API_USING_HOST_TYPES, FORGEJO_API_USING_HOST_TYPES, GITEA_API_USING_HOST_TYPES, GITHUB_API_USING_HOST_TYPES, GITLAB_API_USING_HOST_TYPES } from "../constants/platforms.js";
import { parseUrl } from "./url.js";
import { InheritConfig, NOT_PRESENT } from "../config/inherit.js";
import { hostType } from "./host-rules.js";
import { isNumber } from "@sindresorhus/is";
import JSON5 from "json5";
import { parse } from "jsonc-weaver";
//#region lib/util/common.ts
/**
* Tries to detect the `platform` from a url.
*
* @param url the url to detect `platform` from
* @returns matched `platform` if found, otherwise `null`
*/
function detectPlatform(url) {
	const { hostname } = parseUrl(url) ?? {};
	if (hostname === "dev.azure.com" || hostname?.endsWith(".visualstudio.com")) return "azure";
	if (hostname === "bitbucket.org" || hostname === "bitbucket.com") return "bitbucket";
	if (hostname?.includes("bitbucket")) return "bitbucket-server";
	if (hostname?.includes("forgejo")) return "forgejo";
	if (hostname && ["codeberg.org", "codefloe.com"].includes(hostname)) return "forgejo";
	if (hostname && (["gitea.com"].includes(hostname) || hostname.includes("gitea"))) return "gitea";
	if (hostname === "github.com" || hostname?.includes("github")) return "github";
	if (hostname === "gitlab.com" || hostname?.includes("gitlab")) return "gitlab";
	const hostType$1 = hostType({ url });
	if (!hostType$1) return null;
	if (AZURE_API_USING_HOST_TYPES.includes(hostType$1)) return "azure";
	if (BITBUCKET_SERVER_API_USING_HOST_TYPES.includes(hostType$1)) return "bitbucket-server";
	if (BITBUCKET_API_USING_HOST_TYPES.includes(hostType$1)) return "bitbucket";
	if (FORGEJO_API_USING_HOST_TYPES.includes(hostType$1)) return "forgejo";
	if (GITEA_API_USING_HOST_TYPES.includes(hostType$1)) return "gitea";
	if (GITHUB_API_USING_HOST_TYPES.includes(hostType$1)) return "github";
	if (GITLAB_API_USING_HOST_TYPES.includes(hostType$1)) return "gitlab";
	return null;
}
function noLeadingAtSymbol(input) {
	return input.startsWith("@") ? input.slice(1) : input;
}
function parseJson(content, filename) {
	if (!content) return null;
	if (filename.endsWith(".jsonc")) return parseJsonc(content);
	if (filename.endsWith(".json5")) return JSON5.parse(content);
	return parseJsonWithFallback(content, filename);
}
function parseJsonWithFallback(content, context) {
	let parsedJson;
	try {
		parsedJson = parseJsonc(content);
	} catch {
		parsedJson = JSON5.parse(content);
		logger.warn({ context }, "File contents are invalid JSONC but parse using JSON5. Support for this will be removed in a future release so please change to a support .json5 file name or ensure correct JSON syntax.");
	}
	return parsedJson;
}
function parseJsonc(content) {
	return parse(content);
}
/**
* Use only if an option is inherited + globalOnly
* For globalOnly options use GlobalConfig.get
*/
function getInheritedOrGlobal(key) {
	const inheritedValue = InheritConfig.get(key);
	const globalValue = GlobalConfig.get(key);
	if (inheritedValue !== NOT_PRESENT) {
		if (key === "onboardingAutoCloseAge" && isNumber(inheritedValue) && isNumber(globalValue)) {
			if (globalValue < inheritedValue) return globalValue;
		}
		return inheritedValue;
	}
	return globalValue;
}
//#endregion
export { detectPlatform, getInheritedOrGlobal, noLeadingAtSymbol, parseJson, parseJsonc };

//# sourceMappingURL=common.js.map