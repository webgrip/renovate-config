import { logger } from "../../../logger/index.js";
import { ExternalHostError } from "../../../types/errors/external-host-error.js";
import { PRESET_DEP_NOT_FOUND, fetchPreset, parsePreset } from "../util.js";
import { GitlabHttp } from "../../../util/http/gitlab.js";
import { isNonEmptyString } from "@sindresorhus/is";
//#region lib/config/presets/gitlab/index.ts
const gitlabApi = new GitlabHttp();
const Endpoint = "https://gitlab.com/api/v4/";
async function getDefaultBranchName(urlEncodedPkgName, endpoint) {
	return (await gitlabApi.getJsonUnchecked(`${endpoint}projects/${urlEncodedPkgName}`)).body.default_branch ?? "master";
}
async function fetchJSONFile(repo, fileName, endpoint, tag) {
	let url = endpoint;
	let ref = "";
	let res;
	try {
		const urlEncodedRepo = encodeURIComponent(repo);
		const urlEncodedPkgName = encodeURIComponent(fileName);
		if (isNonEmptyString(tag)) ref = `?ref=${tag}`;
		else ref = `?ref=${await getDefaultBranchName(urlEncodedRepo, endpoint)}`;
		url += `projects/${urlEncodedRepo}/repository/files/${urlEncodedPkgName}/raw${ref}`;
		logger.trace({ url }, `Preset URL`);
		res = await gitlabApi.getText(url);
	} catch (err) {
		if (err instanceof ExternalHostError) throw err;
		logger.debug(`Preset file ${fileName} not found in ${repo}: ${err.message}`);
		throw new Error(PRESET_DEP_NOT_FOUND);
	}
	return parsePreset(res.body, fileName);
}
function getPresetFromEndpoint(repo, presetName, presetPath, endpoint = Endpoint, tag) {
	return fetchPreset({
		repo,
		filePreset: presetName,
		presetPath,
		endpoint,
		tag,
		fetch: fetchJSONFile
	});
}
function getPreset({ repo, presetPath, presetName = "default", tag = void 0 }) {
	return getPresetFromEndpoint(repo, presetName, presetPath, Endpoint, tag);
}
//#endregion
export { Endpoint, fetchJSONFile, getPreset, getPresetFromEndpoint };

//# sourceMappingURL=index.js.map