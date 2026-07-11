import { ChangeLogSource } from "../source.js";
//#region lib/workers/repository/update/pr/changelog/gitlab/source.ts
var GitLabChangeLogSource = class extends ChangeLogSource {
	constructor() {
		super("gitlab", "gitlab-tags");
	}
	getAPIBaseUrl(config) {
		return `${this.getBaseUrl(config)}api/v4/`;
	}
	getCompareURL(baseUrl, repository, prevHead, nextHead) {
		return `${baseUrl}${repository}/compare/${prevHead}...${nextHead}`;
	}
	hasValidRepository(repository) {
		return repository.split("/").length >= 2;
	}
};
//#endregion
export { GitLabChangeLogSource };

//# sourceMappingURL=source.js.map