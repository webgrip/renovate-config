import { trimTrailingSlash } from "../../../util/url.js";
import { parseYaml } from "../../../util/yaml.js";
import { coerceArray } from "../../../util/array.js";
import { DockerDatasource } from "../../datasource/docker/index.js";
import { HelmDatasource } from "../../datasource/helm/index.js";
import { getDep } from "../dockerfile/extract.js";
import { isOCIRegistry, removeOCIPrefix } from "../helmv3/oci.js";
import { ProfileDefinition } from "./schema.js";
import { removeRepositoryName } from "./util.js";
//#region lib/modules/manager/sveltos/extract.ts
function extractPackageFile(content, packageFile, config) {
	const definitions = parseYaml(content, {
		customSchema: ProfileDefinition,
		failureBehaviour: "filter"
	});
	const deps = [];
	for (const definition of definitions) {
		const extractedDeps = extractDefinition(definition, config);
		deps.push(...extractedDeps);
	}
	return deps.length ? { deps } : null;
}
function extractDefinition(definition, config) {
	return processAppSpec(definition, config);
}
function processHelmCharts(source, registryAliases) {
	const dep = {
		depName: source.chartName,
		currentValue: source.chartVersion,
		datasource: HelmDatasource.id
	};
	if (isOCIRegistry(source.repositoryURL)) {
		const image = trimTrailingSlash(removeOCIPrefix(source.repositoryURL));
		dep.datasource = DockerDatasource.id;
		dep.packageName = getDep(image, false, registryAliases).packageName;
	} else {
		dep.packageName = removeRepositoryName(source.repositoryName, source.chartName);
		dep.registryUrls = [source.repositoryURL];
		dep.datasource = HelmDatasource.id;
	}
	return dep;
}
function processAppSpec(definition, config) {
	const deps = [];
	const depType = definition.kind;
	const helmCharts = definition.kind === "ClusterPromotion" ? definition.spec?.profileSpec?.helmCharts : definition.spec?.helmCharts;
	for (const source of coerceArray(helmCharts)) {
		const dep = processHelmCharts(source, config?.registryAliases);
		if (dep) {
			dep.depType = depType;
			deps.push(dep);
		}
	}
	return deps;
}
//#endregion
export { extractPackageFile };

//# sourceMappingURL=extract.js.map