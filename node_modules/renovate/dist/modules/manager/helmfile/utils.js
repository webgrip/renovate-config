import { find } from "../../../util/host-rules.js";
import { getParentDir, localPathExists } from "../../../util/fs/index.js";
import { DockerDatasource } from "../../datasource/docker/index.js";
import { generateLoginCmd } from "../helmv3/common.js";
import upath from "upath";
//#region lib/modules/manager/helmfile/utils.ts
/** Returns true if a helmfile release contains kustomize specific keys **/
function kustomizationsKeysUsed(release) {
	return release.strategicMergePatches !== void 0 || release.jsonPatches !== void 0 || release.transformers !== void 0;
}
/** Returns true if a helmfile release uses a local chart with a kustomization.yaml file **/
function localChartHasKustomizationsYaml(release, helmFileYamlFileName) {
	const helmfileYamlParentDir = getParentDir(helmFileYamlFileName) || "";
	return localPathExists(upath.join(helmfileYamlParentDir, release.chart, "kustomization.yaml"));
}
function isOCIRegistry(repository) {
	return repository.oci === true;
}
async function generateRegistryLoginCmd(repositoryName, repositoryBaseURL, repositoryHost) {
	return await generateLoginCmd({
		name: repositoryName,
		repository: repositoryHost,
		hostRule: find({
			url: repositoryBaseURL,
			hostType: DockerDatasource.id
		})
	});
}
//#endregion
export { generateRegistryLoginCmd, isOCIRegistry, kustomizationsKeysUsed, localChartHasKustomizationsYaml };

//# sourceMappingURL=utils.js.map