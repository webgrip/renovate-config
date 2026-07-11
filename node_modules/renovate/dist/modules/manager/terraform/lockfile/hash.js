import { logger } from "../../../../logger/index.js";
import { coerceArray, deduplicateArray, isNotNullOrUndefined } from "../../../../util/array.js";
import { cachePathIsFile, createCacheWriteStream, ensureCacheDir, listCacheDir, pipeline, readCacheFile, rmCache } from "../../../../util/fs/index.js";
import { withCache } from "../../../../util/cache/package/with-cache.js";
import { Http } from "../../../../util/http/index.js";
import { map } from "../../../../util/promises.js";
import { TerraformProviderDatasource } from "../../../datasource/terraform-provider/index.js";
import crypto from "node:crypto";
import upath from "upath";
import AdmZip from "adm-zip";
//#region lib/modules/manager/terraform/lockfile/hash.ts
var TerraformProviderHash = class TerraformProviderHash {
	static http = new Http(TerraformProviderDatasource.id);
	static terraformDatasource = new TerraformProviderDatasource();
	static hashCacheTTL = 10080;
	static async hashElementList(basePath, fileSystemEntries) {
		const rootHash = crypto.createHash("sha256");
		for (const entryPath of fileSystemEntries) {
			const absolutePath = upath.resolve(basePath, entryPath);
			if (!await cachePathIsFile(absolutePath)) continue;
			const hash = crypto.createHash("sha256");
			const fileBuffer = await readCacheFile(absolutePath);
			hash.update(fileBuffer);
			const line = `${hash.digest("hex")}  ${upath.normalize(entryPath)}\n`;
			rootHash.update(line);
		}
		return rootHash.digest("base64");
	}
	/**
	* This is a reimplementation of the Go H1 hash algorithm found at https://github.com/golang/mod/blob/master/sumdb/dirhash/hash.go
	* The package provides two function HashDir and HashZip where the first is for hashing the contents of a directory
	* and the second for doing the same but implicitly extracting the contents first.
	*
	* The problem starts with that there is a bug which leads to the fact that HashDir and HashZip do not return the same
	* hash if there are folders inside the content which should be hashed.
	*
	* In a folder structure such as
	* .
	* ├── Readme.md
	* └── readme-assets/
	*     └── image.jpg
	*
	* HashDir will create a list of following entries which in turn will hash again
	* aaaaaaaaaaa  Readme.md\n
	* ccccccccccc  readme-assets/image.jpg\n
	*
	* HashZip in contrast will not filter out the directory itself but rather includes it in the hash list
	* aaaaaaaaaaa  Readme.md\n
	* bbbbbbbbbbb  readme-assets/\n
	* ccccccccccc  readme-assets/image.jpg\n
	*
	* As the resulting string is used to generate the final hash it will differ based on which function has been used.
	* The issue is tracked here: https://github.com/golang/go/issues/53448
	*
	* This implementation follows the intended implementation and filters out folder entries.
	* Terraform seems NOT to use HashZip for provider validation, but rather extracts it and then do the hash calculation
	* even as both are set up in their code base.
	* https://github.com/hashicorp/terraform/blob/3fdfbd69448b14a4982b3c62a5d36835956fcbaa/internal/getproviders/hash.go#L283-L305
	*
	* @param zipFilePath path to the zip file
	* @param extractPath path to where to temporarily extract the data
	*/
	static async hashOfZipContent(zipFilePath, extractPath) {
		new AdmZip(zipFilePath).extractAllTo(extractPath);
		const hash = await this.hashOfDir(extractPath);
		await rmCache(extractPath);
		return hash;
	}
	static async hashOfDir(dirPath) {
		const sortedFileSystemObjects = (await listCacheDir(dirPath, { recursive: true })).sort();
		return await TerraformProviderHash.hashElementList(dirPath, sortedFileSystemObjects);
	}
	static async _calculateSingleHash(build, cacheDir) {
		const downloadFileName = upath.join(cacheDir, build.filename);
		const extractPath = upath.join(cacheDir, "extract", build.filename);
		logger.trace(`Downloading archive and generating hash for ${build.name}-${build.version}...`);
		const startTime = Date.now();
		const readStream = TerraformProviderHash.http.stream(build.url);
		const writeStream = createCacheWriteStream(downloadFileName);
		try {
			await pipeline(readStream, writeStream);
			const hash = await this.hashOfZipContent(downloadFileName, extractPath);
			logger.debug(`Hash generation for ${build.url} took ${Date.now() - startTime}ms for ${build.name}-${build.version}`);
			return hash;
		} finally {
			await rmCache(downloadFileName);
		}
	}
	static calculateSingleHash(build, cacheDir) {
		return withCache({
			namespace: `terraform-provider-hash`,
			key: `calculateSingleHash:${build.url}`,
			ttlMinutes: TerraformProviderHash.hashCacheTTL
		}, () => TerraformProviderHash._calculateSingleHash(build, cacheDir));
	}
	static async calculateHashScheme1Hashes(builds) {
		logger.debug(`Calculating hashes for ${builds.length} builds`);
		const cacheDir = await ensureCacheDir("terraform");
		return map(builds, (build) => this.calculateSingleHash(build, cacheDir), { concurrency: 4 });
	}
	static async createHashes(registryURL, repository, version) {
		logger.debug(`Creating hashes for ${repository}@${version} (${registryURL})`);
		const builds = await TerraformProviderHash.terraformDatasource.getBuilds(registryURL, repository, version);
		if (!builds) return null;
		const shaUrls = deduplicateArray(builds.map((build) => build.shasums_url).filter(isNotNullOrUndefined));
		logger.debug(`Getting zip hashes for ${shaUrls.length} shasum URL(s) for ${repository}@${version}`);
		const zhHashes = [];
		for (const shaUrl of shaUrls) {
			const hashes = await TerraformProviderHash.terraformDatasource.getZipHashes(shaUrl);
			zhHashes.push(...coerceArray(hashes));
		}
		logger.debug(`Got ${zhHashes.length} zip hashes for ${repository}@${version}`);
		const h1Hashes = await TerraformProviderHash.calculateHashScheme1Hashes(builds);
		const hashes = [];
		hashes.push(...h1Hashes.map((hash) => `h1:${hash}`));
		hashes.push(...zhHashes.map((hash) => `zh:${hash}`));
		return hashes.sort();
	}
};
//#endregion
export { TerraformProviderHash };

//# sourceMappingURL=hash.js.map