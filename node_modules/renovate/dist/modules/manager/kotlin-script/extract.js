import { regEx } from "../../../util/regex.js";
import { MavenDatasource } from "../../datasource/maven/index.js";
import { isString, isTruthy } from "@sindresorhus/is";
//#region lib/modules/manager/kotlin-script/extract.ts
const dependsOnRegex = regEx(/@file\s*:\s*DependsOn\s*\(\s*(?<replaceString>"(?<groupId>.+):(?<artifactId>.+):(?<version>.+)")\s*\)/g);
const repositoryRegex = regEx(/@file\s*:\s*Repository\s*\(\s*"(?<repositoryName>.+)"\s*\)/g);
function extractPackageFile(fileContent) {
	const registryUrls = [...fileContent.matchAll(repositoryRegex)].map((match) => match.groups?.repositoryName).filter(isString);
	const matches = [...fileContent.matchAll(dependsOnRegex)].map((m) => m.groups).filter(isTruthy);
	const deps = [];
	for (const match of matches) {
		const dep = {
			currentValue: match.version,
			depName: `${match.groupId}:${match.artifactId}`,
			replaceString: match.replaceString,
			datasource: MavenDatasource.id
		};
		deps.push(dep);
	}
	if (deps.length === 0) return null;
	return {
		deps,
		...registryUrls.length && { registryUrls }
	};
}
//#endregion
export { extractPackageFile };

//# sourceMappingURL=extract.js.map