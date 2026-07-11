import { GlobalConfig } from "../../../config/global.js";
import { logger } from "../../../logger/index.js";
import { readLocalFile } from "../../../util/fs/index.js";
import { getGitEnvironmentVariables } from "../../../util/git/auth.js";
import { exec } from "../../../util/exec/index.js";
import { getRepoStatus } from "../../../util/git/index.js";
import { getCopierVersionConstraint, getPythonVersionConstraint } from "./utils.js";
import { quote } from "shlex";
import upath from "upath";
//#region lib/modules/manager/copier/artifacts.ts
const DEFAULT_COMMAND_OPTIONS = ["--skip-answered", "--defaults"];
function buildCommand(config, packageFileName, newValue) {
	const command = [
		"copier",
		"update",
		...DEFAULT_COMMAND_OPTIONS
	];
	if (GlobalConfig.get("allowScripts") && !config.ignoreScripts) command.push("--trust");
	command.push("--answers-file", quote(upath.basename(packageFileName)), "--vcs-ref", quote(newValue));
	return command.join(" ");
}
function artifactError(packageFileName, message) {
	return [{ artifactError: {
		fileName: packageFileName,
		stderr: message
	} }];
}
async function updateArtifacts({ packageFileName, updatedDeps, config }) {
	if (updatedDeps?.length !== 1) return artifactError(packageFileName, `Unexpected number of dependencies: ${updatedDeps?.length} (should be 1)`);
	const newValue = updatedDeps[0]?.newValue;
	if (!newValue) return artifactError(packageFileName, "Missing copier template version to update to");
	const command = buildCommand(config, packageFileName, newValue);
	const execOptions = {
		cwdFile: packageFileName,
		docker: {},
		extraEnv: getGitEnvironmentVariables(["git-tags"]),
		toolConstraints: [{
			toolName: "python",
			constraint: getPythonVersionConstraint(config)
		}, {
			toolName: "copier",
			constraint: getCopierVersionConstraint(config)
		}]
	};
	try {
		await exec(command, execOptions);
	} catch (err) {
		logger.debug({ err }, `Failed to update copier template: ${err.message}`);
		return artifactError(packageFileName, err.message);
	}
	const status = await getRepoStatus();
	if (!status.modified.includes(packageFileName)) return null;
	if (status.conflicted.length > 0) {
		const msg = `Updating the Copier template yielded ${status.conflicted.length} merge conflicts. Please check the proposed changes carefully! Conflicting files:\n  * ${status.conflicted.join("\n  * ")}`;
		logger.debug({
			packageFileName,
			depName: updatedDeps[0]?.depName
		}, msg);
	}
	const res = [];
	for (const f of [
		...status.modified,
		...status.not_added,
		...status.conflicted
	]) {
		const fileRes = { file: {
			type: "addition",
			path: f,
			contents: await readLocalFile(f)
		} };
		if (status.conflicted.includes(f)) fileRes.notice = {
			file: f,
			message: "This file had merge conflicts. Please check the proposed changes carefully!"
		};
		res.push(fileRes);
	}
	for (const f of status.deleted) res.push({ file: {
		type: "deletion",
		path: f
	} });
	for (const f of status.renamed) {
		res.push({ file: {
			type: "deletion",
			path: f.from
		} });
		res.push({ file: {
			type: "addition",
			path: f.to,
			contents: await readLocalFile(f.to)
		} });
	}
	return res;
}
//#endregion
export { updateArtifacts };

//# sourceMappingURL=artifacts.js.map