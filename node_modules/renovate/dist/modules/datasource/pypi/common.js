import { regEx } from "../../../util/regex.js";
//#region lib/modules/datasource/pypi/common.ts
const githubRepoPattern = regEx(/^https?:\/\/github\.com\/([^/]+)\/[^/]+$/);
function isGitHubRepo(url) {
	const m = url.match(githubRepoPattern);
	return !!m && m[1] !== "sponsors";
}
function normalizePythonDepName(name) {
	return name.replace(/[-_.]+/g, "-").toLowerCase();
}
//#endregion
export { isGitHubRepo, normalizePythonDepName };

//# sourceMappingURL=common.js.map