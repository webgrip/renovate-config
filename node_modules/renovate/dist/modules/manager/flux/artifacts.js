import { logger } from "../../../logger/index.js";
import { readLocalFile } from "../../../util/fs/index.js";
import { exec } from "../../../util/exec/index.js";
import { isSystemManifest } from "./common.js";
import { quote } from "shlex";
//#region lib/modules/manager/flux/artifacts.ts
async function updateArtifacts({ packageFileName, updatedDeps }) {
	const systemDep = updatedDeps[0];
	if (!isSystemManifest(packageFileName) || !systemDep?.newVersion) return null;
	const existingFileContent = await readLocalFile(packageFileName);
	try {
		logger.debug(`Updating Flux system manifests`);
		const args = ["--export"];
		if (systemDep.managerData?.components) args.push("--components", quote(systemDep.managerData.components));
		const result = await exec(`flux install ${args.join(" ")} > ${quote(packageFileName)}`, {
			shell: true,
			docker: {},
			toolConstraints: [{
				toolName: "flux",
				constraint: updatedDeps[0].newVersion
			}]
		});
		const newFileContent = await readLocalFile(packageFileName);
		if (!newFileContent) {
			logger.debug("Cannot read new flux file content");
			return [{ artifactError: {
				fileName: packageFileName,
				stderr: result.stderr
			} }];
		}
		if (newFileContent === existingFileContent) {
			logger.debug("Flux contents are unchanged");
			return null;
		}
		return [{ file: {
			type: "addition",
			path: packageFileName,
			contents: newFileContent
		} }];
	} catch (err) {
		logger.debug({ err }, "Error generating new Flux system manifests");
		return [{ artifactError: {
			fileName: packageFileName,
			stderr: err.message
		} }];
	}
}
//#endregion
export { updateArtifacts };

//# sourceMappingURL=artifacts.js.map