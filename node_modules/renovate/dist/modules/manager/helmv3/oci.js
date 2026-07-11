import { isNullOrUndefined, isString } from "@sindresorhus/is";
//#region lib/modules/manager/helmv3/oci.ts
function isOCIRegistry(repository) {
	if (isNullOrUndefined(repository)) return false;
	return (isString(repository) ? repository : repository.repository).startsWith("oci://");
}
function removeOCIPrefix(repository) {
	if (isOCIRegistry(repository)) return repository.replace("oci://", "");
	return repository;
}
//#endregion
export { isOCIRegistry, removeOCIPrefix };

//# sourceMappingURL=oci.js.map