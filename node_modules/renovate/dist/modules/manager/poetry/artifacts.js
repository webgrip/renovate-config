import "../../../constants/error-messages.js";
import { regEx } from "../../../util/regex.js";
import { logger } from "../../../logger/index.js";
import { parseUrl } from "../../../util/url.js";
import { find } from "../../../util/host-rules.js";
import { massage, parse } from "../../../util/toml.js";
import { deleteLocalFile, ensureCacheDir, getSiblingFileName, readLocalFile, writeLocalFile } from "../../../util/fs/index.js";
import { Result } from "../../../util/result.js";
import { getGoogleAuthHostRule } from "../../datasource/util.js";
import { getGitEnvironmentVariables } from "../../../util/git/auth.js";
import { exec } from "../../../util/exec/index.js";
import { PypiDatasource } from "../../datasource/pypi/index.js";
import { Lockfile, PoetryPyProject } from "./schema.js";
import { isNonEmptyArray, isNonEmptyObject, isString } from "@sindresorhus/is";
import { quote } from "shlex";
//#region lib/modules/manager/poetry/artifacts.ts
function getPythonConstraint(pyProjectContent, existingLockFileContent) {
	const pyprojectPythonConstraint = Result.parse(massage(pyProjectContent), PoetryPyProject.transform(({ packageFileContent }) => packageFileContent.deps.find((dep) => dep.depName === "python")?.currentValue)).unwrapOrNull();
	if (pyprojectPythonConstraint) {
		logger.debug("Using python version from pyproject.toml");
		return pyprojectPythonConstraint;
	}
	const lockfilePythonConstraint = Result.parse(existingLockFileContent, Lockfile.transform(({ pythonVersions }) => pythonVersions)).unwrapOrNull();
	if (lockfilePythonConstraint) {
		logger.debug("Using python version from poetry.lock");
		return lockfilePythonConstraint;
	}
	return null;
}
function getPoetryRequirement(pyProjectContent, existingLockFileContent) {
	const firstLine = existingLockFileContent.split("\n")[0];
	const poetryVersionMatch = regEx(/by Poetry ([\d\\.]+)/).exec(firstLine);
	if (poetryVersionMatch?.[1]) {
		const poetryVersion = poetryVersionMatch[1];
		logger.debug(`Using poetry version ${poetryVersion} from poetry.lock header`);
		return poetryVersion;
	}
	const { val: lockfilePoetryConstraint } = Result.parse(existingLockFileContent, Lockfile.transform(({ poetryConstraint }) => poetryConstraint)).unwrap();
	if (lockfilePoetryConstraint) {
		logger.debug(`Using poetry version ${lockfilePoetryConstraint} from poetry.lock metadata`);
		return lockfilePoetryConstraint;
	}
	const { val: pyprojectPoetryConstraint } = Result.parse(massage(pyProjectContent), PoetryPyProject.transform(({ poetryRequirement }) => poetryRequirement)).unwrap();
	if (pyprojectPoetryConstraint) {
		logger.debug(`Using poetry version ${pyprojectPoetryConstraint} from pyproject.toml`);
		return pyprojectPoetryConstraint;
	}
	return null;
}
function getPoetrySources(content, fileName) {
	let pyprojectFile;
	try {
		pyprojectFile = parse(massage(content));
	} catch (err) {
		logger.debug({ err }, "Error parsing pyproject.toml file");
		return [];
	}
	if (!pyprojectFile.tool?.poetry) {
		logger.debug(`${fileName} contains no poetry section`);
		return [];
	}
	const sources = pyprojectFile.tool?.poetry?.source ?? [];
	const sourceArray = [];
	for (const source of sources) if (source.name && source.url) sourceArray.push({
		name: source.name,
		url: source.url
	});
	return sourceArray;
}
async function getMatchingHostRule(url) {
	const scopedMatch = find({
		hostType: PypiDatasource.id,
		url
	});
	const hostRule = isNonEmptyObject(scopedMatch) ? scopedMatch : find({ url });
	if (hostRule && Object.keys(hostRule).length !== 0) return hostRule;
	const parsedUrl = parseUrl(url);
	if (!parsedUrl) {
		logger.once.debug(`Failed to parse URL ${url}`);
		return {};
	}
	if (parsedUrl.hostname.endsWith(".pkg.dev")) {
		const hostRule = await getGoogleAuthHostRule();
		if (hostRule && Object.keys(hostRule).length !== 0) return hostRule;
		logger.once.debug(`Could not get Google access token (url=${url})`);
	}
	return {};
}
async function getSourceCredentialVars(pyprojectContent, packageFileName) {
	const poetrySources = getPoetrySources(pyprojectContent, packageFileName);
	const envVars = {};
	for (const source of poetrySources) {
		const matchingHostRule = await getMatchingHostRule(source.url);
		const formattedSourceName = source.name.replace(regEx(/(\.|-)+/g), "_").toUpperCase();
		if (matchingHostRule.username) envVars[`POETRY_HTTP_BASIC_${formattedSourceName}_USERNAME`] = matchingHostRule.username;
		if (matchingHostRule.password) envVars[`POETRY_HTTP_BASIC_${formattedSourceName}_PASSWORD`] = matchingHostRule.password;
	}
	return envVars;
}
async function updateArtifacts({ packageFileName, updatedDeps, newPackageFileContent, config }) {
	logger.debug(`poetry.updateArtifacts(${packageFileName})`);
	const { isLockFileMaintenance } = config;
	if (!isNonEmptyArray(updatedDeps) && !isLockFileMaintenance) {
		logger.debug("No updated poetry deps - returning null");
		return null;
	}
	let lockFileName = getSiblingFileName(packageFileName, "poetry.lock");
	let existingLockFileContent = await readLocalFile(lockFileName, "utf8");
	if (!existingLockFileContent) {
		lockFileName = getSiblingFileName(packageFileName, "pyproject.lock");
		existingLockFileContent = await readLocalFile(lockFileName, "utf8");
		if (!existingLockFileContent) {
			logger.debug(`No lock file found`);
			return null;
		}
	}
	logger.debug(`Updating ${lockFileName}`);
	try {
		await writeLocalFile(packageFileName, newPackageFileContent);
		const cmd = [];
		if (isLockFileMaintenance) {
			await deleteLocalFile(lockFileName);
			cmd.push("poetry update --lock --no-interaction");
		} else cmd.push(`poetry update --lock --no-interaction ${updatedDeps.map((dep) => dep.depName).filter(isString).map((dep) => quote(dep)).join(" ")}`);
		const pythonConstraint = config?.constraints?.python ?? getPythonConstraint(newPackageFileContent, existingLockFileContent);
		const poetryConstraint = config.constraints?.poetry ?? getPoetryRequirement(newPackageFileContent, existingLockFileContent);
		await exec(cmd, {
			cwdFile: packageFileName,
			extraEnv: {
				...await getSourceCredentialVars(newPackageFileContent, packageFileName),
				...getGitEnvironmentVariables(["poetry"]),
				PIP_CACHE_DIR: await ensureCacheDir("pip")
			},
			docker: {},
			toolConstraints: [{
				toolName: "python",
				constraint: pythonConstraint
			}, {
				toolName: "poetry",
				constraint: poetryConstraint
			}]
		});
		const newPoetryLockContent = await readLocalFile(lockFileName, "utf8");
		if (existingLockFileContent === newPoetryLockContent) {
			logger.debug(`${lockFileName} is unchanged`);
			return null;
		}
		logger.debug(`Returning updated ${lockFileName}`);
		return [{ file: {
			type: "addition",
			path: lockFileName,
			contents: newPoetryLockContent
		} }];
	} catch (err) {
		// istanbul ignore if
		if (err.message === "temporary-error") throw err;
		logger.debug({ err }, `Failed to update ${lockFileName} file`);
		return [{ artifactError: {
			fileName: lockFileName,
			stderr: `${String(err.stdout)}\n${String(err.stderr)}`
		} }];
	}
}
//#endregion
export { updateArtifacts };

//# sourceMappingURL=artifacts.js.map