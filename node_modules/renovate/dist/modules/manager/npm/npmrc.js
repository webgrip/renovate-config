import { newlineRegex, regEx } from "../../../util/regex.js";
import { GlobalConfig } from "../../../config/global.js";
import { logger } from "../../../logger/index.js";
import { findLocalSiblingOrParent, readLocalFile } from "../../../util/fs/index.js";
import { isString } from "@sindresorhus/is";
//#region lib/modules/manager/npm/npmrc.ts
async function resolveNpmrc(packageFile, config) {
	let npmrc;
	const npmrcFileName = await findLocalSiblingOrParent(packageFile, ".npmrc");
	if (npmrcFileName) {
		let repoNpmrc = await readLocalFile(npmrcFileName, "utf8");
		// v8 ignore else -- TODO: add test #40625
		if (isString(repoNpmrc)) if (isString(config.npmrc) && !config.npmrcMerge) {
			logger.debug({ npmrcFileName }, "Repo .npmrc file is ignored due to config.npmrc with config.npmrcMerge=false");
			npmrc = config.npmrc;
		} else {
			npmrc = config.npmrc ?? "";
			if (npmrc.length) {
				if (!npmrc.endsWith("\n")) npmrc += "\n";
			}
			if (repoNpmrc?.includes("package-lock")) {
				logger.debug("Stripping package-lock setting from .npmrc");
				repoNpmrc = repoNpmrc.replace(regEx(/(^|\n)package-lock.*?(\n|$)/g), "\n");
			}
			if (repoNpmrc.includes("=${") && !GlobalConfig.get("exposeAllEnv")) {
				logger.debug({ npmrcFileName }, "Stripping .npmrc file of lines with variables");
				repoNpmrc = repoNpmrc.split(newlineRegex).filter((line) => !line.includes("=${")).join("\n");
			}
			npmrc += repoNpmrc;
		}
	} else if (isString(config.npmrc)) npmrc = config.npmrc;
	return {
		npmrc,
		npmrcFileName
	};
}
//#endregion
export { resolveNpmrc };

//# sourceMappingURL=npmrc.js.map