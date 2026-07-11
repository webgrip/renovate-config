import "../../../constants/error-messages.js";
import { regEx } from "../../../util/regex.js";
import { logger } from "../../../logger/index.js";
import { parseYaml } from "../../../util/yaml.js";
import { coerceArray } from "../../../util/array.js";
import { getSiblingFileName, readLocalFile, writeLocalFile } from "../../../util/fs/index.js";
import { Result } from "../../../util/result.js";
import { exec } from "../../../util/exec/index.js";
import { getFile } from "../../../util/git/index.js";
import { generateHelmEnvs } from "../helmv3/common.js";
import { Doc, LockVersion } from "./schema.js";
import { generateRegistryLoginCmd, isOCIRegistry } from "./utils.js";
import { isFalsy } from "@sindresorhus/is";
import { quote } from "shlex";
//#region lib/modules/manager/helmfile/artifacts.ts
async function updateArtifacts({ packageFileName, updatedDeps, newPackageFileContent, config }) {
	logger.trace(`helmfile.updateArtifacts(${packageFileName})`);
	const { isLockFileMaintenance } = config;
	if (!isLockFileMaintenance && (updatedDeps === void 0 || updatedDeps.length < 1)) {
		logger.debug("No updated helmfile deps - returning null");
		return null;
	}
	const lockFileName = getSiblingFileName(packageFileName, "helmfile.lock");
	const existingLockFileContent = await getFile(lockFileName);
	if (isFalsy(existingLockFileContent)) {
		logger.debug("No helmfile.lock found");
		return null;
	}
	try {
		await writeLocalFile(packageFileName, newPackageFileContent);
		const toolConstraints = [{
			toolName: "helm",
			constraint: config.constraints?.helm
		}, {
			toolName: "helmfile",
			constraint: config.constraints?.helmfile ?? Result.parse(existingLockFileContent, LockVersion).unwrapOrNull()
		}];
		if (updatedDeps.some((dep) => dep.managerData?.needKustomize)) toolConstraints.push({
			toolName: "kustomize",
			constraint: config.constraints?.kustomize
		});
		const cmd = [];
		const docs = parseYaml(newPackageFileContent, {
			removeTemplates: true,
			customSchema: Doc,
			failureBehaviour: "filter"
		});
		for (const doc of docs) for (const value of coerceArray(doc.repositories).filter(isOCIRegistry)) {
			const loginCmd = await generateRegistryLoginCmd(value.name, `https://${value.url}`, value.url.replace(regEx(/\/.*/), ""));
			if (loginCmd) cmd.push(loginCmd);
		}
		cmd.push(`helmfile deps -f ${quote(packageFileName)}`);
		await exec(cmd, {
			docker: {},
			extraEnv: generateHelmEnvs(),
			toolConstraints
		});
		const newHelmLockContent = await readLocalFile(lockFileName, "utf8");
		if (existingLockFileContent === newHelmLockContent) {
			logger.debug("helmfile.lock is unchanged");
			return null;
		}
		return [{ file: {
			type: "addition",
			path: lockFileName,
			contents: newHelmLockContent
		} }];
	} catch (err) {
		// istanbul ignore if
		if (err.message === "temporary-error") throw err;
		logger.debug({ err }, "Failed to update Helmfile lock file");
		return [{ artifactError: {
			fileName: lockFileName,
			stderr: err.message
		} }];
	}
}
//#endregion
export { updateArtifacts };

//# sourceMappingURL=artifacts.js.map