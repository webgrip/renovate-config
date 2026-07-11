import { ChangeLogSource } from "../source.js";
//#region lib/workers/repository/update/pr/changelog/gitea/source.ts
var GiteaChangeLogSource = class extends ChangeLogSource {
	constructor() {
		super("gitea", "gitea-tags");
	}
	getAPIBaseUrl(config) {
		return `${this.getBaseUrl(config)}api/v1/`;
	}
	getCompareURL(baseUrl, repository, prevHead, nextHead) {
		return `${baseUrl}${repository}/compare/${prevHead}...${nextHead}`;
	}
	hasValidRepository(repository) {
		return repository.split("/").length === 2;
	}
};
//#endregion
export { GiteaChangeLogSource };

//# sourceMappingURL=source.js.map