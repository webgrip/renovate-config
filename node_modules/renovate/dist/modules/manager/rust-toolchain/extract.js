import { logger } from "../../../logger/index.js";
import api from "../../versioning/rust-release-channel/index.js";
import { RustVersionDatasource } from "../../datasource/rust-version/index.js";
import { RustToolchain } from "./schema.js";
//#region lib/modules/manager/rust-toolchain/extract.ts
function extractPackageFile(content, packageFile) {
	logger.trace(`rust-toolchain.extractPackageFile(${packageFile})`);
	const parsedResult = RustToolchain.safeParse(content);
	if (parsedResult.success) {
		const { channel } = parsedResult.data.toolchain;
		return createDependency(channel, packageFile);
	}
	if (packageFile.endsWith(".toml")) {
		logger.warn({
			err: parsedResult.error,
			packageFile
		}, "Failed to parse rust-toolchain.toml file");
		return null;
	}
	logger.trace({ packageFile }, "TOML parsing failed, trying legacy format");
	const lines = content.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
	if (lines.length === 0) {
		logger.warn({ packageFile }, "rust-toolchain file is empty");
		return null;
	}
	if (lines.length > 1) {
		logger.warn({ packageFile }, "rust-toolchain file contains multiple lines");
		return null;
	}
	return createDependency(lines[0], packageFile);
}
function createDependency(channel, packageFile) {
	if (!api.isValid(channel)) {
		logger.warn({
			channel,
			packageFile
		}, "Unsupported rust-toolchain channel value");
		return null;
	}
	return { deps: [{
		depName: "rust",
		depType: "toolchain",
		currentValue: channel,
		datasource: RustVersionDatasource.id
	}] };
}
//#endregion
export { extractPackageFile };

//# sourceMappingURL=extract.js.map