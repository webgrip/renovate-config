import { logger } from "../../../logger/index.js";
import { coerceArray } from "../../../util/array.js";
import { id } from "../../versioning/aws-eks-addon/index.js";
import { withCache } from "../../../util/cache/package/with-cache.js";
import { Datasource } from "../datasource.js";
import { EksAddonsFilter } from "./schema.js";
import { isTruthy } from "@sindresorhus/is";
import { DescribeAddonVersionsCommand, EKSClient } from "@aws-sdk/client-eks";
import { fromNodeProviderChain } from "@aws-sdk/credential-providers";
//#region lib/modules/datasource/aws-eks-addon/index.ts
var AwsEKSAddonDataSource = class AwsEKSAddonDataSource extends Datasource {
	static id = "aws-eks-addon";
	defaultVersioning = id;
	caching = true;
	clients = {};
	constructor() {
		super(AwsEKSAddonDataSource.id);
	}
	async _getReleases({ packageName: serializedFilter }) {
		const res = EksAddonsFilter.safeParse(serializedFilter);
		if (!res.success) {
			logger.warn({
				err: res.error,
				serializedFilter
			}, "Error parsing eks-addons config.");
			return null;
		}
		const filter = res.data;
		const cmd = new DescribeAddonVersionsCommand({
			kubernetesVersion: filter.kubernetesVersion,
			addonName: filter.addonName,
			maxResults: 1
		});
		return { releases: coerceArray((await this.getClient(filter).send(cmd)).addons).flatMap((addon) => {
			return addon.addonVersions;
		}).filter(isTruthy).map((versionInfo) => ({
			version: versionInfo.addonVersion ?? "",
			default: versionInfo.compatibilities?.some((comp) => comp.defaultVersion) ?? false,
			compatibleWith: versionInfo.compatibilities?.flatMap((comp) => comp.clusterVersion)
		})).filter((release) => release.version && release.version !== "").filter((release) => {
			if (filter.default) return release.default && release.default === filter.default;
			return true;
		}) };
	}
	getReleases(config) {
		return withCache({
			namespace: `datasource-${AwsEKSAddonDataSource.id}`,
			key: `getReleases:${config.packageName}`,
			fallback: true
		}, () => this._getReleases(config));
	}
	getClient({ region, profile }) {
		const cacheKey = `${region ?? "default"}#${profile ?? "default"}`;
		if (!(cacheKey in this.clients)) this.clients[cacheKey] = new EKSClient({
			...region && { region },
			credentials: fromNodeProviderChain(profile ? { profile } : void 0)
		});
		return this.clients[cacheKey];
	}
};
//#endregion
export { AwsEKSAddonDataSource };

//# sourceMappingURL=index.js.map