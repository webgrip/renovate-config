import { logger } from "../../../../../../logger/index.js";
import { ensureTrailingSlash, joinUrlParts } from "../../../../../../util/url.js";
import { BitbucketServerHttp } from "../../../../../../util/http/bitbucket-server.js";
import { Files } from "../../../../../../modules/platform/bitbucket-server/schema.js";
import { compareChangelogFilePath } from "../common.js";
import changelogFilenameRegex from "changelog-filename-regex";
import path from "node:path";
const http = new BitbucketServerHttp("bitbucket-server-changelog");
async function getReleaseNotesMd(repository, apiBaseUrl, sourceDirectory) {
	logger.info("bitbucketServer.getReleaseNotesMd()");
	const [projectKey, repositorySlug] = repository.split("/");
	const apiRepoBaseUrl = joinUrlParts(apiBaseUrl, `projects`, projectKey, "repos", repositorySlug);
	const repositorySourceURl = joinUrlParts(apiRepoBaseUrl, "files", sourceDirectory ?? "");
	const changelogFiles = (await http.getJson(repositorySourceURl, { paginate: true }, Files)).body.filter((f) => changelogFilenameRegex.test(path.basename(f)));
	let changelogFile = changelogFiles.sort((a, b) => compareChangelogFilePath(a, b)).shift();
	if (!changelogFile) {
		logger.trace("no changelog file found");
		return null;
	}
	changelogFile = `${sourceDirectory ? ensureTrailingSlash(sourceDirectory) : ""}${changelogFile}`;
	if (changelogFiles.length !== 0) logger.debug(`Multiple candidates for changelog file, using ${changelogFile}`);
	const changelogMd = `${(await http.getText(joinUrlParts(apiRepoBaseUrl, "raw", changelogFile))).body}\n#\n##`;
	return {
		changelogFile,
		changelogMd
	};
}
//#endregion
export { getReleaseNotesMd };

//# sourceMappingURL=index.js.map