import { regEx } from "../../../util/regex.js";
import { hasKey } from "../../../util/object.js";
//#region lib/modules/manager/helm-values/util.ts
const parentKeyRe = regEx(/image$/i);
/**
* Type guard to determine whether a given partial Helm values.yaml object potentially
* defines a Helm Docker dependency.
*
* There is no exact standard of how Docker dependencies are defined in Helm
* values.yaml files (as of February 26th 2021), this function defines a
* heuristic based on the most commonly used format in the Helm charts:
*
* image:
*   repository: 'something'
*   tag: v1.0.0
* image:
*   repository: 'something'
*   version: v1.0.0
* renovateImage:
*   repository: 'something'
*   tag: v1.0.0
*/
function matchesHelmValuesDockerHeuristic(parentKey, data) {
	return !!(parentKeyRe.test(parentKey) && data && typeof data === "object" && hasKey("repository", data) && (hasKey("tag", data) || hasKey("version", data)));
}
function matchesHelmValuesInlineImage(parentKey, data) {
	return !!(parentKeyRe.test(parentKey) && data && typeof data === "string");
}
//#endregion
export { matchesHelmValuesDockerHeuristic, matchesHelmValuesInlineImage };

//# sourceMappingURL=util.js.map