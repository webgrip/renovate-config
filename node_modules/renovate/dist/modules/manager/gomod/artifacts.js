import "../../../constants/error-messages.js";
import { getEnv } from "../../../util/env.js";
import { regEx } from "../../../util/regex.js";
import { GlobalConfig } from "../../../config/global.js";
import { logger } from "../../../logger/index.js";
import { coerceArray } from "../../../util/array.js";
import { ensureCacheDir, findLocalSiblingOrParent, isValidLocalPath, readLocalFile, writeLocalFile } from "../../../util/fs/index.js";
import { filterMap } from "../../../util/filter-map.js";
import { isVersion } from "../../versioning/semver/index.js";
import { getGitEnvironmentVariables } from "../../../util/git/auth.js";
import { exec } from "../../../util/exec/index.js";
import { getRepoStatus } from "../../../util/git/index.js";
import { getExtraDepsNotice } from "./artifacts-extra.js";
import { isString } from "@sindresorhus/is";
import { quote } from "shlex";
import upath from "upath";
import semver from "semver";
//#region lib/modules/manager/gomod/artifacts.ts
const { major: major$1, valid: valid$1 } = semver;
function getUpdateImportPathCmds(updatedDeps, { constraints }) {
	const invalidMajorDeps = updatedDeps.filter(({ newVersion }) => !valid$1(newVersion));
	if (invalidMajorDeps.length > 0) invalidMajorDeps.forEach(({ depName }) => logger.warn({ depName }, "Ignoring dependency: Could not get major version"));
	const updateImportCommands = updatedDeps.filter(({ newVersion }) => valid$1(newVersion) && !newVersion.endsWith("+incompatible")).map(({ depName, newVersion }) => ({
		depName,
		newMajor: major$1(newVersion)
	})).filter(({ depName, newMajor }) => depName.startsWith("gopkg.in/") || newMajor > 1).map(({ depName, newMajor }) => `mod upgrade --mod-name=${depName} -t=${newMajor}`);
	if (updateImportCommands.length > 0) {
		let installMarwanModArgs = "install github.com/marwan-at-work/mod/cmd/mod@latest";
		const gomodModCompatibility = constraints?.gomodMod;
		if (gomodModCompatibility) if (gomodModCompatibility.startsWith("v") && isVersion(gomodModCompatibility.replace(regEx(/^v/), ""))) installMarwanModArgs = installMarwanModArgs.replace(regEx(/@latest$/), `@${gomodModCompatibility}`);
		else logger.debug({ gomodModCompatibility }, "marwan-at-work/mod compatibility range is not valid - skipping");
		else logger.debug("No marwan-at-work/mod compatibility range found - installing marwan-at-work/mod latest");
		updateImportCommands.unshift(`go ${installMarwanModArgs}`);
	}
	return updateImportCommands;
}
function useModcacherw(goVersion) {
	if (!isString(goVersion)) return true;
	return semver.intersects(goVersion, `>=1.14`);
}
async function updateArtifacts({ packageFileName: goModFileName, updatedDeps, newPackageFileContent: newGoModContent, config }) {
	logger.debug(`gomod.updateArtifacts(${goModFileName})`);
	const sumFileName = goModFileName.replace(regEx(/\.mod$/), ".sum");
	if (!await readLocalFile(sumFileName)) {
		logger.debug("No go.sum found");
		return null;
	}
	const goModDir = upath.dirname(goModFileName);
	const goModFileBaseName = upath.basename(goModFileName);
	const modFileFlag = goModFileBaseName === "go.mod" ? "" : ` -modfile=${quote(goModFileBaseName)}`;
	const vendorDir = await findLocalSiblingOrParent(goModFileName, "vendor");
	const vendorModulesFileName = upath.join(vendorDir ?? "", "modules.txt");
	const useVendor = !!config.postUpdateOptions?.includes("gomodVendor") || !config.postUpdateOptions?.includes("gomodSkipVendor") && vendorDir && await readLocalFile(vendorModulesFileName) !== null;
	let massagedGoMod = newGoModContent;
	const useGoGenerate = !!config.postUpdateOptions?.includes("goGenerate");
	const goGenerateAllowed = GlobalConfig.get("allowedUnsafeExecutions")?.includes("goGenerate");
	if (config.postUpdateOptions?.includes("gomodMassage")) {
		massagedGoMod = massagedGoMod.split("\n").map((line) => {
			if (line.trim().startsWith("//")) return line.replace(")", "renovate-replace-bracket");
			return line;
		}).join("\n");
		const inlineReplaceRegEx = regEx(/(\r?\n)(replace\s+[^\s]+\s+=>\s+\.\.\/.*)/g);
		const inlineCommentOut = "$1// renovate-replace $2";
		const blockReplaceRegEx = regEx(/(\r?\n)replace\s*\([^)]+\s*\)/g);
		/**
		* replacerFunction for commenting out replace blocks
		* @param match A string representing a golang replace directive block
		* @returns A commented out block with // renovate-replace
		*/
		const blockCommentOut = (match) => match.replace(/(\r?\n)/g, "$1// renovate-replace ");
		massagedGoMod = massagedGoMod.replace(inlineReplaceRegEx, inlineCommentOut).replace(blockReplaceRegEx, blockCommentOut);
		if (massagedGoMod !== newGoModContent) logger.debug("Removed some relative replace statements and comments from go.mod");
	}
	const goConstraints = deriveGoToolchainConstraints(config, newGoModContent);
	try {
		await writeLocalFile(goModFileName, massagedGoMod);
		const cmd = "go";
		const env = getEnv();
		const execOptions = {
			cwdFile: goModFileName,
			extraEnv: {
				GOPATH: await ensureCacheDir("go"),
				GOPROXY: env.GOPROXY,
				GOPRIVATE: env.GOPRIVATE,
				GONOPROXY: env.GONOPROXY,
				GONOSUMDB: env.GONOSUMDB,
				GOSUMDB: env.GOSUMDB,
				GOINSECURE: env.GOINSECURE,
				/* v8 ignore next -- TODO: add test */
				GOFLAGS: useModcacherw(goConstraints) ? "-modcacherw" : null,
				CGO_ENABLED: GlobalConfig.get("binarySource") === "docker" ? "0" : null,
				...getGitEnvironmentVariables(["go"])
			},
			docker: {},
			toolConstraints: [{
				toolName: "golang",
				constraint: goConstraints
			}]
		};
		const execCommands = [];
		let goGetDirs;
		if (config.goGetDirs) {
			goGetDirs = config.goGetDirs.filter((dir) => {
				const isValid = isValidLocalPath(dir);
				if (!isValid) logger.warn({ dir }, "Invalid path in goGetDirs");
				return isValid;
			}).map(quote).join(" ");
			if (goGetDirs === "") throw new Error("Invalid goGetDirs");
		}
		let args = `get${modFileFlag} `;
		if (goConstraints && !semver.intersects(goConstraints, `>=1.18`)) args += `-d `;
		args += `-t ${goGetDirs ?? "./..."}`;
		logger.trace({
			cmd,
			args
		}, "go get command included");
		execCommands.push(`${cmd} ${args}`);
		const isImportPathUpdateRequired = config.postUpdateOptions?.includes("gomodUpdateImportPaths") && config.updateType === "major";
		if (isImportPathUpdateRequired) {
			const updateImportCmds = getUpdateImportPathCmds(updatedDeps, config);
			if (updateImportCmds.length > 0) {
				logger.debug(updateImportCmds, "update import path commands included");
				execCommands.push(...updateImportCmds);
			}
		}
		const mustSkipGoModTidy = !config.postUpdateOptions?.includes("gomodUpdateImportPaths") && config.updateType === "major";
		if (mustSkipGoModTidy) logger.debug("go mod tidy command skipped");
		let tidyOpts = "";
		if (config.postUpdateOptions?.includes("gomodTidy1.17")) tidyOpts += " -compat=1.17";
		if (config.postUpdateOptions?.includes("gomodTidyE")) tidyOpts += " -e";
		const isGoModTidyRequired = !mustSkipGoModTidy && (config.postUpdateOptions?.includes("gomodTidy") === true || config.postUpdateOptions?.includes("gomodTidy1.17") === true || config.postUpdateOptions?.includes("gomodTidyE") === true || config.updateType === "major" && isImportPathUpdateRequired);
		if (isGoModTidyRequired) {
			args = `mod tidy${modFileFlag}${tidyOpts}`;
			logger.debug("go mod tidy command included");
			execCommands.push(`${cmd} ${args}`);
		}
		let goWorkSumFileName = upath.join(goModDir, "go.work.sum");
		if (useVendor) {
			const goWorkFile = await findLocalSiblingOrParent(goModFileName, "go.work");
			if (goWorkFile) {
				goWorkSumFileName = upath.join(upath.dirname(goWorkFile), "go.work.sum");
				args = "work vendor";
				logger.debug("using go work vendor");
				execCommands.push(`${cmd} ${args}`);
				args = "work sync";
				logger.debug("using go work sync");
				execCommands.push(`${cmd} ${args}`);
			} else {
				args = `mod vendor${modFileFlag}`;
				logger.debug("using go mod vendor");
				execCommands.push(`${cmd} ${args}`);
			}
			if (isGoModTidyRequired) {
				args = `mod tidy${modFileFlag}${tidyOpts}`;
				logger.debug("go mod tidy command included");
				execCommands.push(`${cmd} ${args}`);
			}
		}
		if (isGoModTidyRequired) {
			args = `mod tidy${modFileFlag}${tidyOpts}`;
			logger.debug("go mod tidy command included");
			execCommands.push(`${cmd} ${args}`);
		}
		if (useGoGenerate) if (goGenerateAllowed) {
			logger.debug("go generate command included");
			execCommands.push(`${cmd} generate ./...`);
		} else logger.once.warn(`go generate command requested as a post update action, but goGenerate is not permitted in the allowedUnsafeExecutions`);
		await exec(execCommands, execOptions);
		const status = await getRepoStatus();
		if (!status.modified.includes(sumFileName) && !status.modified.includes(goModFileName) && !status.modified.includes(goWorkSumFileName)) return null;
		const res = [];
		if (status.modified.includes(sumFileName)) {
			logger.debug("Returning updated go.sum");
			res.push({ file: {
				type: "addition",
				path: sumFileName,
				contents: await readLocalFile(sumFileName)
			} });
		}
		if (status.modified.includes(goWorkSumFileName)) {
			logger.debug("Returning updated go.work.sum");
			res.push({ file: {
				type: "addition",
				path: goWorkSumFileName,
				contents: await readLocalFile(goWorkSumFileName)
			} });
		}
		if (isImportPathUpdateRequired) {
			logger.debug("Returning updated go source files for import path changes");
			for (const f of status.modified) if (f.endsWith(".go")) res.push({ file: {
				type: "addition",
				path: f,
				contents: await readLocalFile(f)
			} });
		}
		const alreadyAdded = /* @__PURE__ */ new Set();
		const alreadyDeleted = /* @__PURE__ */ new Set();
		if (useVendor) {
			for (const f of status.modified.concat(status.not_added)) if (vendorDir && f.startsWith(vendorDir)) {
				alreadyAdded.add(f);
				res.push({ file: {
					type: "addition",
					path: f,
					contents: await readLocalFile(f)
				} });
			}
			for (const f of coerceArray(status.deleted)) if (vendorDir && f.startsWith(vendorDir)) {
				alreadyDeleted.add(f);
				res.push({ file: {
					type: "deletion",
					path: f
				} });
			}
		}
		const finalGoModContent = (await readLocalFile(goModFileName, "utf8")).replace(regEx(/\/\/ renovate-replace /g), "").replace(regEx(/renovate-replace-bracket/g), ")");
		if (finalGoModContent !== newGoModContent) {
			const artifactResult = { file: {
				type: "addition",
				path: goModFileName,
				contents: finalGoModContent
			} };
			const extraDepsNotice = getExtraDepsNotice(newGoModContent, finalGoModContent, filterMap(updatedDeps, (dep) => dep?.depName));
			if (extraDepsNotice) artifactResult.notice = {
				file: goModFileName,
				message: extraDepsNotice
			};
			logger.debug("Found updated go.mod after go.sum update");
			res.push(artifactResult);
			alreadyAdded.add(goModFileName);
		}
		if (useGoGenerate && goGenerateAllowed) {
			logger.debug("Updating all modified files since generated files were added");
			for (const f of status.modified.concat(status.created)) if (!alreadyAdded.has(f)) res.push({ file: {
				type: "addition",
				path: f,
				contents: await readLocalFile(f)
			} });
			for (const f of coerceArray(status.deleted)) if (!alreadyDeleted.has(f)) res.push({ file: {
				type: "deletion",
				path: f
			} });
		}
		return res;
	} catch (err) {
		if (err.message === "temporary-error") throw err;
		logger.debug({ err }, "Failed to update go.sum");
		return [{ artifactError: {
			fileName: sumFileName,
			stderr: err.message
		} }];
	}
}
function getGoConstraints(content) {
	const toolchainVer = regEx(/^toolchain\s*go(?<gover>\d+\.\d+\.\d+)$/m).exec(content)?.groups?.gover;
	if (toolchainVer) {
		logger.debug(`Using go version ${toolchainVer} found in toolchain directive`);
		return toolchainVer;
	}
	const goFullVersion = regEx(/^go\s*(?<gover>\d+\.\d+\.\d+)$/m).exec(content)?.groups?.gover;
	if (goFullVersion) return goFullVersion;
	const match = regEx(/^go\s*(?<gover>\d+\.\d+)$/m).exec(content);
	if (!match?.groups?.gover) return;
	return `^${match.groups.gover}`;
}
/**
* Derive the version of the Go toolchain needed to run this project.
*
* This matches with the `golang` Containerbase tool.
*
* In precedence order:
*
* 1. config: \`constraints.go\`
* 1. \`go.mod\`: \`toolchain\` directive
* 1. \`go.mod\`: \`go\` directive
*
* NOTE that the \`constraints.golang\` is not used (TODO #42601)
*/
function deriveGoToolchainConstraints(config, newGoModContent) {
	return config.constraints?.go ?? getGoConstraints(newGoModContent);
}
//#endregion
export { updateArtifacts };

//# sourceMappingURL=artifacts.js.map