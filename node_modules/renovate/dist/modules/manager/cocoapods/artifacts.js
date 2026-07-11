import "../../../constants/error-messages.js";
import { newlineRegex, regEx } from "../../../util/regex.js";
import { logger } from "../../../logger/index.js";
import { coerceArray } from "../../../util/array.js";
import { ensureCacheDir, getSiblingFileName, readLocalFile, writeLocalFile } from "../../../util/fs/index.js";
import { exec } from "../../../util/exec/index.js";
import { getRepoStatus } from "../../../util/git/index.js";
import { quote } from "shlex";
import upath from "upath";
//#region lib/modules/manager/cocoapods/artifacts.ts
const pluginRegex = regEx(`^\\s*plugin\\s*(['"])(?<plugin>[^'"]+)(['"])`);
function getPluginCommands(content) {
	const result = /* @__PURE__ */ new Set();
	content.split(newlineRegex).forEach((line) => {
		const match = pluginRegex.exec(line);
		if (match?.groups) {
			const { plugin } = match.groups;
			result.add(`gem install ${quote(plugin)}`);
		}
	});
	return [...result];
}
async function updateArtifacts({ packageFileName, updatedDeps, newPackageFileContent }) {
	logger.debug(`cocoapods.getArtifacts(${packageFileName})`);
	if (updatedDeps.length < 1) {
		logger.debug("CocoaPods: empty update - returning null");
		return null;
	}
	const lockFileName = getSiblingFileName(packageFileName, "Podfile.lock");
	try {
		await writeLocalFile(packageFileName, newPackageFileContent);
	} catch (err) {
		logger.warn({ err }, "Podfile could not be written");
		return [{ artifactError: {
			fileName: lockFileName,
			stderr: err.message
		} }];
	}
	const existingLockFileContent = await readLocalFile(lockFileName, "utf8");
	if (!existingLockFileContent) {
		logger.debug(`Lockfile not found: ${lockFileName}`);
		return null;
	}
	const cocoapods = regEx(/^COCOAPODS: (?<cocoapodsVersion>.*)$/m).exec(existingLockFileContent)?.groups?.cocoapodsVersion ?? null;
	const cmd = [...getPluginCommands(newPackageFileContent), "pod install"];
	const execOptions = {
		cwdFile: packageFileName,
		extraEnv: { CP_HOME_DIR: await ensureCacheDir("cocoapods") },
		docker: {},
		toolConstraints: [{ toolName: "ruby" }, {
			toolName: "cocoapods",
			constraint: cocoapods
		}]
	};
	try {
		await exec(cmd, execOptions);
	} catch (err) {
		// istanbul ignore if
		if (err.message === "temporary-error") throw err;
		return [{ artifactError: {
			fileName: lockFileName,
			stderr: err.stderr ?? err.stdout ?? err.message
		} }];
	}
	const status = await getRepoStatus();
	if (!status.modified.includes(lockFileName)) return null;
	logger.debug(`Returning updated lockfile: ${lockFileName}`);
	const res = [{ file: {
		type: "addition",
		path: lockFileName,
		contents: await readLocalFile(lockFileName)
	} }];
	const podsDir = upath.join(upath.dirname(packageFileName), "Pods");
	if (await readLocalFile(upath.join(podsDir, "Manifest.lock"), "utf8")) {
		for (const f of status.modified.concat(status.not_added)) if (f.startsWith(podsDir)) res.push({ file: {
			type: "addition",
			path: f,
			contents: await readLocalFile(f)
		} });
		for (const f of coerceArray(status.deleted)) res.push({ file: {
			type: "deletion",
			path: f
		} });
	}
	return res;
}
//#endregion
export { updateArtifacts };

//# sourceMappingURL=artifacts.js.map