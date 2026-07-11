import _parseLinkHeader from "parse-link-header";

//#region lib/util/url.d.ts
declare function joinUrlParts(...parts: string[]): string;
declare function ensurePathPrefix(url: string, prefix: string): string;
declare function ensureTrailingSlash(url: string): string;
declare function trimTrailingSlash(url: string): string;
declare function trimLeadingSlash(path: string): string;
declare function trimSlashes(path: string): string;
/**
 * Resolves an input path against a base URL
 *
 * @param baseUrl - base URL to resolve against
 * @param input - input path (if this is a full URL, it will be returned)
 */
declare function resolveBaseUrl(baseUrl: string, input: string | URL): string;
/**
 * Replaces the path of a URL with a new path
 *
 * @param baseUrl - source URL
 * @param path - replacement path (if this is a full URL, it will be returned)
 */
declare function replaceUrlPath(baseUrl: string | URL, path: string): string;
declare function getQueryString(params: Record<string, any>): string;
declare function isHttpUrl(url: unknown): boolean;
declare function parseUrl(url: URL | string | undefined | null): URL | null;
/**
 * Tries to create an URL object from either a full URL string or a hostname
 * @param url either the full url or a hostname
 * @returns an URL object or null
 */
declare function createURLFromHostOrURL(url: string): URL | null;
type LinkHeaderLinks = _parseLinkHeader.Links;
declare function parseLinkHeader(linkHeader: string | null | undefined): LinkHeaderLinks | null;
/**
 * prefix https:// to hosts with port or path
 */
declare function massageHostUrl(url: string): string;
//#endregion
export { LinkHeaderLinks, createURLFromHostOrURL, ensurePathPrefix, ensureTrailingSlash, getQueryString, isHttpUrl, joinUrlParts, massageHostUrl, parseLinkHeader, parseUrl, replaceUrlPath, resolveBaseUrl, trimLeadingSlash, trimSlashes, trimTrailingSlash };
//# sourceMappingURL=url.d.ts.map