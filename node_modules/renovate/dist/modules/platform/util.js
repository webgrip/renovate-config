import { hash } from "../../util/hash.js";
//#region lib/modules/platform/util.ts
function repoFingerprint(repoId, endpoint) {
	return hash(endpoint ? `${endpoint}::${repoId}` : `${repoId}`);
}
function getNewBranchName(branchName) {
	if (branchName && !branchName.startsWith("refs/heads/")) return `refs/heads/${branchName}`;
	return branchName;
}
//#endregion
export { getNewBranchName, repoFingerprint };

//# sourceMappingURL=util.js.map