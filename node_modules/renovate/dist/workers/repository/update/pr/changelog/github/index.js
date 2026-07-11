import { fromBase64 } from "../../../../../../util/string.js";
import { logger } from "../../../../../../logger/index.js";
import { ensureTrailingSlash, joinUrlParts } from "../../../../../../util/url.js";
import { GithubHttp } from "../../../../../../util/http/github.js";
import { memCacheProvider } from "../../../../../../util/http/cache/memory-http-cache-provider.js";
import { queryReleases } from "../../../../../../util/github/graphql/index.js";
import { compareChangelogFilePath } from "../common.js";
import changelogFilenameRegex from "changelog-filename-regex";
const http = new GithubHttp("github-changelog");
async function getReleaseNotesMd(repository, apiBaseUrl, sourceDirectory) {
	logger.trace("github.getReleaseNotesMd()");
	const apiPrefix = `${ensureTrailingSlash(apiBaseUrl)}repos/${repository}`;
	const { default_branch: defaultBranch = "HEAD" } = (await http.getJsonUnchecked(apiPrefix, { cacheProvider: memCacheProvider })).body;
	const res = await http.getJsonUnchecked(`${apiPrefix}/git/trees/${defaultBranch}${sourceDirectory ? "?recursive=1" : ""}`, { cacheProvider: memCacheProvider });
	// istanbul ignore if
	if (res.body.truncated) logger.debug(`Git tree truncated repository:${repository}`);
	const allFiles = res.body.tree.filter((f) => f.type === "blob");
	let files = [];
	if (sourceDirectory?.length) files = allFiles.filter((f) => f.path.startsWith(sourceDirectory)).filter((f) => changelogFilenameRegex.test(f.path.replace(ensureTrailingSlash(sourceDirectory), "")));
	if (!files.length) files = allFiles.filter((f) => changelogFilenameRegex.test(f.path));
	if (!files.length) {
		logger.trace("no changelog file found");
		return null;
	}
	const { path: changelogFile, sha } = files.sort((a, b) => compareChangelogFilePath(a.path, b.path)).shift();
	/* istanbul ignore if */
	if (files.length !== 0) logger.debug(`Multiple candidates for changelog file, using ${changelogFile}`);
	return {
		changelogFile,
		changelogMd: `${fromBase64((await http.getJsonUnchecked(`${apiPrefix}/git/blobs/${sha}`, { cacheProvider: memCacheProvider })).body.content)}\n#\n##`
	};
}
async function getReleaseList(project, _release) {
	logger.trace("github.getReleaseList()");
	const apiBaseUrl = project.apiBaseUrl;
	const repository = project.repository;
	const notesSourceUrl = joinUrlParts(apiBaseUrl, "repos", repository, "releases");
	return (await queryReleases({
		registryUrl: apiBaseUrl,
		packageName: repository
	}, http)).map(({ url, id, version: tag, name, description: body }) => ({
		url,
		notesSourceUrl,
		id,
		tag,
		name,
		body
	}));
}
//#endregion
export { getReleaseList, getReleaseNotesMd };

//# sourceMappingURL=index.js.map