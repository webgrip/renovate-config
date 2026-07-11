import { regEx } from "../../../util/regex.js";
import { logger } from "../../../logger/index.js";
import { getSiblingFileName, localPathExists, readLocalFile } from "../../../util/fs/index.js";
//#region lib/modules/manager/bundler/common.ts
const delimiters = ["\"", "'"];
function extractRubyVersion(txt) {
	const rubyMatch = regEx(/^ruby\s+("[^"]+"|'[^']+')\s*$/gm).exec(txt);
	if (rubyMatch?.length !== 2) return null;
	const quotedVersion = rubyMatch[1];
	return quotedVersion.substring(1, quotedVersion.length - 1);
}
async function getRubyConstraint(updateArtifact) {
	const { packageFileName, config, newPackageFileContent } = updateArtifact;
	const { constraints = {} } = config;
	const { ruby } = constraints;
	if (ruby) {
		logger.debug("Using ruby constraint from config");
		return ruby;
	} else {
		const rubyMatch = extractRubyVersion(newPackageFileContent);
		if (rubyMatch) {
			logger.debug("Using ruby version from gemfile");
			return rubyMatch;
		}
		for (const file of [".ruby-version", ".tool-versions"]) {
			const rubyVersion = (await readLocalFile(getSiblingFileName(packageFileName, file), "utf8"))?.match(regEx(/^(?:ruby(?:-|\s+))?(\d[\d.]*)/m))?.[1];
			if (rubyVersion) {
				logger.debug(`Using ruby version specified in ${file}`);
				return rubyVersion;
			}
		}
		const lockFile = await getLockFilePath(packageFileName);
		if (lockFile) {
			const rubyVersion = (await readLocalFile(lockFile, "utf8"))?.match(regEx(/^ {3}ruby (\d[\d.]*)(?:[a-z]|\s|$)/m))?.[1];
			if (rubyVersion) {
				logger.debug(`Using ruby version specified in lock file`);
				return rubyVersion;
			}
		}
	}
	return null;
}
function getBundlerConstraint(updateArtifact, existingLockFileContent) {
	const { config } = updateArtifact;
	const { constraints = {} } = config;
	const { bundler } = constraints;
	if (bundler) {
		logger.debug("Using bundler constraint from config");
		return bundler;
	} else {
		const bundledWith = regEx(/\nBUNDLED WITH\n\s+(.*?)(\n|$)/).exec(existingLockFileContent);
		if (bundledWith) {
			logger.debug("Using bundler version specified in lockfile");
			return bundledWith[1];
		}
	}
	return null;
}
async function getLockFilePath(packageFilePath) {
	const lockFilePath = await localPathExists(`${packageFilePath}.lock`) ? `${packageFilePath}.lock` : `Gemfile.lock`;
	logger.debug(`Lockfile for ${packageFilePath} found in ${lockFilePath}`);
	return lockFilePath;
}
//#endregion
export { delimiters, extractRubyVersion, getBundlerConstraint, getLockFilePath, getRubyConstraint };

//# sourceMappingURL=common.js.map