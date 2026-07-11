import { FILE_ACCESS_VIOLATION_ERROR } from "../../constants/error-messages.js";
import { GlobalConfig } from "../../config/global.js";
import { logger } from "../../logger/index.js";
import upath from "upath";
//#region lib/util/fs/util.ts
function assertBaseDir(path, allowedDir) {
	if (!path.startsWith(allowedDir)) {
		logger.debug({
			path,
			allowedDir
		}, "Preventing access to file outside allowed directory");
		throw new Error(FILE_ACCESS_VIOLATION_ERROR);
	}
}
function ensurePath(path, key) {
	const baseDir = upath.resolve(GlobalConfig.get(key));
	const fullPath = upath.resolve(upath.isAbsolute(path) ? path : upath.join(baseDir, path));
	assertBaseDir(fullPath, baseDir);
	return fullPath;
}
function ensureLocalPath(path) {
	return ensurePath(path, "localDir");
}
function ensureCachePath(path) {
	return ensurePath(path, "cacheDir");
}
function isValidPath(path, key) {
	const baseDir = upath.resolve(GlobalConfig.get(key));
	return upath.resolve(upath.isAbsolute(path) ? path : upath.join(baseDir, path)).startsWith(baseDir);
}
//#endregion
export { ensureCachePath, ensureLocalPath, isValidPath };

//# sourceMappingURL=util.js.map