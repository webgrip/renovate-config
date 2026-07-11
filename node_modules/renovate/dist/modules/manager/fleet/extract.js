import { regEx } from "../../../util/regex.js";
import { parseYaml } from "../../../util/yaml.js";
import { GitTagsDatasource } from "../../datasource/git-tags/index.js";
import { HelmDatasource } from "../../datasource/helm/index.js";
import { getDep } from "../dockerfile/extract.js";
import { isOCIRegistry, removeOCIPrefix } from "../helmv3/oci.js";
import { checkIfStringIsPath } from "../terraform/util.js";
import { FleetFile, GitRepo } from "./schema.js";
import { isUndefined } from "@sindresorhus/is";
//#region lib/modules/manager/fleet/extract.ts
function extractGitRepo(doc) {
	const dep = {
		depType: "git_repo",
		datasource: GitTagsDatasource.id
	};
	const repo = doc.spec?.repo;
	if (!repo) return {
		...dep,
		skipReason: "missing-depname"
	};
	dep.sourceUrl = repo;
	dep.depName = repo;
	const currentValue = doc.spec.revision;
	if (!currentValue) return {
		...dep,
		skipReason: "unspecified-version"
	};
	return {
		...dep,
		currentValue
	};
}
function extractFleetHelmBlock(doc, config) {
	const dep = {
		depType: "fleet",
		datasource: HelmDatasource.id
	};
	if (!doc.chart) return {
		...dep,
		skipReason: "missing-depname"
	};
	if (isOCIRegistry(doc.chart)) return {
		...getDep(`${removeOCIPrefix(doc.chart)}:${doc.version}`, false, config.registryAliases),
		depType: "fleet",
		pinDigests: false
	};
	dep.depName = doc.chart;
	dep.packageName = doc.chart;
	if (!doc.repo) {
		if (checkIfStringIsPath(doc.chart)) return {
			...dep,
			skipReason: "local-chart"
		};
		return {
			...dep,
			skipReason: "no-repository"
		};
	}
	const alias = config.registryAliases?.[doc.repo];
	if (alias) dep.registryUrls = [alias];
	else dep.registryUrls = [doc.repo];
	const currentValue = doc.version;
	if (!doc.version) return {
		...dep,
		skipReason: "unspecified-version"
	};
	return {
		...dep,
		currentValue
	};
}
function extractFleetFile(doc, config) {
	const result = [];
	result.push(extractFleetHelmBlock(doc.helm, config));
	if (!isUndefined(doc.targetCustomizations)) {
		const helmBlockContext = { ...doc.helm };
		delete helmBlockContext.version;
		for (const [index, custom] of doc.targetCustomizations.entries()) {
			const dep = extractFleetHelmBlock({
				...helmBlockContext,
				...custom.helm
			}, config);
			result.push({
				...dep,
				depName: custom.name ?? `targetCustomization[${index}]`
			});
		}
	}
	return result;
}
function extractPackageFile(content, packageFile, config) {
	if (!content) return null;
	const deps = [];
	if (regEx("fleet.ya?ml").test(packageFile)) {
		const fleetDeps = parseYaml(content, {
			customSchema: FleetFile,
			failureBehaviour: "filter"
		}).flatMap((doc) => extractFleetFile(doc, config));
		deps.push(...fleetDeps);
	} else {
		const gitRepoDeps = parseYaml(content, {
			customSchema: GitRepo,
			failureBehaviour: "filter"
		}).flatMap(extractGitRepo);
		deps.push(...gitRepoDeps);
	}
	return deps.length ? { deps } : null;
}
//#endregion
export { extractPackageFile };

//# sourceMappingURL=extract.js.map