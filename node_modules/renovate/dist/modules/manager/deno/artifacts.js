import "../../../constants/error-messages.js";
import { logger } from "../../../logger/index.js";
import { deleteLocalFile, readLocalFile, writeLocalFile } from "../../../util/fs/index.js";
import { exec } from "../../../util/exec/index.js";
import { isEmptyArray } from "@sindresorhus/is";
//#region lib/modules/manager/deno/artifacts.ts
async function updateArtifacts(updateArtifact) {
	const { packageFileName, updatedDeps, newPackageFileContent, config } = updateArtifact;
	logger.debug(`deno.updateArtifacts(${packageFileName})`);
	const isLockFileMaintenance = config.updateType === "lockFileMaintenance";
	if (isEmptyArray(updatedDeps) && !isLockFileMaintenance) {
		logger.debug("No updated deno deps - returning null");
		return null;
	}
	const lockFileName = updatedDeps[0]?.lockFiles?.[0] ?? config.lockFiles?.[0];
	if (!lockFileName) {
		logger.debug("No lock file found. Skipping artifact update.");
		return null;
	}
	const oldLockFileContent = await readLocalFile(lockFileName);
	if (!oldLockFileContent) {
		logger.debug(`Failed to read ${lockFileName}. Skipping artifact update.`);
		return [{ artifactError: {
			fileName: lockFileName,
			stderr: `Failed to read "${lockFileName}"`
		} }];
	}
	for (const updateDep of updatedDeps) if (updateDep.depType === "tasks" || updateDep.depType === "tasks.command") {
		logger.warn(`depType: "${updateDep.depType}", depName: "${updateDep.depName}" can't be updated with a lock file: "${lockFileName}"`);
		return [{ artifactError: {
			fileName: lockFileName,
			stderr: `depType: "${updateDep.depType}", depName: "${updateDep.depName}" can't be updated with a lock file: "${lockFileName}"`
		} }];
	}
	try {
		await writeLocalFile(packageFileName, newPackageFileContent);
		let args = "";
		if (isLockFileMaintenance) {
			await deleteLocalFile(lockFileName);
			args += " --frozen=false";
		}
		const execOptions = {
			cwdFile: updatedDeps.find((dep) => dep.managerData?.importMapReferrer)?.managerData?.importMapReferrer ?? packageFileName,
			docker: {},
			toolConstraints: [{
				toolName: "deno",
				constraint: config.constraints?.deno
			}]
		};
		let command = "deno install";
		if (args) command += args;
		await exec(command, execOptions);
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