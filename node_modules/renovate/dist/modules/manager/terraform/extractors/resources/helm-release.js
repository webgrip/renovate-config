import { logger } from "../../../../../logger/index.js";
import { joinUrlParts } from "../../../../../util/url.js";
import { HelmDatasource } from "../../../../datasource/helm/index.js";
import { getDep } from "../../../dockerfile/extract.js";
import { isOCIRegistry, removeOCIPrefix } from "../../../helmv3/oci.js";
import { checkIfStringIsPath } from "../../util.js";
import { DependencyExtractor } from "../../base.js";
import { isNonEmptyString, isNullOrUndefined, isPlainObject } from "@sindresorhus/is";
//#region lib/modules/manager/terraform/extractors/resources/helm-release.ts
var HelmReleaseExtractor = class extends DependencyExtractor {
	getCheckList() {
		return [`"helm_release"`];
	}
	extract(hclMap, _locks, config) {
		const dependencies = [];
		const helmReleases = hclMap?.resource?.helm_release;
		if (isNullOrUndefined(helmReleases)) return [];
		/* v8 ignore next 7 -- needs test */
		if (!isPlainObject(helmReleases)) {
			logger.debug({ helmReleases }, "Terraform: unexpected `helmReleases` value");
			return [];
		}
		for (const helmRelease of Object.values(helmReleases).flat()) {
			const dep = {
				currentValue: helmRelease.version,
				depType: "helm_release",
				depName: helmRelease.chart,
				datasource: HelmDatasource.id
			};
			dependencies.push(dep);
			if (!isNonEmptyString(helmRelease.chart)) dep.skipReason = "invalid-name";
			else if (isOCIRegistry(helmRelease.chart)) {
				dep.depName = removeOCIPrefix(helmRelease.chart);
				this.processOCI(dep.depName, config, dep);
			} else if (checkIfStringIsPath(helmRelease.chart)) dep.skipReason = "local-chart";
			else if (isNonEmptyString(helmRelease.repository)) if (isOCIRegistry(helmRelease.repository)) this.processOCI(joinUrlParts(removeOCIPrefix(helmRelease.repository), helmRelease.chart), config, dep);
			else dep.registryUrls = [helmRelease.repository];
		}
		return dependencies;
	}
	processOCI(depName, config, dep) {
		const { packageName, datasource } = getDep(depName, false, config.registryAliases);
		dep.packageName = packageName;
		dep.datasource = datasource;
	}
};
//#endregion
export { HelmReleaseExtractor };

//# sourceMappingURL=helm-release.js.map