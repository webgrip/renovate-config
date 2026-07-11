import { logger } from "../../../logger/index.js";
import { getLockedVersion } from "./lockfile.js";
import { MiseLockFile } from "./schema.js";
//#region lib/modules/manager/mise/update-locked.ts
function updateLockedDependency(config) {
	const { depName, newVersion, lockFile, lockFileContent } = config;
	logger.debug(`mise.updateLockedDependency: ${depName} -> ${newVersion} [${lockFile}]`);
	if (!depName || !lockFileContent) return { status: "unsupported" };
	try {
		const parsed = MiseLockFile.safeParse(lockFileContent);
		if (!parsed.success) return { status: "unsupported" };
		if (getLockedVersion(parsed.data, depName) === newVersion) return { status: "already-updated" };
		return { status: "unsupported" };
	} catch (err) {
		logger.debug({ err }, "mise.updateLockedDependency() error");
		return { status: "update-failed" };
	}
}
//#endregion
export { updateLockedDependency };

//# sourceMappingURL=update-locked.js.map