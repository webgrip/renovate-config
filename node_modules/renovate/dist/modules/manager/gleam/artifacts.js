import "../../../constants/error-messages.js";
import { logger } from "../../../logger/index.js";
import { deleteLocalFile, getSiblingFileName, readLocalFile, writeLocalFile } from "../../../util/fs/index.js";
import { exec } from "../../../util/exec/index.js";
import { isEmptyArray, isString } from "@sindresorhus/is";
import { quote } from "shlex";
//#region lib/modules/manager/gleam/artifacts.ts
async function updateArtifacts(updateArtifact) {
	const { packageFileName, updatedDeps, newPackageFileContent, config } = updateArtifact;
	logger.debug(`gleam.updateArtifacts(${packageFileName})`);
	const { isLockFileMaintenance } = config;
	if (isEmptyArray(updatedDeps) && !isLockFileMaintenance) {
		logger.debug("No updated gleam deps - returning null");
		return null;
	}
	const lockFileName = getSiblingFileName(packageFileName, "manifest.toml");
	const oldLockFileContent = await readLocalFile(lockFileName, "utf8");
	if (!oldLockFileContent) {
		logger.debug(`No ${lockFileName} found`);
		return null;
	}
	try {
		await writeLocalFile(packageFileName, newPackageFileContent);
		if (isLockFileMaintenance) await deleteLocalFile(lockFileName);
		const execOptions = {
			cwdFile: packageFileName,
			docker: {},
			toolConstraints: [{
				toolName: "gleam",
				constraint: config.constraints?.gleam
			}]
		};
		await exec(["gleam deps update", ...(isLockFileMaintenance ? [] : updatedDeps.map((dep) => dep.depName).filter(isString)).map(quote)].join(" "), execOptions);
		const newLockFileContent = await readLocalFile(lockFileName, "utf8");
		if (!newLockFileContent) {
			logger.debug(`No ${lockFileName} found`);
			return null;
		}
		if (oldLockFileContent === newLockFileContent) {
			logger.debug(`No changes in ${lockFileName} content`);
			return null;
		}
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