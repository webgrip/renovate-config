import { toBase64 } from "./string.js";
import { addSecretForSanitizing, clearRepoSanitizedSecretsList } from "./sanitize.js";
import { logger } from "../logger/index.js";
import { clone } from "./clone.js";
import { isHttpUrl, massageHostUrl, parseUrl } from "./url.js";
import { isFalsy, isString, isTruthy, isUndefined } from "@sindresorhus/is";
//#region lib/util/host-rules.ts
let hostRules = [];
function migrateRule(rule) {
	const cloned = clone(rule);
	delete cloned.hostName;
	delete cloned.domainName;
	delete cloned.baseUrl;
	const result = cloned;
	const { matchHost } = result;
	const { hostName, domainName, baseUrl } = rule;
	const hostValues = [
		matchHost,
		hostName,
		domainName,
		baseUrl
	].filter(Boolean);
	if (hostValues.length === 1) {
		const [matchHost] = hostValues;
		result.matchHost = matchHost;
	} else if (hostValues.length > 1) throw new Error(`hostRules cannot contain more than one host-matching field - use "matchHost" only.`);
	return result;
}
function add(params) {
	const rule = migrateRule(params);
	const confidentialFields = ["password", "token"];
	if (rule.matchHost) {
		rule.matchHost = massageHostUrl(rule.matchHost);
		rule.resolvedHost = parseUrl(rule.matchHost)?.hostname ?? rule.matchHost;
		confidentialFields.forEach((field) => {
			if (rule[field]) logger.debug(`Adding ${field} authentication for ${rule.matchHost} (hostType=${rule.hostType}) to hostRules`);
		});
	}
	confidentialFields.forEach((field) => {
		const secret = rule[field];
		if (isString(secret) && secret.length > 3) addSecretForSanitizing(secret);
	});
	if (rule.username && rule.password) addSecretForSanitizing(toBase64(`${rule.username}:${rule.password}`));
	hostRules.push(rule);
}
function matchesHost(url, matchHost) {
	const parsedUrl = parseUrl(url);
	if (!parsedUrl) return false;
	const parsedMatchHost = parseUrl(matchHost);
	if (isHttpUrl(parsedUrl) && isHttpUrl(parsedMatchHost)) return parsedUrl.href.startsWith(parsedMatchHost.href);
	const { hostname } = parsedUrl;
	if (!hostname) return false;
	if (hostname === matchHost) return true;
	const topLevelSuffix = matchHost.startsWith(".") ? matchHost : `.${matchHost}`;
	return hostname.endsWith(topLevelSuffix);
}
function fromShorterToLongerMatchHost(a, b) {
	if (!a.matchHost || !b.matchHost) return 0;
	return a.matchHost.length - b.matchHost.length;
}
function hostRuleRank({ hostType, matchHost, readOnly }) {
	if ((hostType || readOnly) && matchHost) return 3;
	if (matchHost) return 2;
	if (hostType) return 1;
	return 0;
}
function fromLowerToHigherRank(a, b) {
	return hostRuleRank(a) - hostRuleRank(b);
}
function find(search) {
	if ([search.hostType, search.url].every(isFalsy)) {
		logger.warn({ search }, "Invalid hostRules search");
		return {};
	}
	const sortedRules = hostRules.sort(fromShorterToLongerMatchHost).sort(fromLowerToHigherRank);
	const matchedRules = [];
	for (const rule of sortedRules) {
		let hostTypeMatch = true;
		let hostMatch = true;
		let readOnlyMatch = true;
		if (rule.hostType) {
			hostTypeMatch = false;
			// v8 ignore else -- TODO: add test #40625
			if (search.hostType === rule.hostType) hostTypeMatch = true;
		}
		if (rule.matchHost && rule.resolvedHost) {
			hostMatch = false;
			if (search.url) hostMatch = matchesHost(search.url, rule.matchHost);
		}
		if (!isUndefined(rule.readOnly)) {
			readOnlyMatch = false;
			// v8 ignore else -- TODO: add test #40625
			if (search.readOnly === rule.readOnly) {
				readOnlyMatch = true;
				hostTypeMatch = true;
			}
		}
		if (hostTypeMatch && readOnlyMatch && hostMatch) matchedRules.push(clone(rule));
	}
	const res = Object.assign({}, ...matchedRules);
	delete res.hostType;
	delete res.resolvedHost;
	delete res.matchHost;
	delete res.readOnly;
	return res;
}
function hosts({ hostType }) {
	return hostRules.filter((rule) => rule.hostType === hostType).map((rule) => rule.resolvedHost).filter(isTruthy);
}
function hostType({ url }) {
	return hostRules.filter((rule) => rule.matchHost && matchesHost(url, rule.matchHost)).sort(fromShorterToLongerMatchHost).map((rule) => rule.hostType).filter(isTruthy).pop() ?? null;
}
function findAll({ hostType }) {
	return hostRules.filter((rule) => rule.hostType === hostType);
}
/**
* @returns a deep copy of all known host rules without any filtering
*/
function getAll() {
	return clone(hostRules);
}
function clear() {
	logger.debug("Clearing hostRules");
	hostRules = [];
	clearRepoSanitizedSecretsList();
}
//#endregion
export { add, clear, find, findAll, getAll, hostType, hosts, matchesHost, migrateRule };

//# sourceMappingURL=host-rules.js.map