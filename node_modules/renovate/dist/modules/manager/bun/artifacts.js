import "../../../constants/error-messages.js";
import { GlobalConfig } from "../../../config/global.js";
import { logger } from "../../../logger/index.js";
import { deleteLocalFile, readLocalFile, writeLocalFile } from "../../../util/fs/index.js";
import { exec } from "../../../util/exec/index.js";
import { processHostRules } from "../npm/post-update/rules.js";
import { getNpmrcContent, resetNpmrcContent, updateNpmrcContent } from "../npm/utils.js";
import { isEmptyArray } from "@sindresorhus/is";
import upath from "upath";
//#region lib/modules/manager/bun/artifacts.ts
async function updateArtifacts(updateArtifact) {
	const { packageFileName, updatedDeps, newPackageFileContent, config } = updateArtifact;
	logger.debug(`bun.updateArtifacts(${packageFileName})`);
	const { isLockFileMaintenance } = config;
	if (isEmptyArray(updatedDeps) && !isLockFileMaintenance) {
		logger.debug("No updated bun deps - returning null");
		return null;
	}
	const lockFileName = updatedDeps.find((dep) => dep.manager === "bun")?.lockFiles?.[0] ?? config.lockFiles?.[0];
	if (!lockFileName) {
		logger.debug(`bun: No lock file found`);
		return null;
	}
	const oldLockFileContent = await readLocalFile(lockFileName);
	if (!oldLockFileContent) {
		logger.debug(`No ${lockFileName} found`);
		return null;
	}
	const pkgFileDir = upath.dirname(packageFileName);
	const npmrcContent = await getNpmrcContent(pkgFileDir);
	const { additionalNpmrcContent } = processHostRules();
	await updateNpmrcContent(pkgFileDir, npmrcContent, additionalNpmrcContent);
	try {
		await writeLocalFile(packageFileName, newPackageFileContent);
		if (isLockFileMaintenance) await deleteLocalFile(lockFileName);
		let cmd = "bun install";
		if (!GlobalConfig.get("allowScripts") || config.ignoreScripts) cmd += " --ignore-scripts";
		const execOptions = {
			cwdFile: lockFileName,
			docker: {},
			toolConstraints: [{
				toolName: "bun",
				constraint: updateArtifact?.config?.constraints?.bun
			}]
		};
		await exec(cmd, execOptions);
		await resetNpmrcContent(pkgFileDir, npmrcContent);
		const newLockFileContent = await readLocalFile(lockFileName);
		if (!newLockFileContent || Buffer.compare(oldLockFileContent, newLockFileContent) === 0) return null;
		return [{ file: {
			type: "addition",
			path: lockFileName,
			contents: newLockFileContent
		} }];
	} catch (err) {
		if (err.message === "temporary-error") throw err;
		logger.warn({
			lockfile: lockFileName,
			err
		}, `Failed to update lock file`);
		return [{ artifactError: {
			fileName: lockFileName,
			stderr: err.message
		} }];
	}
}
//#endregion
export { updateArtifacts };

//# sourceMappingURL=artifacts.js.map