import { privateCacheDir } from "../../../util/fs/index.js";
import upath from "upath";
import semver from "semver";
//#region lib/modules/manager/kustomize/common.ts
function generateHelmEnvs(config) {
	const cacheDir = privateCacheDir();
	const envs = {
		HELM_REGISTRY_CONFIG: upath.join(cacheDir, "registry.json"),
		HELM_REPOSITORY_CONFIG: upath.join(cacheDir, "repositories.yaml"),
		HELM_REPOSITORY_CACHE: upath.join(cacheDir, "repositories")
	};
	if (config.constraints?.helm && !semver.intersects(config.constraints.helm, ">=3.8.0")) envs.HELM_EXPERIMENTAL_OCI = "1";
	return envs;
}
//#endregion
export { generateHelmEnvs };

//# sourceMappingURL=common.js.map