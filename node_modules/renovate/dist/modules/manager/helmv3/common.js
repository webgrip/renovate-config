import { fromBase64 } from "../../../util/string.js";
import { addSecretForSanitizing } from "../../../util/sanitize.js";
import { logger } from "../../../logger/index.js";
import { coerceArray } from "../../../util/array.js";
import { privateCacheDir } from "../../../util/fs/index.js";
import { ecrRegex, getECRAuthToken } from "../../datasource/docker/ecr.js";
import { quote } from "shlex";
import upath from "upath";
//#region lib/modules/manager/helmv3/common.ts
async function generateLoginCmd(repositoryRule) {
	logger.trace({ repositoryRule }, "Generating Helm registry login command");
	const { hostRule, repository } = repositoryRule;
	const { username, password } = hostRule;
	const loginCMD = "helm registry login";
	if (username !== "AWS" && ecrRegex.test(repository)) {
		logger.trace({ repository }, `Using ecr auth for Helm registry`);
		const [, region] = coerceArray(ecrRegex.exec(repository));
		const auth = await getECRAuthToken(region, hostRule);
		if (!auth) return null;
		const [username, password] = fromBase64(auth).split(":");
		if (!username || !password) return null;
		addSecretForSanitizing(username);
		addSecretForSanitizing(password);
		return `${loginCMD} --username ${quote(username)} --password ${quote(password)} ${quote(repository)}`;
	}
	if (username && password) {
		logger.trace({ repository }, `Using basic auth for Helm registry`);
		const hostPart = repository.split("/")[0];
		const cmd = `${loginCMD} --username ${quote(username)} --password ${quote(password)} ${quote(hostPart)}`;
		logger.trace({ cmd }, "Generated Helm registry login command");
		return cmd;
	}
	return null;
}
function generateHelmEnvs() {
	return {
		HELM_EXPERIMENTAL_OCI: "1",
		HELM_REGISTRY_CONFIG: `${upath.join(privateCacheDir(), "registry.json")}`,
		HELM_REPOSITORY_CONFIG: `${upath.join(privateCacheDir(), "repositories.yaml")}`,
		HELM_REPOSITORY_CACHE: `${upath.join(privateCacheDir(), "repositories")}`
	};
}
//#endregion
export { generateHelmEnvs, generateLoginCmd };

//# sourceMappingURL=common.js.map