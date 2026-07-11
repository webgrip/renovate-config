import "../../../constants/error-messages.js";
import { regEx } from "../../../util/regex.js";
import { logger } from "../../../logger/index.js";
import { find } from "../../../util/host-rules.js";
import { parseSingleYaml } from "../../../util/yaml.js";
import { getParentDir, getSiblingFileName, readLocalFile, writeLocalFile } from "../../../util/fs/index.js";
import { exec } from "../../../util/exec/index.js";
import { getRepoStatus } from "../../../util/git/index.js";
import { DockerDatasource } from "../../datasource/docker/index.js";
import { HelmDatasource } from "../../datasource/helm/index.js";
import { isOCIRegistry, removeOCIPrefix } from "./oci.js";
import { generateHelmEnvs, generateLoginCmd } from "./common.js";
import { aliasRecordToRepositories, getRepositories, isFileInDir } from "./utils.js";
import { isString, isTruthy } from "@sindresorhus/is";
import { quote } from "shlex";
import pMap from "p-map";
//#region lib/modules/manager/helmv3/artifacts.ts
async function helmCommands(execOptions, manifestPath, repositories) {
	const cmd = [];
	await pMap(repositories.filter(isOCIRegistry).map((value) => {
		return {
			...value,
			repository: removeOCIPrefix(value.repository),
			hostRule: find({
				url: value.repository.replace("oci://", "https://"),
				hostType: DockerDatasource.id
			})
		};
	}), async (value) => {
		const loginCmd = await generateLoginCmd(value);
		if (loginCmd) cmd.push(loginCmd);
	});
	repositories.filter((repository) => !isOCIRegistry(repository)).map((value) => {
		return {
			...value,
			hostRule: find({
				url: value.repository,
				hostType: HelmDatasource.id
			})
		};
	}).forEach((value) => {
		const { username, password } = value.hostRule;
		const parameters = [`${quote(value.repository)}`, `--force-update`];
		if (username && password) {
			parameters.push(`--username ${quote(username)}`);
			parameters.push(`--password ${quote(password)}`);
		}
		cmd.push(`helm repo add ${quote(value.name)} ${parameters.join(" ")}`);
	});
	cmd.push(`helm dependency update ${quote(getParentDir(manifestPath))}`);
	await exec(cmd, execOptions);
}
async function updateArtifacts({ packageFileName, updatedDeps, newPackageFileContent, config }) {
	logger.debug(`helmv3.updateArtifacts(${packageFileName})`);
	const { isLockFileMaintenance } = config;
	const isUpdateOptionAddChartArchives = config.postUpdateOptions?.includes("helmUpdateSubChartArchives");
	if (!isLockFileMaintenance && (updatedDeps === void 0 || updatedDeps.length < 1)) {
		logger.debug("No updated helmv3 deps - returning null");
		return null;
	}
	const lockFileName = getSiblingFileName(packageFileName, "Chart.lock");
	const existingLockFileContent = await readLocalFile(lockFileName, "utf8");
	if (!existingLockFileContent && !isUpdateOptionAddChartArchives) {
		logger.debug("No Chart.lock found");
		return null;
	}
	try {
		const packages = parseSingleYaml(newPackageFileContent);
		const locks = existingLockFileContent ? parseSingleYaml(existingLockFileContent) : { dependencies: [] };
		const chartDefinitions = [];
		if (config.registryAliases) chartDefinitions.push({ dependencies: aliasRecordToRepositories(config.registryAliases) });
		chartDefinitions.push(packages, locks);
		const repositories = getRepositories(chartDefinitions);
		await writeLocalFile(packageFileName, newPackageFileContent);
		logger.debug("Updating Helm artifacts");
		const helmToolConstraint = {
			toolName: "helm",
			constraint: config.constraints?.helm
		};
		await helmCommands({
			docker: {},
			extraEnv: generateHelmEnvs(),
			toolConstraints: [helmToolConstraint]
		}, packageFileName, repositories);
		logger.debug("Returning updated Helm artifacts");
		const fileChanges = [];
		if (isTruthy(existingLockFileContent)) {
			const newHelmLockContent = await readLocalFile(lockFileName, "utf8");
			if (!isString(newHelmLockContent) || isHelmLockChanged(existingLockFileContent, newHelmLockContent)) fileChanges.push({ file: {
				type: "addition",
				path: lockFileName,
				contents: newHelmLockContent
			} });
			else logger.debug("Chart.lock is unchanged");
		}
		if (isTruthy(isUpdateOptionAddChartArchives)) {
			const chartsPath = getSiblingFileName(packageFileName, "charts");
			const status = await getRepoStatus();
			const chartsAddition = status.not_added ?? [];
			const chartsDeletion = status.deleted ?? [];
			for (const file of chartsAddition) {
				if (!isFileInDir(chartsPath, file)) continue;
				fileChanges.push({ file: {
					type: "addition",
					path: file,
					contents: await readLocalFile(file)
				} });
			}
			for (const file of chartsDeletion) {
				if (!isFileInDir(chartsPath, file)) continue;
				fileChanges.push({ file: {
					type: "deletion",
					path: file
				} });
			}
		}
		return fileChanges.length > 0 ? fileChanges : null;
	} catch (err) {
		// istanbul ignore if
		if (err.message === "temporary-error") throw err;
		logger.debug({ err }, "Failed to update Helm lock file");
		return [{ artifactError: {
			fileName: lockFileName,
			stderr: err.message
		} }];
	}
}
function isHelmLockChanged(oldContent, newContent) {
	const regex = regEx(/^generated: ".+"$/m);
	return newContent.replace(regex, "") !== oldContent.replace(regex, "");
}
//#endregion
export { updateArtifacts };

//# sourceMappingURL=artifacts.js.map