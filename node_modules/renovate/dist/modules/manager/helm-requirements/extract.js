import { logger } from "../../../logger/index.js";
import { parseUrl } from "../../../util/url.js";
import { parseSingleYaml } from "../../../util/yaml.js";
import { HelmDatasource } from "../../datasource/helm/index.js";
import { isArray } from "@sindresorhus/is";
//#region lib/modules/manager/helm-requirements/extract.ts
function extractPackageFile(content, packageFile, config) {
	let deps = [];
	let doc;
	try {
		doc = parseSingleYaml(content);
	} catch {
		logger.debug({ packageFile }, `Failed to parse helm requirements.yaml`);
		return null;
	}
	if (!(doc && isArray(doc.dependencies))) {
		logger.debug({ packageFile }, `requirements.yaml has no dependencies`);
		return null;
	}
	deps = doc.dependencies.map((dep) => {
		let currentValue;
		switch (typeof dep.version) {
			case "number":
				currentValue = String(dep.version);
				break;
			case "string": currentValue = dep.version;
		}
		const res = {
			depName: dep.name,
			currentValue
		};
		if (!res.depName) {
			res.skipReason = "invalid-name";
			return res;
		}
		if (!res.currentValue) {
			res.skipReason = "invalid-version";
			return res;
		}
		if (!dep.repository) {
			res.skipReason = "no-repository";
			return res;
		}
		res.registryUrls = [dep.repository];
		if (dep.repository.startsWith("@") || dep.repository.startsWith("alias:")) {
			const repoWithPrefixRemoved = dep.repository.slice(dep.repository[0] === "@" ? 1 : 6);
			const alias = config.registryAliases?.[repoWithPrefixRemoved];
			if (alias) {
				res.registryUrls = [alias];
				return res;
			}
			res.skipReason = "placeholder-url";
		} else {
			const url = parseUrl(dep.repository);
			if (!url) {
				logger.debug({
					packageFile,
					url: dep.repository
				}, "Error parsing url");
				res.skipReason = "invalid-url";
			} else if (url.protocol === "file:") res.skipReason = "local-dependency";
		}
		return res;
	});
	return {
		deps,
		datasource: HelmDatasource.id
	};
}
//#endregion
export { extractPackageFile };

//# sourceMappingURL=extract.js.map