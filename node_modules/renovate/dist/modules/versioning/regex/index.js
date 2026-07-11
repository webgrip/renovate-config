import { CONFIG_VALIDATION } from "../../../constants/error-messages.js";
import { regEx } from "../../../util/regex.js";
import { GenericVersioningApi } from "../generic.js";
//#region lib/modules/versioning/regex/index.ts
const id = "regex";
var RegExpVersioningApi = class extends GenericVersioningApi {
	_config;
	constructor(_new_config) {
		super();
		const new_config = _new_config ?? "^(?<major>\\d+)?$";
		if (!new_config.includes("<major>") && !new_config.includes("<minor>") && !new_config.includes("<patch>")) {
			const error = new Error(CONFIG_VALIDATION);
			error.validationSource = new_config;
			error.validationError = "regex versioning needs at least one major, minor or patch group defined";
			throw error;
		}
		this._config = regEx(new_config);
	}
	_parse(version) {
		const groups = this._config?.exec(version)?.groups;
		if (!groups) return null;
		const { major, minor, patch, build, revision, prerelease, compatibility } = groups;
		const release = [
			typeof major === "undefined" ? 0 : Number.parseInt(major, 10),
			typeof minor === "undefined" ? 0 : Number.parseInt(minor, 10),
			typeof patch === "undefined" ? 0 : Number.parseInt(patch, 10)
		];
		if (build) {
			release.push(Number.parseInt(build, 10));
			if (revision) release.push(Number.parseInt(revision, 10));
		}
		return {
			release,
			prerelease,
			compatibility
		};
	}
	isCompatible(version, current) {
		const parsedVersion = this._parse(version);
		const parsedCurrent = this._parse(current);
		return !!(parsedVersion && parsedVersion.compatibility === parsedCurrent?.compatibility);
	}
};
const api = RegExpVersioningApi;
//#endregion
export { RegExpVersioningApi, api as default, id };

//# sourceMappingURL=index.js.map