import { GlobalConfig } from "../config/global.js";
import { parseUrl } from "./url.js";
import { isUndefined } from "@sindresorhus/is";
import { S3Client } from "@aws-sdk/client-s3";
//#region lib/util/s3.ts
let s3Instance;
function getS3Client(s3Endpoint, s3PathStyle) {
	if (!s3Instance) {
		const endpoint = s3Endpoint ?? GlobalConfig.get("s3Endpoint");
		const forcePathStyle = isUndefined(s3PathStyle) ? !!GlobalConfig.get("s3PathStyle") : s3PathStyle;
		s3Instance = new S3Client({
			...endpoint && { endpoint },
			...forcePathStyle && { forcePathStyle: true }
		});
	}
	return s3Instance;
}
function parseS3Url(rawUrl) {
	const parsedUrl = typeof rawUrl === "string" ? parseUrl(rawUrl) : rawUrl;
	if (parsedUrl === null) return null;
	if (parsedUrl.protocol !== "s3:") return null;
	return {
		Bucket: parsedUrl.host,
		Key: parsedUrl.pathname.substring(1)
	};
}
//#endregion
export { getS3Client, parseS3Url };

//# sourceMappingURL=s3.js.map