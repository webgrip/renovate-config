import "../../../constants/error-messages.js";
import { logger } from "../../../logger/index.js";
import { deleteLocalFile, ensureCacheDir, getSiblingFileName, readLocalFile, writeLocalFile } from "../../../util/fs/index.js";
import { exec } from "../../../util/exec/index.js";
import { getUserPixiConfig } from "./extract.js";
import { isNonEmptyArray } from "@sindresorhus/is";
//#region lib/modules/manager/pixi/artifacts.ts
const commandLock = "pixi lock --no-progress --color=never --quiet";
async function updateArtifacts({ packageFileName, updatedDeps, newPackageFileContent, config }) {
	logger.debug(`pixi.updateArtifacts(${packageFileName})`);
	const { isLockFileMaintenance } = config;
	if (!isNonEmptyArray(updatedDeps) && !isLockFileMaintenance) {
		logger.debug("No updated pixi deps - returning null");
		return null;
	}
	const lockFileName = getSiblingFileName(packageFileName, "pixi.lock");
	const existingLockFileContent = await readLocalFile(lockFileName, "utf8");
	if (!existingLockFileContent) {
		logger.debug(`No lock file found`);
		return null;
	}
	logger.trace(`Updating ${lockFileName}`);
	const cmd = [commandLock];
	const pixiConfig = getUserPixiConfig(newPackageFileContent, packageFileName);
	const constraint = config.constraints?.pixi ?? pixiConfig?.project["requires-pixi"];
	try {
		await writeLocalFile(packageFileName, newPackageFileContent);
		if (isLockFileMaintenance) await deleteLocalFile(lockFileName);
		const PIXI_CACHE_DIR = await ensureCacheDir("pixi");
		await exec(cmd, {
			cwdFile: packageFileName,
			extraEnv: {
				PIXI_CACHE_DIR,
				RATTLER_CACHE_DIR: PIXI_CACHE_DIR
			},
			docker: {},
			toolConstraints: [{
				toolName: "pixi",
				constraint
			}]
		});
		const newPixiLockContent = await readLocalFile(lockFileName, "utf8");
		if (existingLockFileContent === newPixiLockContent) {
			logger.debug(`${lockFileName} is unchanged`);
			return null;
		}
		return [{ file: {
			type: "addition",
			path: lockFileName,
			contents: newPixiLockContent
		} }];
	} catch (err) {
		if (err.message === "temporary-error") throw err;
		logger.debug({ err }, `Failed to update ${lockFileName} file`);
		return [{ artifactError: {
			fileName: lockFileName,
			stderr: `${err}`
		} }];
	}
}
//#endregion
export { updateArtifacts };

//# sourceMappingURL=artifacts.js.map