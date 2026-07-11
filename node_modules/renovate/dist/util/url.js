import { regEx } from "./regex.js";
import { logger } from "../logger/index.js";
import { isArray, isNonEmptyString, isString, isUrlInstance } from "@sindresorhus/is";
import _parseLinkHeader from "parse-link-header";
import urlJoin from "url-join";
//#region lib/util/url.ts
function joinUrlParts(...parts) {
	return urlJoin(...parts);
}
function ensurePathPrefix(url, prefix) {
	const parsed = new URL(url);
	const fullPath = parsed.pathname + parsed.search;
	if (fullPath.startsWith(prefix)) return url;
	return parsed.origin + prefix + fullPath;
}
function ensureTrailingSlash(url) {
	return url.replace(/\/?$/, "/");
}
function trimTrailingSlash(url) {
	return url.replace(regEx(/\/+$/), "");
}
function trimLeadingSlash(path) {
	return path.replace(/^\/+/, "");
}
function trimSlashes(path) {
	return trimLeadingSlash(trimTrailingSlash(path));
}
/**
* Resolves an input path against a base URL
*
* @param baseUrl - base URL to resolve against
* @param input - input path (if this is a full URL, it will be returned)
*/
function resolveBaseUrl(baseUrl, input) {
	const inputString = input.toString();
	let host;
	let pathname;
	try {
		({host, pathname} = new URL(inputString));
	} catch {
		pathname = inputString;
	}
	return host ? inputString : urlJoin(baseUrl, pathname || "");
}
/**
* Replaces the path of a URL with a new path
*
* @param baseUrl - source URL
* @param path - replacement path (if this is a full URL, it will be returned)
*/
function replaceUrlPath(baseUrl, path) {
	if (parseUrl(path)) return path;
	const { origin } = isString(baseUrl) ? new URL(baseUrl) : baseUrl;
	return urlJoin(origin, path);
}
function getQueryString(params) {
	const usp = new URLSearchParams();
	for (const [k, v] of Object.entries(params)) if (isArray(v)) for (const item of v) usp.append(k, item.toString());
	else usp.append(k, v.toString());
	return usp.toString();
}
function isHttpUrl(url) {
	if (!isNonEmptyString(url) && !isUrlInstance(url)) return false;
	const protocol = parseUrl(url)?.protocol;
	return protocol === "https:" || protocol === "http:";
}
function parseUrl(url) {
	if (!url) return null;
	if (url instanceof URL) return url;
	try {
		return new URL(url);
	} catch {
		return null;
	}
}
/**
* Tries to create an URL object from either a full URL string or a hostname
* @param url either the full url or a hostname
* @returns an URL object or null
*/
function createURLFromHostOrURL(url) {
	return parseUrl(url) ?? parseUrl(`https://${url}`);
}
function parseLinkHeader(linkHeader) {
	if (!isNonEmptyString(linkHeader)) return null;
	if (linkHeader.length > 2e3) {
		logger.warn({ linkHeader }, "Link header too long.");
		return null;
	}
	return _parseLinkHeader(linkHeader);
}
/**
* prefix https:// to hosts with port or path
*/
function massageHostUrl(url) {
	if (!url.includes("://") && url.includes("/")) return `https://${url}`;
	else if (!url.includes("://") && url.includes(":")) return `https://${url}`;
	else return url;
}
//#endregion
export { createURLFromHostOrURL, ensurePathPrefix, ensureTrailingSlash, getQueryString, isHttpUrl, joinUrlParts, massageHostUrl, parseLinkHeader, parseUrl, replaceUrlPath, resolveBaseUrl, trimLeadingSlash, trimSlashes, trimTrailingSlash };

//# sourceMappingURL=url.js.map