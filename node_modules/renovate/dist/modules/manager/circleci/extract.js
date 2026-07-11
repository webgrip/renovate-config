import { logger } from "../../../logger/index.js";
import { parseSingleYaml } from "../../../util/yaml.js";
import "../../versioning/npm/index.js";
import { Result } from "../../../util/result.js";
import { OrbDatasource } from "../../datasource/orb/index.js";
import { getDep } from "../dockerfile/extract.js";
import { CircleCiFile } from "./schema.js";
//#region lib/modules/manager/circleci/extract.ts
function extractDefinition(deps, definition, registryAliases) {
	for (const [key, orb] of Object.entries(definition.orbs)) if (typeof orb === "string") {
		const [packageName, currentValue] = orb.split("@");
		deps.push({
			depName: key,
			packageName,
			depType: "orb",
			currentValue,
			versioning: "npm",
			datasource: OrbDatasource.id
		});
	} else extractDefinition(deps, orb, registryAliases);
	const environments = [...definition.executors, ...definition.jobs];
	for (const dockerImage of environments) deps.push({
		...getDep(dockerImage, true, registryAliases),
		depType: "docker"
	});
}
function extractPackageFile(content, packageFile, config) {
	const { val: parsed, err } = Result.wrap(() => CircleCiFile.parse(parseSingleYaml(content, { version: "1.1" }))).unwrap();
	if (err) {
		logger.debug({
			err,
			packageFile
		}, "Error extracting circleci images");
		return null;
	}
	const registryAliases = config?.registryAliases ?? {};
	const deps = [];
	extractDefinition(deps, parsed, registryAliases);
	for (const alias of parsed.aliases) deps.push({
		...getDep(alias, true, registryAliases),
		depType: "docker"
	});
	if (!deps.length) return null;
	return { deps };
}
//#endregion
export { extractPackageFile };

//# sourceMappingURL=extract.js.map