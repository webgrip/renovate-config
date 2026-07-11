import { semver_coerced_exports } from "./semver-coerced/index.js";
import api from "./api.js";
import { Versioning } from "./schema.js";
//#region lib/modules/versioning/index.ts
const defaultVersioning = semver_coerced_exports;
const getVersioningList = () => Array.from(api.keys());
/**
* Get versioning map. Can be used to dynamically add new versioning type
*/
const getVersionings = () => api;
function get(versioning) {
	const res = Versioning.safeParse(versioning ?? defaultVersioning.id);
	if (!res.success) {
		const [issue] = res.error.issues;
		if (issue && issue.code === "custom" && issue.params?.error) throw issue.params.error;
		// istanbul ignore next: should never happen
		throw res.error;
	}
	return res.data;
}
//#endregion
export { defaultVersioning, get, getVersioningList, getVersionings };

//# sourceMappingURL=index.js.map