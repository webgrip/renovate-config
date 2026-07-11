import { newlineRegex, regEx } from "../../../util/regex.js";
import { logger } from "../../../logger/index.js";
import { findLocalSiblingOrParent, readLocalFile } from "../../../util/fs/index.js";
import { GitTagsDatasource } from "../../datasource/git-tags/index.js";
import { GithubTagsDatasource } from "../../datasource/github-tags/index.js";
import { HexDatasource } from "../../datasource/hex/index.js";
//#region lib/modules/manager/mix/extract.ts
const depSectionRegExp = regEx(/defp\s+deps.*do/g);
const depMatchRegExp = regEx(/{:(?<app>\w+)(\s*,\s*"(?<requirement>[^"]+)")?(\s*,\s*(?<opts>[^}]+))?}/gm);
const gitRegexp = regEx(/git:\s*"(?<value>[^"]+)"/);
const githubRegexp = regEx(/github:\s*"(?<value>[^"]+)"/);
const refRegexp = regEx(/ref:\s*"(?<value>[^"]+)"/);
const branchOrTagRegexp = regEx(/(?:branch|tag):\s*"(?<value>[^"]+)"/);
const organizationRegexp = regEx(/organization:\s*"(?<value>[^"]+)"/);
const commentMatchRegExp = regEx(/#.*$/);
const lockedVersionRegExp = regEx(/^\s+"(?<app>\w+)".*?"(?<lockedVersion>\d+\.\d+\.\d+)"/);
const hexRegexp = regEx(/hex:\s*(?:"(?<strValue>[^"]+)"|:(?<atomValue>\w+))/);
const onlyValueRegexp = regEx(/only:\s*(?<only>\[[^\]]*\]|:\w+)/);
const onlyEnvironmentsRegexp = regEx(/:(\w+)/gm);
async function extractPackageFile(content, packageFile) {
	logger.trace(`mix.extractPackageFile(${packageFile})`);
	const deps = /* @__PURE__ */ new Map();
	const contentArr = content.split(newlineRegex).map((line) => line.replace(commentMatchRegExp, ""));
	for (let lineNumber = 0; lineNumber < contentArr.length; lineNumber += 1) if (contentArr[lineNumber].match(depSectionRegExp)) {
		let depBuffer = "";
		do {
			depBuffer += `${contentArr[lineNumber]}\n`;
			lineNumber += 1;
		} while (contentArr[lineNumber].trim() !== "end");
		let depMatchGroups = depMatchRegExp.exec(depBuffer)?.groups;
		while (depMatchGroups) {
			const { app, requirement, opts } = depMatchGroups;
			const github = githubRegexp.exec(opts)?.groups?.value;
			const git = gitRegexp.exec(opts)?.groups?.value;
			const ref = refRegexp.exec(opts)?.groups?.value;
			const branchOrTag = branchOrTagRegexp.exec(opts)?.groups?.value;
			const organization = organizationRegexp.exec(opts)?.groups?.value;
			const hexGroups = hexRegexp.exec(opts)?.groups;
			const hex = hexGroups?.strValue ?? hexGroups?.atomValue;
			const onlyValue = onlyValueRegexp.exec(opts)?.groups?.only;
			const onlyEnvironments = [];
			let match;
			if (onlyValue) while ((match = onlyEnvironmentsRegexp.exec(onlyValue)) !== null) onlyEnvironments.push(match[1]);
			const dep = {
				depName: app,
				depType: "prod"
			};
			if (git ?? github) {
				dep.currentDigest = ref;
				dep.currentValue = branchOrTag;
				dep.datasource = git ? GitTagsDatasource.id : GithubTagsDatasource.id;
				dep.packageName = git ?? github;
			} else {
				dep.currentValue = requirement;
				dep.datasource = HexDatasource.id;
				if (organization) dep.packageName = `${app}:${organization}`;
				else if (hex) dep.packageName = hex;
				else dep.packageName = app;
				if (requirement?.startsWith("==")) dep.currentVersion = requirement.replace(regEx(/^==\s*/), "");
			}
			if (onlyValue !== void 0 && !onlyEnvironments.includes("prod")) dep.depType = "dev";
			deps.set(app, dep);
			logger.trace({ dep }, `setting ${app}`);
			depMatchGroups = depMatchRegExp.exec(depBuffer)?.groups;
		}
	}
	const lockFileName = await findLocalSiblingOrParent(packageFile, "mix.lock") ?? "mix.lock";
	const lockFileContent = await readLocalFile(lockFileName, "utf8");
	if (lockFileContent) {
		const lockFileLines = lockFileContent.split(newlineRegex).slice(1, -1);
		for (const line of lockFileLines) {
			const groups = lockedVersionRegExp.exec(line)?.groups;
			if (groups?.app && groups?.lockedVersion) {
				const dep = deps.get(groups.app);
				if (!dep) continue;
				dep.lockedVersion = groups.lockedVersion;
				logger.trace(`Found ${groups.lockedVersion} for ${groups.app}`);
			}
		}
	}
	const depsArray = Array.from(deps.values());
	if (depsArray.length === 0) return null;
	return {
		deps: depsArray,
		lockFiles: lockFileContent ? [lockFileName] : void 0
	};
}
//#endregion
export { extractPackageFile };

//# sourceMappingURL=extract.js.map