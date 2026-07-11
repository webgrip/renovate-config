import { __exportAll } from "../../../_virtual/_rolldown/runtime.js";
import { TypstDatasource } from "../../datasource/typst/index.js";
import { extractPackageFile } from "./extract.js";
//#region lib/modules/manager/typst/index.ts
var typst_exports = /* @__PURE__ */ __exportAll({
	defaultConfig: () => defaultConfig,
	displayName: () => displayName,
	extractPackageFile: () => extractPackageFile,
	supportedDatasources: () => supportedDatasources
});
const displayName = "Typst package";
const defaultConfig = { managerFilePatterns: ["/\\.typ$/"] };
const supportedDatasources = [TypstDatasource.id];
//#endregion
export { typst_exports };

//# sourceMappingURL=index.js.map