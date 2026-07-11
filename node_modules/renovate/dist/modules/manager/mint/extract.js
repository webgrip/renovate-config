import { newlineRegex } from "../../../util/regex.js";
import { GitTagsDatasource } from "../../datasource/git-tags/index.js";
//#region lib/modules/manager/mint/extract.ts
function extractPackageFile(content) {
	const deps = [];
	for (const line of content.split(newlineRegex).map((s) => s.trim())) {
		if (line === "") continue;
		if (line.startsWith("#")) continue;
		if (line.includes("#")) {
			const [uncommentLine] = line.split("#");
			deps.push(handleDepInMintfile(uncommentLine));
			continue;
		}
		deps.push(handleDepInMintfile(line));
	}
	return deps.length ? { deps } : null;
}
function handleDepInMintfile(line) {
	if (!line.includes("@")) return {
		depName: line,
		skipReason: "unspecified-version"
	};
	const [depName, currentVersion] = line.split("@").map((s) => s.trim());
	return {
		depName,
		currentValue: currentVersion,
		datasource: GitTagsDatasource.id,
		packageName: `https://github.com/${depName}.git`
	};
}
//#endregion
export { extractPackageFile };

//# sourceMappingURL=extract.js.map