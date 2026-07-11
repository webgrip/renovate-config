import { regEx } from "../../../util/regex.js";
import { logger } from "../../../logger/index.js";
import { parseYaml } from "../../../util/yaml.js";
import { coerceArray } from "../../../util/array.js";
import { coerceObject } from "../../../util/object.js";
import { DockerDatasource } from "../../datasource/docker/index.js";
import { HelmDatasource } from "../../datasource/helm/index.js";
import { isOCIRegistry, removeOCIPrefix } from "../helmv3/oci.js";
import { Doc } from "./schema.js";
import { kustomizationsKeysUsed, localChartHasKustomizationsYaml } from "./utils.js";
import { isEmptyArray, isString } from "@sindresorhus/is";
//#region lib/modules/manager/helmfile/extract.ts
function isValidChartName(name, oci) {
	if (oci) return !!name && !regEx(/[!@#$%^&*(),.?":{}|<>A-Z]/).test(name);
	else return !!name && !regEx(/[!@#$%^&*(),.?":{}/|<>A-Z]/).test(name);
}
function isLocalPath(possiblePath) {
	return [
		"./",
		"../",
		"/"
	].some((localPrefix) => possiblePath.startsWith(localPrefix));
}
async function extractPackageFile(content, packageFile, config) {
	const deps = [];
	let registryData = {};
	let needKustomize = false;
	const docs = parseYaml(content, {
		customSchema: Doc,
		failureBehaviour: "filter",
		removeTemplates: true
	});
	for (const doc of docs) {
		if (doc.repositories) {
			registryData = {};
			for (const repo of doc.repositories) {
				if (repo.url?.startsWith("git+")) {
					logger.debug({
						repo,
						packageFile
					}, `Skipping unsupported helm-git repository.`);
					continue;
				}
				registryData[repo.name] = repo;
			}
			logger.debug({
				registryAliases: registryData,
				packageFile
			}, `repositories discovered.`);
		}
		for (const dep of [...coerceArray(doc.releases), ...Object.values(coerceObject(doc.templates))]) {
			let depName = dep.chart;
			let packageName = null;
			let repoName = null;
			if (isLocalPath(dep.chart)) {
				if (kustomizationsKeysUsed(dep) || await localChartHasKustomizationsYaml(dep, packageFile)) needKustomize = true;
				deps.push({
					depName: dep.name,
					skipReason: "local-chart"
				});
				continue;
			}
			if (isOCIRegistry(dep.chart)) packageName = depName = removeOCIPrefix(dep.chart);
			else {
				if (dep.chart.includes("/")) {
					const v = dep.chart.split("/");
					repoName = v.shift();
					depName = v.join("/");
				} else repoName = dep.chart;
				if (registryData[repoName]?.oci) {
					const alias = registryData[repoName]?.url;
					if (alias) packageName = `${alias}/${depName}`;
					repoName = null;
				}
			}
			if (!isString(dep.version)) {
				deps.push({
					depName,
					skipReason: "invalid-version"
				});
				continue;
			}
			const res = {
				depName,
				currentValue: dep.version
			};
			if (kustomizationsKeysUsed(dep)) needKustomize = true;
			if (packageName) {
				res.datasource = DockerDatasource.id;
				res.packageName = packageName;
			} else if (repoName) res.registryUrls = [registryData[repoName]?.url].concat([config.registryAliases?.[repoName]]).filter(isString);
			if (!isValidChartName(isOCIRegistry(dep.chart) ? depName.slice(depName.lastIndexOf("/") + 1) : depName, !!packageName)) res.skipReason = "unsupported-chart-type";
			if (res.datasource !== DockerDatasource.id && isEmptyArray(res.registryUrls)) res.skipReason = "unknown-registry";
			deps.push(res);
		}
	}
	return deps.length ? {
		deps,
		datasource: HelmDatasource.id,
		...needKustomize && { managerData: { needKustomize } }
	} : null;
}
//#endregion
export { extractPackageFile };

//# sourceMappingURL=extract.js.map