import { RegExpVersioningApi } from "../regex/index.js";
//#region lib/modules/versioning/kubernetes-api/index.ts
const id = "kubernetes-api";
const api = new class KubernetesApiVersioningApi extends RegExpVersioningApi {
	static versionRegex = "^(?:(?<compatibility>\\S+)/)?v(?<major>\\d+)(?<prerelease>(?:alpha|beta)\\d+)?$";
	constructor() {
		super(KubernetesApiVersioningApi.versionRegex);
	}
}();
//#endregion
export { api as default, id };

//# sourceMappingURL=index.js.map