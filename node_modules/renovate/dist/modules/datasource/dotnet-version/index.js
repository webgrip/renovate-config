import { withCache } from "../../../util/cache/package/with-cache.js";
import { Datasource } from "../datasource.js";
import { map } from "../../../util/promises.js";
import { DotnetRuntimeReleases, DotnetSdkReleases, ReleasesIndex } from "./schema.js";
//#region lib/modules/datasource/dotnet-version/index.ts
var DotnetVersionDatasource = class DotnetVersionDatasource extends Datasource {
	static id = "dotnet-version";
	constructor() {
		super(DotnetVersionDatasource.id);
	}
	caching = true;
	customRegistrySupport = false;
	defaultRegistryUrls = ["https://dotnetcli.blob.core.windows.net/dotnet/release-metadata/releases-index.json"];
	releaseTimestampSupport = true;
	releaseTimestampNote = "The release timestamp is determined from the `release-date` field in the results.";
	sourceUrlSupport = "package";
	sourceUrlNote = "We use the URL https://github.com/dotnet/sdk for the `dotnet-sdk` package and, the https://github.com/dotnet/runtime URL for the `dotnet-runtime` package.";
	async _getReleases({ packageName }) {
		if (!(packageName === "dotnet-sdk" || packageName === "dotnet-runtime")) return null;
		try {
			const registryUrl = this.defaultRegistryUrls[0];
			const { body: urls } = await this.http.getJson(registryUrl, ReleasesIndex);
			return {
				releases: (await map(urls, (url) => this.getChannelReleases(url, packageName), {
					concurrency: 1,
					stopOnError: true
				})).flat(),
				sourceUrl: packageName === "dotnet-sdk" ? "https://github.com/dotnet/sdk" : "https://github.com/dotnet/runtime"
			};
		} catch (err) {
			this.handleGenericErrors(err);
		}
	}
	getReleases(config) {
		return withCache({
			namespace: `datasource-${DotnetVersionDatasource.id}`,
			key: config.packageName,
			ttlMinutes: 1440,
			fallback: true
		}, () => this._getReleases(config));
	}
	async _getChannelReleases(releaseUrl, packageName) {
		const schema = packageName === "dotnet-sdk" ? DotnetSdkReleases : DotnetRuntimeReleases;
		try {
			const { body } = await this.http.getJson(releaseUrl, schema);
			return body;
		} catch (err) {
			this.handleGenericErrors(err);
		}
	}
	getChannelReleases(releaseUrl, packageName) {
		return withCache({
			namespace: `datasource-${DotnetVersionDatasource.id}`,
			key: `${releaseUrl}:${packageName}`,
			ttlMinutes: 1440
		}, () => this._getChannelReleases(releaseUrl, packageName));
	}
};
//#endregion
export { DotnetVersionDatasource };

//# sourceMappingURL=index.js.map