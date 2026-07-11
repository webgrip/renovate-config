import { ChangeLogSource } from "../source.js";
//#region lib/workers/repository/update/pr/changelog/bitbucket/source.ts
var BitbucketChangeLogSource = class extends ChangeLogSource {
	constructor() {
		super("bitbucket", "bitbucket-tags");
	}
	getAPIBaseUrl(_config) {
		return "https://api.bitbucket.org/";
	}
	getCompareURL(baseUrl, repository, prevHead, nextHead) {
		return `${baseUrl}${repository}/branches/compare/${nextHead}%0D${prevHead}`;
	}
};
//#endregion
export { BitbucketChangeLogSource };

//# sourceMappingURL=source.js.map