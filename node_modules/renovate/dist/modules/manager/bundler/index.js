import { __exportAll } from "../../../_virtual/_rolldown/runtime.js";
import { id } from "../../versioning/ruby/index.js";
import { RubyVersionDatasource } from "../../datasource/ruby-version/index.js";
import { RubygemsDatasource } from "../../datasource/rubygems/index.js";
import { updateArtifacts } from "./artifacts.js";
import { extractPackageFile } from "./extract.js";
import { updateLockedDependency } from "./update-locked.js";
//#region lib/modules/manager/bundler/index.ts
var bundler_exports = /* @__PURE__ */ __exportAll({
	categories: () => categories,
	defaultConfig: () => defaultConfig,
	extractPackageFile: () => extractPackageFile,
	lockFileNames: () => lockFileNames,
	supportedDatasources: () => supportedDatasources,
	supportsLockFileMaintenance: () => true,
	updateArtifacts: () => updateArtifacts,
	updateLockedDependency: () => updateLockedDependency,
	url: () => url
});
const lockFileNames = ["Gemfile.lock"];
const url = "https://bundler.io/docs.html";
const categories = ["ruby"];
const defaultConfig = {
	managerFilePatterns: ["/(^|/)Gemfile$/"],
	versioning: id
};
const supportedDatasources = [RubygemsDatasource.id, RubyVersionDatasource.id];
//#endregion
export { bundler_exports };

//# sourceMappingURL=index.js.map