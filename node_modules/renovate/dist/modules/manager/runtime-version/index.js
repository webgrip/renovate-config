import { __exportAll } from "../../../_virtual/_rolldown/runtime.js";
import { DockerDatasource } from "../../datasource/docker/index.js";
import { extractPackageFile } from "./extract.js";
//#region lib/modules/manager/runtime-version/index.ts
var runtime_version_exports = /* @__PURE__ */ __exportAll({
	categories: () => categories,
	defaultConfig: () => defaultConfig,
	displayName: () => displayName,
	extractPackageFile: () => extractPackageFile,
	supportedDatasources: () => supportedDatasources
});
const displayName = "runtime.txt";
const categories = ["python"];
const defaultConfig = {
	managerFilePatterns: ["/(^|/)runtime.txt$/"],
	pinDigests: false
};
const supportedDatasources = [DockerDatasource.id];
//#endregion
export { runtime_version_exports };

//# sourceMappingURL=index.js.map