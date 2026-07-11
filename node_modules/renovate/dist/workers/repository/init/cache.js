import { reset } from "../../../util/cache/memory/index.js";
import { privateCacheDir } from "../../../util/fs/index.js";
import { resetCache } from "../../../util/cache/repository/index.js";
import { setNpmrc } from "../../../modules/datasource/npm/npmrc.js";
import "../../../modules/datasource/npm/index.js";
import { initRepoCache } from "../../../util/cache/repository/init.js";
import fs from "fs-extra";
//#region lib/workers/repository/init/cache.ts
async function resetCaches() {
	reset();
	resetCache();
	await fs.remove(privateCacheDir());
}
async function initializeCaches(config) {
	await initRepoCache(config);
	await fs.ensureDir(privateCacheDir());
	setNpmrc();
	setNpmrc(config.npmrc);
}
//#endregion
export { initializeCaches, resetCaches };

//# sourceMappingURL=cache.js.map