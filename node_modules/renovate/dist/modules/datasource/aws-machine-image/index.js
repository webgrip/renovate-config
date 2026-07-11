import { id } from "../../versioning/aws-machine-image/index.js";
import { withCache } from "../../../util/cache/package/with-cache.js";
import { asTimestamp } from "../../../util/timestamp.js";
import { Datasource } from "../datasource.js";
import { fromNodeProviderChain } from "@aws-sdk/credential-providers";
import { DescribeImagesCommand, EC2Client } from "@aws-sdk/client-ec2";
//#region lib/modules/datasource/aws-machine-image/index.ts
var AwsMachineImageDatasource = class AwsMachineImageDatasource extends Datasource {
	static id = "aws-machine-image";
	defaultVersioning = id;
	caching = true;
	releaseTimestampSupport = true;
	releaseTimestampNote = "The release timestamp is determined from the `CreationDate` field in the results.";
	defaultConfig = {
		commitMessageExtra: "to {{{newVersion}}}",
		prBodyColumns: ["Change", "Image"],
		prBodyDefinitions: { Image: "```{{{newDigest}}}```" },
		digest: {
			commitMessageExtra: "to {{{newDigest}}}",
			prBodyColumns: ["Image"],
			prBodyDefinitions: { Image: "```{{{newDigest}}}```" }
		}
	};
	now;
	constructor() {
		super(AwsMachineImageDatasource.id);
		this.now = Date.now();
	}
	isAmiFilter(config) {
		return "Name" in config && "Values" in config;
	}
	getEC2Client(config) {
		const { profile, region } = config;
		return new EC2Client({
			region,
			credentials: fromNodeProviderChain({ profile })
		});
	}
	getAmiFilterCommand(filter) {
		return new DescribeImagesCommand({ Filters: filter });
	}
	loadConfig(serializedAmiFilter) {
		const parsedConfig = JSON.parse(serializedAmiFilter);
		const filters = [];
		let config = {};
		for (const elem of parsedConfig) if (this.isAmiFilter(elem)) filters.push(elem);
		else config = Object.assign(config, elem);
		return [filters, config];
	}
	async _getSortedAwsMachineImages(serializedAmiFilter) {
		const [amiFilter, clientConfig] = this.loadConfig(serializedAmiFilter);
		const amiFilterCmd = this.getAmiFilterCommand(amiFilter);
		const matchingImages = await this.getEC2Client(clientConfig).send(amiFilterCmd);
		matchingImages.Images = matchingImages.Images ?? [];
		return matchingImages.Images.sort((image1, image2) => {
			return (image1.CreationDate ? Date.parse(image1.CreationDate) : 			/* v8 ignore next */ 0) - (image2.CreationDate ? Date.parse(image2.CreationDate) : 			/* v8 ignore next */ 0);
		});
	}
	getSortedAwsMachineImages(serializedAmiFilter) {
		return withCache({
			namespace: `datasource-${AwsMachineImageDatasource.id}`,
			key: `getSortedAwsMachineImages:${serializedAmiFilter}`
		}, () => this._getSortedAwsMachineImages(serializedAmiFilter));
	}
	async _getDigest({ packageName: serializedAmiFilter }, newValue) {
		const images = await this.getSortedAwsMachineImages(serializedAmiFilter);
		if (images.length < 1) return null;
		if (newValue) {
			const newValueMatchingImages = images.filter((image) => image.ImageId === newValue);
			if (newValueMatchingImages.length === 1 && newValueMatchingImages[0].Name) return newValueMatchingImages[0].Name;
			return null;
		}
		return (await this.getReleases({ packageName: serializedAmiFilter }))?.releases?.[0]?.newDigest ?? null;
	}
	getDigest(config, newValue) {
		return withCache({
			namespace: `datasource-${AwsMachineImageDatasource.id}`,
			key: `getDigest:${config.packageName}:${newValue ?? ""}`,
			fallback: true
		}, () => this._getDigest(config, newValue));
	}
	async _getReleases({ packageName: serializedAmiFilter }) {
		const images = await this.getSortedAwsMachineImages(serializedAmiFilter);
		const latestImage = images[images.length - 1];
		if (!latestImage?.ImageId) return null;
		return { releases: [{
			version: latestImage.ImageId,
			releaseTimestamp: asTimestamp(latestImage.CreationDate),
			isDeprecated: Date.parse(latestImage.DeprecationTime ?? this.now.toString()) < this.now,
			newDigest: latestImage.Name
		}] };
	}
	getReleases(config) {
		return withCache({
			namespace: `datasource-${AwsMachineImageDatasource.id}`,
			key: `getReleases:${config.packageName}`,
			fallback: true
		}, () => this._getReleases(config));
	}
};
//#endregion
export { AwsMachineImageDatasource };

//# sourceMappingURL=index.js.map