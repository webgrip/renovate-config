import { logger } from "../../../../../../logger/index.js";
import { GitlabHttp } from "../../../../../../util/http/gitlab.js";
import { compareChangelogFilePath } from "../common.js";
import changelogFilenameRegex from "changelog-filename-regex";
const http = new GitlabHttp("gitlab-changelog");
async function getReleaseNotesMd(repository, apiBaseUrl, sourceDirectory) {
	logger.trace("gitlab.getReleaseNotesMd()");
	const apiPrefix = `${apiBaseUrl}projects/${encodeURIComponent(repository)}/repository/`;
	const allFiles = (await http.getJsonUnchecked(`${apiPrefix}tree?per_page=100${sourceDirectory ? `&path=${sourceDirectory}` : ""}`, { paginate: true })).body.filter((f) => f.type === "blob");
	let files = [];
	if (!files.length) files = allFiles.filter((f) => changelogFilenameRegex.test(f.name));
	if (!files.length) {
		logger.trace("no changelog file found");
		return null;
	}
	const { path: changelogFile, id } = files.sort((a, b) => compareChangelogFilePath(a.name, b.name)).shift();
	/* istanbul ignore if */
	if (files.length !== 0) logger.debug(`Multiple candidates for changelog file, using ${changelogFile}`);
	return {
		changelogFile,
		changelogMd: `${(await http.getText(`${apiPrefix}blobs/${id}/raw`)).body}\n#\n##`
	};
}
async function getReleaseList(project, _release) {
	logger.trace("gitlab.getReleaseNotesMd()");
	const apiBaseUrl = project.apiBaseUrl;
	const repository = project.repository;
	const apiUrl = `${apiBaseUrl}projects/${encodeURIComponent(repository)}/releases`;
	return (await http.getJsonUnchecked(`${apiUrl}?per_page=100`, { paginate: true })).body.map((release) => ({
		url: `${project.baseUrl}${repository}/-/releases/${release.tag_name}`,
		notesSourceUrl: apiUrl,
		name: release.name,
		body: release.description,
		tag: release.tag_name
	}));
}
//#endregion
export { getReleaseList, getReleaseNotesMd };

//# sourceMappingURL=index.js.map