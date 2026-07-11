import { __exportAll } from "../../../_virtual/_rolldown/runtime.js";
import { GitTagsDatasource } from "../../datasource/git-tags/index.js";
import { GithubTagsDatasource } from "../../datasource/github-tags/index.js";
import { HexDatasource } from "../../datasource/hex/index.js";
import { updateArtifacts } from "./artifacts.js";
import { knownDepTypes } from "./dep-types.js";
import { extractPackageFile } from "./extract.js";
import { getRangeStrategy } from "./range.js";
//#region lib/modules/manager/mix/index.ts
var mix_exports = /* @__PURE__ */ __exportAll({
	categories: () => categories,
	defaultConfig: () => defaultConfig,
	extractPackageFile: () => extractPackageFile,
	getRangeStrategy: () => getRangeStrategy,
	knownDepTypes: () => knownDepTypes,
	lockFileNames: () => lockFileNames,
	supportedDatasources: () => supportedDatasources,
	supportsLockFileMaintenance: () => true,
	updateArtifacts: () => updateArtifacts,
	url: () => url
});
const url = "https://hexdocs.pm/mix/Mix.html";
const categories = ["elixir"];
const defaultConfig = { managerFilePatterns: ["/(^|/)mix\\.exs$/"] };
const lockFileNames = ["mix.lock"];
const supportedDatasources = [
	GithubTagsDatasource.id,
	GitTagsDatasource.id,
	HexDatasource.id
];
//#endregion
export { mix_exports };

//# sourceMappingURL=index.js.map