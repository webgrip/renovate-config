import { coerceArray } from "../../../util/array.js";
import { filterMap } from "../../../util/filter-map.js";
import { compare } from "../../versioning/maven/compare.js";
//#region lib/modules/datasource/sbt-package/util.ts
const linkRegExp = /(?<=href=['"])[^'"]*(?=\/['"])/gi;
function extractPageLinks(html, filterMapHref) {
	return filterMap(coerceArray(html.match(linkRegExp)), filterMapHref);
}
function getLatestVersion(versions) {
	if (versions?.length) return versions.reduce((latestVersion, version) => compare(version, latestVersion) === 1 ? version : latestVersion);
	return null;
}
//#endregion
export { extractPageLinks, getLatestVersion };

//# sourceMappingURL=util.js.map