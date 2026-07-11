import { logger } from "../../../logger/index.js";
import { ExternalHostError } from "../../../types/errors/external-host-error.js";
import { id, isVersion } from "../../versioning/ruby/index.js";
import { withCache } from "../../../util/cache/package/with-cache.js";
import { parse } from "../../../util/html.js";
import { asTimestamp } from "../../../util/timestamp.js";
import { Datasource } from "../datasource.js";
//#region lib/modules/datasource/ruby-version/index.ts
var RubyVersionDatasource = class RubyVersionDatasource extends Datasource {
	static id = "ruby-version";
	constructor() {
		super(RubyVersionDatasource.id);
	}
	defaultRegistryUrls = ["https://www.ruby-lang.org/"];
	customRegistrySupport = false;
	defaultVersioning = id;
	releaseTimestampSupport = true;
	releaseTimestampNote = "The release timestamp is determined from the `release-list` table in the results.";
	sourceUrlSupport = "package";
	sourceUrlNote = "We use the URL: https://github.com/ruby/ruby.";
	async _getReleases({ registryUrl }) {
		const res = {
			homepage: "https://www.ruby-lang.org",
			sourceUrl: "https://github.com/ruby/ruby",
			releases: []
		};
		const rubyVersionsUrl = `${registryUrl}en/downloads/releases/`;
		try {
			(parse((await this.http.getText(rubyVersionsUrl)).body).querySelector(".release-list")?.querySelectorAll("tr") ?? []).forEach((row) => {
				const tds = row.querySelectorAll("td");
				const columns = [];
				tds.forEach((td) => columns.push(td.innerHTML));
				if (columns.length) {
					const version = columns[0].replace("Ruby ", "");
					if (isVersion(version)) {
						const releaseTimestamp = asTimestamp(columns[1]);
						const changelogUrl = columns[2].replace("<a href=\"", "https://www.ruby-lang.org").replace("\">more...</a>", "");
						res.releases.push({
							version,
							releaseTimestamp,
							changelogUrl
						});
					}
				}
			});
			if (!res.releases.length) {
				logger.warn({ registryUrl }, "Missing ruby releases");
				return null;
			}
		} catch (err) {
			this.handleGenericErrors(err);
		}
		return res;
	}
	getReleases(config) {
		return withCache({
			namespace: `datasource-${RubyVersionDatasource.id}`,
			key: "all",
			fallback: true
		}, () => this._getReleases(config));
	}
	handleHttpErrors(err) {
		throw new ExternalHostError(err);
	}
};
//#endregion
export { RubyVersionDatasource };

//# sourceMappingURL=index.js.map