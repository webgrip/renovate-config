import { RegExpVersioningApi } from "../regex/index.js";
//#region lib/modules/versioning/aws-eks-addon/index.ts
const id = "aws-eks-addon";
const api = new class AwsEKSAddonVersioningApi extends RegExpVersioningApi {
	static versionRegex = "^v?(?<major>\\d+)\\.(?<minor>\\d+)\\.(?<patch>\\d+)(?<compatibility>-eksbuild\\.)(?<build>\\d+)$";
	constructor() {
		super(AwsEKSAddonVersioningApi.versionRegex);
	}
}();
//#endregion
export { api as default, id };

//# sourceMappingURL=index.js.map