import { logger } from "../../../logger/index.js";
import { parseYaml } from "../../../util/yaml.js";
import { id } from "../../versioning/docker/index.js";
import { getDep } from "../dockerfile/extract.js";
import { matchesHelmValuesDockerHeuristic, matchesHelmValuesInlineImage } from "./util.js";
//#region lib/modules/manager/helm-values/extract.ts
function getHelmDep(registry, repository, tag, registryAliases) {
	const dep = getDep(`${registry}${repository}:${tag}`, false, registryAliases);
	dep.replaceString = tag;
	dep.versioning = id;
	dep.autoReplaceStringTemplate = "{{newValue}}{{#if newDigest}}@{{newDigest}}{{/if}}";
	return dep;
}
/**
* Recursively find all supported dependencies in the yaml object.
*
* @param parsedContent
*/
function findDependencies(parsedContent, registryAliases) {
	return findDependenciesInternal(parsedContent, [], registryAliases);
}
function findDependenciesInternal(parsedContent, packageDependencies, registryAliases) {
	if (!parsedContent || typeof parsedContent !== "object") return packageDependencies;
	Object.entries(parsedContent).forEach(([key, value]) => {
		if (matchesHelmValuesDockerHeuristic(key, value)) {
			const currentItem = value;
			let registry = currentItem.registry;
			registry = registry ? `${registry}/` : "";
			const repository = String(currentItem.repository);
			const tag = `${currentItem.tag ?? currentItem.version}`;
			packageDependencies.push(getHelmDep(registry, repository, tag, registryAliases));
		} else if (matchesHelmValuesInlineImage(key, value)) packageDependencies.push(getDep(value, true, registryAliases));
		else findDependenciesInternal(value, packageDependencies, registryAliases);
	});
	return packageDependencies;
}
function extractPackageFile(content, packageFile, config) {
	let parsedContent;
	try {
		parsedContent = parseYaml(content);
	} catch (err) {
		logger.debug({
			err,
			packageFile
		}, "Failed to parse helm-values YAML");
		return null;
	}
	try {
		const deps = [];
		for (const con of parsedContent) deps.push(...findDependencies(con, config.registryAliases));
		if (deps.length) return { deps };
	} catch (err) 	/* istanbul ignore next */ {
		logger.debug({
			err,
			packageFile
		}, "Error parsing helm-values parsed content");
	}
	return null;
}
//#endregion
export { extractPackageFile, findDependencies };

//# sourceMappingURL=extract.js.map