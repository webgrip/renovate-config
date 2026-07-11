import { __exportAll } from "../../../_virtual/_rolldown/runtime.js";
import { PypiDatasource } from "../../datasource/pypi/index.js";
import { extractPackageFile } from "./extract.js";
import { updateArtifacts } from "./artifacts.js";
import { bumpPackageVersion } from "./update.js";
import { knownDepTypes, supportsDynamicDepTypesNote } from "./dep-types.js";
//#region lib/modules/manager/pep621/index.ts
var pep621_exports = /* @__PURE__ */ __exportAll({
	bumpPackageVersion: () => bumpPackageVersion,
	categories: () => categories,
	defaultConfig: () => defaultConfig,
	displayName: () => displayName,
	extractPackageFile: () => extractPackageFile,
	knownDepTypes: () => knownDepTypes,
	lockFileNames: () => lockFileNames,
	supportedDatasources: () => supportedDatasources,
	supportsDynamicDepTypesNote: () => supportsDynamicDepTypesNote,
	supportsLockFileMaintenance: () => true,
	updateArtifacts: () => updateArtifacts,
	url: () => url
});
const lockFileNames = ["pdm.lock", "uv.lock"];
const displayName = "PEP 621";
const url = "https://peps.python.org/pep-0621";
const categories = ["python"];
const defaultConfig = { managerFilePatterns: ["/(^|/)pyproject\\.toml$/"] };
const supportedDatasources = [PypiDatasource.id];
//#endregion
export { pep621_exports };

//# sourceMappingURL=index.js.map