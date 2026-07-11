import { logger } from "../../../../../../logger/index.js";
import { joinUrlParts } from "../../../../../../util/url.js";
import { BitbucketHttp } from "../../../../../../util/http/bitbucket.js";
import { PagedSourceResults } from "../../../../../../modules/platform/bitbucket/schema.js";
import { compareChangelogFilePath } from "../common.js";
import { isNullOrUndefined } from "@sindresorhus/is";
import changelogFilenameRegex from "changelog-filename-regex";
import path from "node:path";
const bitbucketHttp = new BitbucketHttp("bitbucket-changelog");
async function getReleaseNotesMd(repository, apiBaseUrl, sourceDirectory) {
	logger.trace("bitbucket.getReleaseNotesMd()");
	const repositorySourceURl = joinUrlParts(apiBaseUrl, "2.0/repositories", repository, "src/HEAD", sourceDirectory ?? "");
	const files = (await bitbucketHttp.getJson(repositorySourceURl, { paginate: true }, PagedSourceResults)).body.values.filter((f) => f.type === "commit_file").filter((f) => changelogFilenameRegex.test(path.basename(f.path)));
	const changelogFile = files.sort((a, b) => compareChangelogFilePath(a.path, b.path)).shift();
	if (isNullOrUndefined(changelogFile)) {
		logger.trace("no changelog file found");
		return null;
	}
	if (files.length !== 0) logger.debug(`Multiple candidates for changelog file, using ${changelogFile.path}`);
	const changelogMd = `${(await bitbucketHttp.getText(joinUrlParts(apiBaseUrl, "2.0/repositories", repository, "src", changelogFile.commit.hash, changelogFile.path))).body}\n#\n##`;
	return {
		changelogFile: changelogFile.path,
		changelogMd
	};
}
function getReleaseList(_project, _release) {
	logger.trace("bitbucket.getReleaseList()");
	logger.info("Unsupported Bitbucket Cloud feature.  Skipping release fetching.");
	return [];
}
//#endregion
export { getReleaseList, getReleaseNotesMd };

//# sourceMappingURL=index.js.map