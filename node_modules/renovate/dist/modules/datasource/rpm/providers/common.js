import { logger } from "../../../../logger/index.js";
import { toSha256 } from "../../../../util/hash.js";
import { cachePathExists, createCacheReadStream, createCacheWriteStream, ensureCacheDir, pipeline, renameCacheFile, rmCache, statCacheFile } from "../../../../util/fs/index.js";
import { acquireLock } from "../../../../util/mutex.js";
import { randomUUID } from "node:crypto";
import upath from "upath";
import { createGunzip } from "node:zlib";
//#region lib/modules/datasource/rpm/providers/common.ts
const cacheSubDir = "rpm";
function formatRpmVersion(ver, rel) {
	if (ver === void 0 || ver === null) return null;
	const version = String(ver);
	if (rel === void 0 || rel === null) return version;
	return `${version}-${String(rel)}`;
}
function buildReleaseResult(versions) {
	const uniqueVersions = [...new Set(versions)];
	if (uniqueVersions.length === 0) return null;
	return { releases: uniqueVersions.map((version) => ({ version })) };
}
async function getFileCreationTime(filePath) {
	return (await statCacheFile(filePath))?.ctime;
}
async function checkIfModified(url, lastDownloadTimestamp, http) {
	const options = { headers: { "If-Modified-Since": lastDownloadTimestamp.toUTCString() } };
	try {
		return (await http.head(url, options)).statusCode !== 304;
	} catch (err) {
		logger.warn({
			err,
			lastDownloadTimestamp,
			url
		}, "Could not determine if metadata file is modified since last download");
		return true;
	}
}
async function downloadGzipFile(url, compressedFile, http, lastDownloadTimestamp) {
	let needsToDownload = true;
	if (lastDownloadTimestamp) needsToDownload = await checkIfModified(url, lastDownloadTimestamp, http);
	if (!needsToDownload) {
		logger.debug(`No need to download ${url}, file is up to date.`);
		return false;
	}
	await pipeline(http.stream(url), createCacheWriteStream(compressedFile));
	const compressedStats = await statCacheFile(compressedFile);
	if (!compressedStats || compressedStats.size === 0) {
		logger.debug(`Empty response body from getting ${url}.`);
		throw new Error(`Empty response body from getting ${url}.`);
	}
	return true;
}
async function extractGzipFile(compressedFile, extractedFile) {
	await pipeline(createCacheReadStream(compressedFile), createGunzip(), createCacheWriteStream(extractedFile));
}
async function getCachedGunzippedFile(http, url, extension) {
	const releaseLock = await acquireLock(`gunzipped-file:${url}:${extension}`, "datasource-rpm");
	try {
		const cacheDir = await ensureCacheDir(cacheSubDir);
		const urlHash = toSha256(url);
		const extractedFile = upath.join(cacheDir, `${urlHash}.${extension}`);
		let lastTimestamp = await getFileCreationTime(extractedFile);
		const compressedFile = upath.join(cacheDir, `${randomUUID()}_${urlHash}.gz`);
		const extractedTempFile = upath.join(cacheDir, `${randomUUID()}_${urlHash}.${extension}`);
		try {
			if (await downloadGzipFile(url, compressedFile, http, lastTimestamp) || !lastTimestamp) try {
				await extractGzipFile(compressedFile, extractedTempFile);
				await renameCacheFile(extractedTempFile, extractedFile);
				lastTimestamp = await getFileCreationTime(extractedFile);
			} catch (err) {
				logger.warn({
					compressedFile,
					err,
					extension,
					extractedFile,
					url
				}, "Failed to extract RPM metadata file from compressed file");
			}
			if (!lastTimestamp) throw new Error("Missing metadata in extracted RPM metadata file!");
			return extractedFile;
		} finally {
			if (await cachePathExists(compressedFile)) await rmCache(compressedFile);
			if (await cachePathExists(extractedTempFile)) await rmCache(extractedTempFile);
		}
	} finally {
		releaseLock();
	}
}
//#endregion
export { buildReleaseResult, formatRpmVersion, getCachedGunzippedFile };

//# sourceMappingURL=common.js.map