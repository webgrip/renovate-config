import "../../../constants/error-messages.js";
import { logger } from "../../../logger/index.js";
import { getSiblingFileName, readLocalFile, writeLocalFile } from "../../../util/fs/index.js";
import { exec } from "../../../util/exec/index.js";
import { parsePubspec, parsePubspecLock } from "./utils.js";
import { isEmptyArray, isString } from "@sindresorhus/is";
import { quote } from "shlex";
//#region lib/modules/manager/pub/artifacts.ts
const SDK_NAMES = ["dart", "flutter"];
const PUB_GET_COMMAND = "pub get --no-precompile";
async function updateArtifacts({ packageFileName, updatedDeps, newPackageFileContent, config }) {
	logger.debug(`pub.updateArtifacts(${packageFileName})`);
	const { isLockFileMaintenance } = config;
	if (isEmptyArray(updatedDeps) && !isLockFileMaintenance) {
		logger.debug("No updated pub deps - returning null");
		return null;
	}
	const lockFileName = getSiblingFileName(packageFileName, "pubspec.lock");
	const oldLockFileContent = await readLocalFile(lockFileName, "utf8");
	if (!oldLockFileContent) {
		logger.debug("No pubspec.lock found");
		return null;
	}
	try {
		await writeLocalFile(packageFileName, newPackageFileContent);
		const isFlutter = newPackageFileContent.includes("sdk: flutter");
		const toolName = isFlutter ? "flutter" : "dart";
		const cmd = getExecCommand(toolName, updatedDeps, isLockFileMaintenance);
		let constraint = config.constraints?.[toolName];
		if (!constraint) {
			const pubspec = parsePubspec(packageFileName, newPackageFileContent);
			const pubspecToolName = isFlutter ? "flutter" : "sdk";
			constraint = pubspec?.environment[pubspecToolName];
			if (!constraint) constraint = parsePubspecLock(lockFileName, oldLockFileContent)?.sdks[toolName];
		}
		await exec(cmd, {
			cwdFile: packageFileName,
			docker: {},
			toolConstraints: [{
				toolName,
				constraint
			}]
		});
		const newLockFileContent = await readLocalFile(lockFileName, "utf8");
		if (oldLockFileContent === newLockFileContent) return null;
		return [{ file: {
			type: "addition",
			path: lockFileName,
			contents: newLockFileContent
		} }];
	} catch (err) {
		// istanbul ignore if
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
function getExecCommand(toolName, updatedDeps, isLockFileMaintenance) {
	if (isLockFileMaintenance) return `${toolName} pub upgrade`;
	else {
		const depNames = updatedDeps.map((dep) => dep.depName).filter(isString);
		if (depNames.length === 1 && SDK_NAMES.includes(depNames[0])) return `${toolName} ${PUB_GET_COMMAND}`;
		else if (depNames.length === 2 && depNames.filter((depName) => SDK_NAMES.includes(depName)).length === 2) return `flutter ${PUB_GET_COMMAND}`;
		else return `${toolName} pub upgrade ${depNames.filter((depName) => !SDK_NAMES.includes(depName)).map(quote).join(" ")}`;
	}
}
//#endregion
export { updateArtifacts };

//# sourceMappingURL=artifacts.js.map