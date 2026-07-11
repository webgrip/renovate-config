import { regEx } from "../../../../../../util/regex.js";
import { parseUrl } from "../../../../../../util/url.js";
import { ChangeLogSource } from "../source.js";
//#region lib/workers/repository/update/pr/changelog/bitbucket-server/source.ts
const subfolderRegex = regEx("(?<subfolder>.+/)(?:projects|scm)/");
const gitUrlRegex = regEx("/(?<project>[^/]+)/(?<repo>[^/]+)\\.git$");
const webUrlRegex = regEx("/projects/(?<project>[^/]+)/repos/(?<repo>[^/]+)");
var BitbucketServerChangeLogSource = class extends ChangeLogSource {
	constructor() {
		super("bitbucket-server", "bitbucket-server-tags");
	}
	getBaseUrl(config) {
		const parsedUrl = parseUrl(config.sourceUrl);
		if (parsedUrl?.host) {
			const protocol = parsedUrl.protocol.replace(regEx(/^git\+/), "");
			const subfolder = subfolderRegex.exec(parsedUrl.pathname)?.groups?.subfolder ?? "/";
			return `${protocol}//${parsedUrl.host}${subfolder}`;
		}
		return "";
	}
	getAPIBaseUrl(config) {
		return `${this.getBaseUrl(config)}rest/api/1.0/`;
	}
	getCompareURL(baseUrl, repository, prevHead, nextHead) {
		const [projectKey, repositorySlug] = repository.split("/");
		return `${baseUrl}projects/${projectKey}/repos/${repositorySlug}/compare/commits?sourceBranch=${nextHead}&targetBranch=${prevHead}`;
	}
	getRepositoryFromUrl(config) {
		const parsedUrl = parseUrl(config.sourceUrl);
		if (parsedUrl) {
			const match = (parsedUrl.pathname.endsWith(".git") ? gitUrlRegex : webUrlRegex).exec(parsedUrl.pathname);
			if (match?.groups) return `${match.groups.project}/${match.groups.repo}`;
		}
		return "";
	}
};
//#endregion
export { BitbucketServerChangeLogSource };

//# sourceMappingURL=source.js.map