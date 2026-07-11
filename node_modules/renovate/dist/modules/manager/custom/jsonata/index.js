import { __exportAll } from "../../../../_virtual/_rolldown/runtime.js";
import { logger } from "../../../../logger/index.js";
import { parseJson } from "../../../../util/common.js";
import { parse } from "../../../../util/toml.js";
import { parseYaml } from "../../../../util/yaml.js";
import { validMatchFields } from "../utils.js";
import { handleMatching } from "./utils.js";
import { isNullOrUndefined } from "@sindresorhus/is";
//#region lib/modules/manager/custom/jsonata/index.ts
var jsonata_exports = /* @__PURE__ */ __exportAll({
	categories: () => categories,
	defaultConfig: () => defaultConfig,
	displayName: () => displayName,
	extractPackageFile: () => extractPackageFile,
	supportedDatasources: () => supportedDatasources
});
const categories = ["custom"];
const defaultConfig = { pinDigests: false };
const supportedDatasources = ["*"];
const displayName = "JSONata";
async function extractPackageFile(content, packageFile, config) {
	let json;
	try {
		switch (config.fileFormat) {
			case "json":
				json = parseJson(content, packageFile);
				break;
			case "yaml":
				json = parseYaml(content);
				break;
			case "toml":
				json = parse(content);
				break;
		}
	} catch (err) {
		logger.debug({
			err,
			fileName: packageFile,
			fileFormat: config.fileFormat
		}, "Error while parsing file");
		return null;
	}
	if (isNullOrUndefined(json)) return null;
	const deps = await handleMatching(json, packageFile, config);
	if (!deps.length) return null;
	const res = {
		deps,
		matchStrings: config.matchStrings,
		fileFormat: config.fileFormat
	};
	for (const field of validMatchFields.map((f) => `${f}Template`)) if (config[field]) res[field] = config[field];
	return res;
}
//#endregion
export { jsonata_exports };

//# sourceMappingURL=index.js.map