import "../../../constants/error-messages.js";
import { regEx } from "../../../util/regex.js";
import { logger } from "../../../logger/index.js";
import { parseUrl } from "../../../util/url.js";
import { find } from "../../../util/host-rules.js";
import { ensureLocalPath } from "../../../util/fs/util.js";
import { deleteLocalFile, ensureCacheDir, getParentDir, localPathExists, readLocalFile, writeLocalFile } from "../../../util/fs/index.js";
import { exec } from "../../../util/exec/index.js";
import { getRepoStatus } from "../../../util/git/index.js";
import { PypiDatasource } from "../../datasource/pypi/index.js";
import { extractPackageFile } from "./extract.js";
import { isNonEmptyStringAndNotWhitespace, isUrlInstance } from "@sindresorhus/is";
import { pipenv } from "@renovatebot/detect-tools";
//#region lib/modules/manager/pipenv/artifacts.ts
function getMatchingHostRule(url) {
	const parsedUrl = parseUrl(url);
	if (parsedUrl) {
		parsedUrl.username = "";
		parsedUrl.password = "";
		const urlWithoutCredentials = parsedUrl.toString();
		return find({
			hostType: PypiDatasource.id,
			url: urlWithoutCredentials
		});
	}
	return null;
}
async function findPipfileSourceUrlsWithCredentials(pipfileContent, pipfileName) {
	return (await extractPackageFile(pipfileContent, pipfileName))?.registryUrls?.map(parseUrl).filter(isUrlInstance).filter((url) => isNonEmptyStringAndNotWhitespace(url.username)) ?? [];
}
/**
* This will extract the actual variable name from an environment-placeholder:
* ${USERNAME:-defaultvalue} will yield 'USERNAME'
*/
function extractEnvironmentVariableName(credential) {
	const match = regEx("([a-z0-9_]+)", "i").exec(decodeURI(credential));
	return match?.length ? match[0] : null;
}
function addExtraEnvVariable(extraEnv, environmentVariableName, environmentValue) {
	logger.trace(`Adding ${environmentVariableName} environment variable for pipenv`);
	if (extraEnv[environmentVariableName] && extraEnv[environmentVariableName] !== environmentValue) logger.warn({ envVar: environmentVariableName }, "Possible misconfiguration, environment variable already set to a different value");
	extraEnv[environmentVariableName] = environmentValue;
}
/**
* Pipenv allows configuring source-urls for remote repositories with placeholders for credentials, i.e. http://$USER:$PASS@myprivate.repo
* if a matching host rule exists for that repository, we need to set the corresponding variables.
* Simply substituting them in the URL is not an option as it would impact the hash for the resulting Pipfile.lock
*
*/
async function addCredentialsForSourceUrls(newPipfileContent, pipfileName, extraEnv) {
	const sourceUrls = await findPipfileSourceUrlsWithCredentials(newPipfileContent, pipfileName);
	for (const parsedSourceUrl of sourceUrls) {
		logger.trace(`Trying to add credentials for ${parsedSourceUrl.toString()}`);
		const matchingHostRule = getMatchingHostRule(parsedSourceUrl.toString());
		if (matchingHostRule) {
			const usernameVariableName = extractEnvironmentVariableName(parsedSourceUrl.username);
			if (matchingHostRule.username && usernameVariableName) addExtraEnvVariable(extraEnv, usernameVariableName, matchingHostRule.username);
			const passwordVariableName = extractEnvironmentVariableName(parsedSourceUrl.password);
			if (matchingHostRule.password && passwordVariableName) addExtraEnvVariable(extraEnv, passwordVariableName, matchingHostRule.password);
		}
	}
}
async function updateArtifacts({ packageFileName: pipfileName, newPackageFileContent: newPipfileContent, config }) {
	logger.debug(`pipenv.updateArtifacts(${pipfileName})`);
	const lockFileName = `${pipfileName}.lock`;
	if (!await localPathExists(lockFileName)) {
		logger.debug("No Pipfile.lock found");
		return null;
	}
	try {
		await writeLocalFile(pipfileName, newPipfileContent);
		if (config.isLockFileMaintenance) await deleteLocalFile(lockFileName);
		const cmd = "pipenv lock";
		const pipfileDir = getParentDir(ensureLocalPath(pipfileName));
		const tagConstraint = config.constraints?.python ?? await pipenv.getPythonConstraint(pipfileDir);
		const pipenvConstraint = config.constraints?.pipenv ?? await pipenv.getPipenvConstraint(pipfileDir);
		const extraEnv = {
			PIPENV_CACHE_DIR: await ensureCacheDir("pipenv"),
			PIP_CACHE_DIR: await ensureCacheDir("pip"),
			WORKON_HOME: await ensureCacheDir("virtualenvs")
		};
		const execOptions = {
			cwdFile: pipfileName,
			docker: {},
			toolConstraints: [{
				toolName: "python",
				constraint: tagConstraint
			}, {
				toolName: "pipenv",
				constraint: pipenvConstraint
			}]
		};
		await addCredentialsForSourceUrls(newPipfileContent, pipfileName, extraEnv);
		execOptions.extraEnv = extraEnv;
		logger.trace({ cmd }, "pipenv lock command");
		await exec(cmd, execOptions);
		if (!(await getRepoStatus())?.modified.includes(lockFileName)) return null;
		logger.debug("Returning updated Pipfile.lock");
		return [{ file: {
			type: "addition",
			path: lockFileName,
			contents: await readLocalFile(lockFileName, "utf8")
		} }];
	} catch (err) {
		// istanbul ignore if
		if (err.message === "temporary-error") throw err;
		logger.debug({ err }, "Failed to update Pipfile.lock");
		return [{ artifactError: {
			fileName: lockFileName,
			stderr: err.message
		} }];
	}
}
//#endregion
export { updateArtifacts };

//# sourceMappingURL=artifacts.js.map