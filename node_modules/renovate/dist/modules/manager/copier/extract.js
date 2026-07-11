import { regEx } from "../../../util/regex.js";
import { logger } from "../../../logger/index.js";
import { GitTagsDatasource } from "../../datasource/git-tags/index.js";
import { CopierAnswersFile } from "./schema.js";
//#region lib/modules/manager/copier/extract.ts
const gitPrefixRegex = regEx(/^git\+/);
/**
* Copier supports `git+https://` and `git+ssh://` URL prefixes,
* but git itself does not understand them.
* Strip the `git+` prefix so the URL can be used with git directly.
*/
function stripGitPrefix(url) {
	return url.replace(gitPrefixRegex, "");
}
function extractPackageFile(content, packageFile) {
	let parsed;
	try {
		parsed = CopierAnswersFile.parse(content);
	} catch (err) {
		logger.debug({
			err,
			packageFile
		}, `Parsing Copier answers YAML failed`);
		return null;
	}
	return { deps: [{
		datasource: GitTagsDatasource.id,
		depName: parsed._src_path,
		packageName: stripGitPrefix(parsed._src_path),
		depType: "template",
		currentValue: parsed._commit
	}] };
}
//#endregion
export { extractPackageFile };

//# sourceMappingURL=extract.js.map