import { S3Client } from "@aws-sdk/client-s3";

//#region lib/util/s3.d.ts
declare function getS3Client(s3Endpoint?: string, s3PathStyle?: boolean): S3Client;
interface S3UrlParts {
  Bucket: string;
  Key: string;
}
declare function parseS3Url(rawUrl: URL | string): S3UrlParts | null;
//#endregion
export { S3UrlParts, getS3Client, parseS3Url };
//# sourceMappingURL=s3.d.ts.map