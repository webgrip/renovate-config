import { ChangeLogSource } from "../source.js";
//#region lib/workers/repository/update/pr/changelog/forgejo/source.ts
var ForgejoChangeLogSource = class extends ChangeLogSource {
	constructor() {
		super("forgejo", "forgejo-tags");
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
export { ForgejoChangeLogSource };

//# sourceMappingURL=source.js.map