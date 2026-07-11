import { regEx } from "../../../util/regex.js";
import { logger } from "../../../logger/index.js";
import { trimTrailingSlash } from "../../../util/url.js";
import { coerceArray } from "../../../util/array.js";
import { withDebugMessage } from "../../../util/schema-utils/index.js";
import { DockerDatasource } from "../../datasource/docker/index.js";
import { GitTagsDatasource } from "../../datasource/git-tags/index.js";
import { HelmDatasource } from "../../datasource/helm/index.js";
import { getDep } from "../dockerfile/extract.js";
import { isOCIRegistry, removeOCIPrefix } from "../helmv3/oci.js";
import { ApplicationDefinitions } from "./schema.js";
import { fileTestRegex } from "./util.js";
import { isNonEmptyObject, isTruthy } from "@sindresorhus/is";
//#region lib/modules/manager/argocd/extract.ts
const kustomizeImageRe = regEx(/=(?<image>.+)$/);
function extractPackageFile(content, packageFile, _config) {
	if (fileTestRegex.test(content) === false) {
		logger.debug(`Skip file ${packageFile} as no argoproj.io apiVersion could be found in matched file`);
		return null;
	}
	const deps = ApplicationDefinitions.catch(withDebugMessage([], `${packageFile} does not match schema`)).parse(content).flatMap(processAppSpec);
	return deps.length ? { deps } : null;
}
function processSource(source) {
	if (source.chart) {
		if (isOCIRegistry(source.repoURL) || !source.repoURL.includes("://")) return [{
			depName: `${trimTrailingSlash(removeOCIPrefix(source.repoURL))}/${source.chart}`,
			currentValue: source.targetRevision,
			datasource: DockerDatasource.id
		}];
		return [{
			depName: source.chart,
			registryUrls: [source.repoURL],
			currentValue: source.targetRevision,
			datasource: HelmDatasource.id
		}];
	}
	if (isOCIRegistry(source.repoURL)) return [{
		depName: trimTrailingSlash(removeOCIPrefix(source.repoURL)),
		currentValue: source.targetRevision,
		datasource: DockerDatasource.id
	}];
	const dependencies = [{
		depName: source.repoURL,
		currentValue: source.targetRevision,
		datasource: GitTagsDatasource.id
	}];
	if (source.kustomize?.images) dependencies.push(...source.kustomize.images.map(processKustomizeImage).filter(isTruthy));
	return dependencies;
}
function processAppSpec(definition) {
	const spec = definition.kind === "Application" ? definition.spec : definition.spec.template.spec;
	const deps = [];
	if (isNonEmptyObject(spec.source)) deps.push(...processSource(spec.source));
	for (const source of coerceArray(spec.sources)) deps.push(...processSource(source));
	return deps;
}
function processKustomizeImage(kustomizeImage) {
	const parts = kustomizeImageRe.exec(kustomizeImage);
	if (!parts?.groups?.image) return null;
	return getDep(parts.groups.image);
}
//#endregion
export { extractPackageFile };

//# sourceMappingURL=extract.js.map