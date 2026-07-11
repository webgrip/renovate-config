import { GlobalConfig } from "../../../../../../config/global.js";
import { logger } from "../../../../../../logger/index.js";
import { parseUrl } from "../../../../../../util/url.js";
import { find } from "../../../../../../util/host-rules.js";
import { ChangeLogSource } from "../source.js";
//#region lib/workers/repository/update/pr/changelog/github/source.ts
var GitHubChangeLogSource = class extends ChangeLogSource {
	constructor() {
		super("github", "github-tags");
	}
	getAPIBaseUrl(config) {
		const baseUrl = this.getBaseUrl(config);
		return baseUrl.startsWith("https://github.com/") ? "https://api.github.com/" : `${baseUrl}api/v3/`;
	}
	getCompareURL(baseUrl, repository, prevHead, nextHead) {
		return `${baseUrl}${repository}/compare/${prevHead}...${nextHead}`;
	}
	shouldSkipPackage(config) {
		if (config.sourceUrl === "https://github.com/DefinitelyTyped/DefinitelyTyped") {
			logger.trace("No release notes for @types");
			return true;
		}
		return false;
	}
	hasValidToken(config) {
		const sourceUrl = config.sourceUrl;
		const host = parseUrl(sourceUrl)?.host;
		const manager = config.manager;
		const packageName = config.packageName;
		const { token } = find({
			hostType: "github",
			url: sourceUrl.startsWith("https://github.com/") ? "https://api.github.com/" : sourceUrl,
			readOnly: true
		});
		// istanbul ignore if
		if (host && !token) {
			if (host.endsWith(".github.com") || host === "github.com") {
				if (!GlobalConfig.get("githubTokenWarn")) {
					logger.debug({
						manager,
						packageName,
						sourceUrl
					}, "GitHub token warning has been suppressed. Skipping release notes retrieval");
					return { isValid: false };
				}
				logger.warn({
					manager,
					packageName,
					sourceUrl
				}, "No github.com token has been configured. Skipping release notes retrieval");
				return {
					isValid: false,
					error: "MissingGithubToken"
				};
			}
			logger.debug({
				manager,
				packageName,
				sourceUrl
			}, "Repository URL does not match any known github hosts - skipping changelog retrieval");
			return { isValid: false };
		}
		return { isValid: true };
	}
};
//#endregion
export { GitHubChangeLogSource };

//# sourceMappingURL=source.js.map