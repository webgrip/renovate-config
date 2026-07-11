import { logger } from "../../../logger/index.js";
import { getSiblingFileName, readLocalFile } from "../../../util/fs/index.js";
import { exec } from "../../../util/exec/index.js";
import { isNonEmptyArray } from "@sindresorhus/is";
import { quote } from "shlex";
import semver from "semver";
//#region lib/modules/manager/devbox/artifacts.ts
async function updateArtifacts({ config: { constraints, isLockFileMaintenance }, packageFileName, updatedDeps }) {
	const lockFileName = getSiblingFileName(packageFileName, "devbox.lock");
	if (!await readLocalFile(lockFileName, "utf8")) {
		logger.debug("No devbox.lock found");
		return null;
	}
	const supportsNoInstall = constraints?.devbox ? semver.intersects(constraints.devbox, ">=0.14.0") : true;
	const execOptions = {
		cwdFile: packageFileName,
		toolConstraints: [{
			toolName: "nix",
			constraint: constraints?.nix
		}, {
			toolName: "devbox",
			constraint: constraints?.devbox
		}],
		docker: {}
	};
	const cmd = [];
	if (isLockFileMaintenance) cmd.push(supportsNoInstall ? "devbox update --no-install" : "devbox update");
	else if (isNonEmptyArray(updatedDeps)) if (supportsNoInstall) {
		const updateCommands = updatedDeps.map((dep) => dep.depName && `devbox update ${quote(dep.depName)} --no-install`).filter((dep) => Boolean(dep));
		if (updateCommands.length) cmd.push(...updateCommands);
		else {
			logger.trace("No updated devbox packages - returning null");
			return null;
		}
	} else cmd.push("devbox install");
	else {
		logger.trace("No updated devbox packages - returning null");
		return null;
	}
	const oldLockFileContent = await readLocalFile(lockFileName);
	if (!oldLockFileContent) {
		logger.trace(`No ${lockFileName} found`);
		return null;
	}
	try {
		await exec(cmd, execOptions);
		const newLockFileContent = await readLocalFile(lockFileName);
		if (!newLockFileContent || Buffer.compare(oldLockFileContent, newLockFileContent) === 0) return null;
		logger.trace("Returning updated devbox.lock");
		return [{ file: {
			type: "addition",
			path: lockFileName,
			contents: newLockFileContent
		} }];
	} catch (err) {
		logger.warn({ err }, "Error updating devbox.lock");
		return [{ artifactError: {
			fileName: lockFileName,
			stderr: err.message
		} }];
	}
}
//#endregion
export { updateArtifacts };

//# sourceMappingURL=artifacts.js.map