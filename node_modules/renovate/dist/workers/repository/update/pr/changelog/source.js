import { regEx } from "../../../../../util/regex.js";
import { logger } from "../../../../../logger/index.js";
import { parseUrl, trimSlashes } from "../../../../../util/url.js";
import { get } from "../../../../../modules/versioning/index.js";
import { get as get$1, set } from "../../../../../util/cache/package/index.js";
import { getPkgReleases } from "../../../../../modules/datasource/index.js";
import { memoize } from "../../../../../util/memoize.js";
import { slugifyUrl } from "./common.js";
import { addReleaseNotes } from "./release-notes.js";
import { getInRangeReleases } from "./releases.js";
import { isEmptyArray, isFalsy, isNonEmptyString, isNullOrUndefined } from "@sindresorhus/is";
//#region lib/workers/repository/update/pr/changelog/source.ts
var ChangeLogSource = class {
	cacheNamespace;
	platform;
	datasource;
	constructor(platform, datasource) {
		this.platform = platform;
		this.datasource = datasource;
		this.cacheNamespace = `changelog-${platform}-release`;
	}
	async getAllTags(endpoint, repository) {
		const tags = (await getPkgReleases({
			registryUrls: [endpoint],
			datasource: this.datasource,
			packageName: repository,
			versioning: "regex:(?<major>\\d+)(\\.(?<minor>\\d+))?(\\.(?<patch>\\d+))?"
		}))?.releases;
		if (isNullOrUndefined(tags) || isEmptyArray(tags)) {
			logger.debug(`No ${this.datasource} tags found for repository: ${repository}`);
			return [];
		}
		return tags.map(({ version }) => version);
	}
	async getChangeLogJSON(config) {
		logger.trace(`getChangeLogJSON for ${this.platform}`);
		const versioning = config.versioning;
		const currentVersion = config.currentVersion;
		const newVersion = config.newVersion;
		const sourceUrl = config.sourceUrl;
		const packageName = config.packageName;
		const depName = config.depName;
		const sourceDirectory = config.sourceDirectory;
		const versioningApi = get(versioning);
		if (this.shouldSkipPackage(config)) return null;
		const baseUrl = this.getBaseUrl(config);
		const apiBaseUrl = this.getAPIBaseUrl(config);
		const repository = this.getRepositoryFromUrl(config);
		const tokenResponse = this.hasValidToken(config);
		if (!tokenResponse.isValid) {
			if (tokenResponse.error) return { error: tokenResponse.error };
			return null;
		}
		if (isFalsy(this.hasValidRepository(repository))) {
			logger.debug(`Invalid ${this.platform} URL found: ${sourceUrl}`);
			return null;
		}
		const releases = config.releases ?? await getInRangeReleases(config);
		if (!releases?.length) {
			logger.debug("No releases");
			return null;
		}
		const validReleases = [...releases].filter((release) => versioningApi.isVersion(release.version)).sort((a, b) => versioningApi.sortVersions(a.version, b.version));
		if (validReleases.length < 2) {
			logger.debug(`Not enough valid releases for dep ${depName} (${packageName})`);
			return null;
		}
		const changelogReleases = [];
		const inRange = (v) => versioningApi.isGreaterThan(v, currentVersion) && !versioningApi.isGreaterThan(v, newVersion);
		const getTags = memoize(() => this.getAllTags(apiBaseUrl, repository));
		for (let i = 1; i < validReleases.length; i += 1) {
			const prev = validReleases[i - 1];
			const next = validReleases[i];
			if (!inRange(next.version)) continue;
			let release = await get$1(this.cacheNamespace, this.getCacheKey(sourceUrl, packageName, prev.version, next.version));
			if (!release) {
				release = {
					version: next.version,
					date: next.releaseTimestamp,
					gitRef: next.gitRef,
					changes: [],
					compare: {}
				};
				const tags = await getTags();
				const prevHead = this.getRef(versioningApi, packageName, depName, prev, tags);
				const nextHead = this.getRef(versioningApi, packageName, depName, next, tags);
				if (isNonEmptyString(prevHead) && isNonEmptyString(nextHead)) release.compare.url = this.getCompareURL(baseUrl, repository, prevHead, nextHead);
				await set(this.cacheNamespace, this.getCacheKey(sourceUrl, packageName, prev.version, next.version), release, 55);
			}
			changelogReleases.unshift(release);
		}
		let res = {
			project: {
				apiBaseUrl,
				baseUrl,
				type: this.platform,
				repository,
				sourceUrl,
				sourceDirectory,
				packageName,
				depName
			},
			versions: changelogReleases
		};
		res = await addReleaseNotes(res, config);
		return res;
	}
	findTagOfRelease(versioningApi, packageName, depName, depNewVersion, tags) {
		const releaseRegexPrefix = `^(?:${packageName}|${depName}|release)[@_-]v?`;
		const regex = regEx(releaseRegexPrefix, void 0, false);
		const exactReleaseRegex = regEx(`${releaseRegexPrefix}${depNewVersion}`);
		const exactTagsList = tags.filter((tag) => {
			return exactReleaseRegex.test(tag);
		});
		return (exactTagsList.length ? exactTagsList : tags).filter((tag) => versioningApi.isVersion(tag.replace(regex, ""))).find((tag) => versioningApi.equals(tag.replace(regex, ""), depNewVersion));
	}
	getRef(versioningApi, packageName, depName, release, tags) {
		const tagName = this.findTagOfRelease(versioningApi, packageName, depName, release.version, tags);
		if (isNonEmptyString(tagName)) return tagName;
		if (isNonEmptyString(release.gitRef)) return release.gitRef;
		return null;
	}
	getCacheKey(sourceUrl, packageName, prev, next) {
		return `${slugifyUrl(sourceUrl)}:${packageName}:${prev}:${next}`;
	}
	getBaseUrl(config) {
		const parsedUrl = parseUrl(config.sourceUrl);
		if (isNullOrUndefined(parsedUrl)) return "";
		return `${parsedUrl.protocol.replace(regEx(/^git\+/), "")}//${parsedUrl.host}/`;
	}
	getRepositoryFromUrl(config) {
		const parsedUrl = parseUrl(config.sourceUrl);
		if (isNullOrUndefined(parsedUrl)) return "";
		const pathname = parsedUrl.pathname;
		return trimSlashes(pathname).replace(regEx(/\.git$/), "");
	}
	hasValidToken(_config) {
		return { isValid: true };
	}
	shouldSkipPackage(_config) {
		return false;
	}
	hasValidRepository(repository) {
		return repository.split("/").length === 2;
	}
};
//#endregion
export { ChangeLogSource };

//# sourceMappingURL=source.js.map