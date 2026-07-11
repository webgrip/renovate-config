import { addSecretForSanitizing } from "../../util/sanitize.js";
import { logger } from "../../logger/index.js";
import { isString } from "@sindresorhus/is";
import { GoogleAuth } from "google-auth-library";
//#region lib/modules/datasource/util.ts
const JFROG_ARTIFACTORY_RES_HEADER = "x-jfrog-version";
function isArtifactoryServer(res) {
	return isString(res?.headers[JFROG_ARTIFACTORY_RES_HEADER]);
}
async function getGoogleAuthHostRule() {
	try {
		const accessToken = await new GoogleAuth({ scopes: "https://www.googleapis.com/auth/cloud-platform" }).getAccessToken();
		if (accessToken) {
			addSecretForSanitizing(accessToken);
			return {
				username: "oauth2accesstoken",
				password: accessToken
			};
		} else logger.warn("Could not retrieve access token using google-auth-library getAccessToken");
	} catch (err) {
		if (err.message?.includes("Could not load the default credentials")) return null;
		else throw err;
	}
	return null;
}
async function getGoogleAuthToken() {
	const rule = await getGoogleAuthHostRule();
	if (rule) {
		const token = Buffer.from(`${rule.username}:${rule.password}`).toString("base64");
		addSecretForSanitizing(token);
		return token;
	}
	return null;
}
//#endregion
export { getGoogleAuthHostRule, getGoogleAuthToken, isArtifactoryServer };

//# sourceMappingURL=util.js.map