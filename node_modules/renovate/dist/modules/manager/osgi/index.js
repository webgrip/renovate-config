import { __exportAll } from "../../../_virtual/_rolldown/runtime.js";
import { MavenDatasource } from "../../datasource/maven/index.js";
import { extractPackageFile } from "./extract.js";
//#region lib/modules/manager/osgi/index.ts
var osgi_exports = /* @__PURE__ */ __exportAll({
	categories: () => categories,
	defaultConfig: () => defaultConfig,
	displayName: () => displayName,
	extractPackageFile: () => extractPackageFile,
	supportedDatasources: () => supportedDatasources
});
const categories = ["java"];
const displayName = "OSGi";
const defaultConfig = { managerFilePatterns: ["/(^|/)src/main/features/.+\\.json$/"] };
const supportedDatasources = [MavenDatasource.id];
//#endregion
export { osgi_exports };

//# sourceMappingURL=index.js.map