import "../../../../constants/error-messages.js";
import { logger } from "../../../../logger/index.js";
import { parseUrl } from "../../../../util/url.js";
import { find } from "../../../../util/host-rules.js";
import { findLocalSiblingOrParent, readLocalFile } from "../../../../util/fs/index.js";
import { Result } from "../../../../util/result.js";
import { getGoogleAuthHostRule } from "../../../datasource/util.js";
import { getGitEnvironmentVariables } from "../../../../util/git/auth.js";
import { exec } from "../../../../util/exec/index.js";
import { PypiDatasource } from "../../../datasource/pypi/index.js";
import { applyGitSource } from "../../util.js";
import { BasePyProjectProcessor } from "./abstract.js";
import { depTypes } from "../utils.js";
import { UvLockfile } from "../schema.js";
import { isString } from "@sindresorhus/is";
import { quote } from "shlex";
//#region lib/modules/manager/pep621/processors/uv.ts
const uvUpdateCMD = "uv lock";
var UvProcessor = class extends BasePyProjectProcessor {
	lockfileName = "uv.lock";
	process(project, deps) {
		const uv = project.tool?.uv;
		if (!uv) return deps;
		const hasExplicitDefault = uv.index?.some((index) => index.default && index.explicit);
		const defaultIndex = uv.index?.find((index) => index.default && !index.explicit);
		const implicitIndexUrls = uv.index?.filter((index) => !index.explicit && index.name !== defaultIndex?.name)?.map(({ url }) => url);
		const devDependencies = uv["dev-dependencies"];
		if (devDependencies) deps.push(...devDependencies);
		if (uv.sources || defaultIndex || implicitIndexUrls) for (const dep of deps) {
			/* v8 ignore next 3 -- needs test */
			if (!dep.packageName) continue;
			if (dep.depType === "requires-python") continue;
			const depSource = uv.sources?.[dep.packageName];
			if (depSource) {
				dep.depType = depTypes.uvSources;
				if ("index" in depSource) {
					const index = uv.index?.find(({ name }) => name === depSource.index);
					if (index) dep.registryUrls = [index.url];
				} else if ("git" in depSource) applyGitSource(dep, depSource.git, depSource.rev, depSource.tag, depSource.branch);
				else if ("url" in depSource) dep.skipReason = "unsupported-url";
				else if ("path" in depSource) dep.skipReason = "path-dependency";
				else if ("workspace" in depSource) dep.skipReason = "inherited-dependency";
				else
 /* v8 ignore next -- unreachable through schema */
				dep.skipReason = "unknown-registry";
			} else {
				if (hasExplicitDefault) dep.registryUrls = [];
				else if (defaultIndex) dep.registryUrls = [defaultIndex.url];
				if (implicitIndexUrls?.length) dep.registryUrls = implicitIndexUrls.concat(dep.registryUrls ?? PypiDatasource.defaultURL);
			}
		}
		return deps;
	}
	async extractLockedVersions(project, deps, packageFile) {
		const lockFileName = await findLocalSiblingOrParent(packageFile, this.lockfileName);
		if (lockFileName === null) logger.debug({ packageFile }, `No uv lock file found`);
		else {
			const lockFileContent = await readLocalFile(lockFileName, "utf8");
			if (lockFileContent) {
				const { val: lockFileMapping, err } = Result.parse(lockFileContent, UvLockfile).unwrap();
				if (err) logger.debug({
					packageFile,
					err
				}, `Error parsing uv lock file`);
				else for (const dep of deps) {
					const packageName = dep.packageName;
					if (packageName && packageName in lockFileMapping) dep.lockedVersion = lockFileMapping[packageName];
				}
			}
		}
		return Promise.resolve(deps);
	}
	async updateArtifacts(updateArtifact, project) {
		const { config, updatedDeps, packageFileName } = updateArtifact;
		const { isLockFileMaintenance } = config;
		const lockFileName = await findLocalSiblingOrParent(packageFileName, "uv.lock");
		if (lockFileName === null) {
			logger.debug({ packageFileName }, `No uv lock file found`);
			return null;
		}
		try {
			const existingLockFileContent = await readLocalFile(lockFileName, "utf8");
			if (!existingLockFileContent) {
				logger.debug("No uv.lock found");
				return null;
			}
			const pythonConstraint = {
				toolName: "python",
				constraint: config.constraints?.python ?? project.project?.["requires-python"]
			};
			const uvConstraint = {
				toolName: "uv",
				constraint: config.constraints?.uv ?? project.tool?.uv?.["required-version"]
			};
			const execOptions = {
				cwdFile: packageFileName,
				extraEnv: {
					...getGitEnvironmentVariables(["pep621"]),
					...await getUvExtraIndexUrl(project, updateArtifact.updatedDeps),
					...await getUvIndexCredentials(project)
				},
				docker: {},
				toolConstraints: [pythonConstraint, uvConstraint]
			};
			let cmd;
			if (isLockFileMaintenance) cmd = `${uvUpdateCMD} --upgrade`;
			else cmd = generateCMD(updatedDeps);
			await exec(cmd, execOptions);
			const fileChanges = [];
			const newLockContent = await readLocalFile(lockFileName, "utf8");
			if (existingLockFileContent !== newLockContent) fileChanges.push({ file: {
				type: "addition",
				path: lockFileName,
				contents: newLockContent
			} });
			else logger.debug("uv.lock is unchanged");
			return fileChanges.length ? fileChanges : null;
		} catch (err) {
			if (err.message === "temporary-error") throw err;
			logger.debug({ err }, "Failed to update uv lock file");
			return [{ artifactError: {
				fileName: lockFileName,
				stderr: err.message
			} }];
		}
	}
};
function generateCMD(updatedDeps) {
	const deps = [];
	for (const dep of updatedDeps) switch (dep.depType) {
		case depTypes.optionalDependencies:
			deps.push(dep.depName);
			break;
		case depTypes.uvDevDependencies:
		case depTypes.uvSources:
			deps.push(dep.depName);
			break;
		case depTypes.buildSystemRequires: break;
		default: deps.push(dep.packageName);
	}
	return `${uvUpdateCMD} ${deps.map((dep) => `--upgrade-package ${quote(dep)}`).join(" ")}`;
}
function getMatchingHostRule(url) {
	return find({
		hostType: PypiDatasource.id,
		url
	});
}
async function getUsernamePassword(url) {
	const rule = getMatchingHostRule(url.toString());
	if (rule.username || rule.password) return rule;
	if (url.hostname.endsWith(".pkg.dev")) {
		const hostRule = await getGoogleAuthHostRule();
		if (hostRule) return hostRule;
		else logger.once.debug({ url }, "Could not get Google access token");
	}
	return {};
}
async function getUvExtraIndexUrl(project, deps) {
	const pyPiRegistryUrls = deps.filter((dep) => dep.datasource === PypiDatasource.id).filter((dep) => {
		const sources = project.tool?.uv?.sources;
		const packageName = dep.packageName;
		return !sources || !(packageName in sources);
	}).flatMap((dep) => dep.registryUrls).filter(isString).filter((registryUrl) => {
		const configuredIndexUrls = project.tool?.uv?.index?.map(({ url }) => url) ?? [];
		return registryUrl !== PypiDatasource.defaultURL && !configuredIndexUrls.includes(registryUrl);
	});
	const registryUrls = new Set(pyPiRegistryUrls);
	const extraIndexUrls = [];
	for (const registryUrl of registryUrls) {
		const parsedUrl = parseUrl(registryUrl);
		if (!parsedUrl) continue;
		const { username, password } = await getUsernamePassword(parsedUrl);
		if (username || password) {
			if (username) parsedUrl.username = username;
			if (password) parsedUrl.password = password;
		}
		extraIndexUrls.push(parsedUrl.toString());
	}
	return { UV_EXTRA_INDEX_URL: extraIndexUrls.join(" ") };
}
async function getUvIndexCredentials(project) {
	const uv_indexes = project.tool?.uv?.index;
	if (!uv_indexes) return {};
	const entries = [];
	for (const { name, url } of uv_indexes) {
		const parsedUrl = parseUrl(url);
		/* v8 ignore next 3 -- needs test */
		if (!parsedUrl) continue;
		if (!name) continue;
		const { username, password } = await getUsernamePassword(parsedUrl);
		const NAME = name.toUpperCase().replace(/[^A-Z0-9]/g, "_");
		if (username) entries.push([`UV_INDEX_${NAME}_USERNAME`, username]);
		if (password) entries.push([`UV_INDEX_${NAME}_PASSWORD`, password]);
	}
	return Object.fromEntries(entries);
}
//#endregion
export { UvProcessor };

//# sourceMappingURL=uv.js.map