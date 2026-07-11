import { RegExpVersioningApi } from "../regex/index.js";
import { satisfies } from "semver";
//#region lib/modules/versioning/hermit/index.ts
const id = "hermit";
const api = class HermitVersioning extends RegExpVersioningApi {
	static versionRegex = "^(?<major>\\d+)(\\.(?<minor>\\d+))?(\\.(?<patch>\\d+))?(\\.(?<supplement>\\d+))?(_(?<build>\\d+))?([-]?(?<prerelease>[^.+][^+]*))?([+](?<compatibility>[^.-][^+]*))?$";
	constructor() {
		super(HermitVersioning.versionRegex);
	}
	_isValid(version) {
		return super._parse(version) !== null;
	}
	_parseHermitVersioning(version) {
		const groups = this._config?.exec(version)?.groups;
		if (!groups) return null;
		const { major, minor, patch, supplement, build, prerelease, compatibility } = groups;
		const release = [
			Number.parseInt(major, 10),
			typeof minor === "undefined" ? 0 : Number.parseInt(minor, 10),
			typeof patch === "undefined" ? 0 : Number.parseInt(patch, 10),
			typeof supplement === "undefined" ? 0 : Number.parseInt(supplement, 10)
		];
		if (build) release.push(Number.parseInt(build, 10));
		return {
			release,
			prerelease,
			compatibility
		};
	}
	_parse(version) {
		const parsed = this._parseHermitVersioning(version);
		if (parsed) return parsed;
		const channelVer = HermitVersioning._getChannel(version);
		const groups = this._config?.exec(channelVer)?.groups;
		if (!groups) return null;
		const { major, minor, patch, supplement, build, prerelease, compatibility } = groups;
		const release = [];
		if (major) release.push(Number.parseInt(major, 10));
		if (minor) release.push(Number.parseInt(minor, 10));
		if (patch) release.push(Number.parseInt(patch, 10));
		if (supplement) release.push(Number.parseInt(supplement, 10));
		if (build) release.push(Number.parseInt(build, 10));
		return {
			release,
			prerelease,
			compatibility
		};
	}
	static _isChannel(version) {
		return version.startsWith("@");
	}
	static _getChannel(version) {
		return version.substring(1);
	}
	isStable(version) {
		if (this._isValid(version)) return super.isStable(version);
		return false;
	}
	isValid(version) {
		return this._isValid(version) || HermitVersioning._isChannel(version);
	}
	isLessThanRange(version, range) {
		return this._compare(version, range) < 0;
	}
	_compare(version, other) {
		if (this._isValid(version) && this._isValid(other)) return super._compare(version, other);
		const parsedVersion = this._parse(version);
		const parsedOther = this._parse(other);
		if (parsedVersion === null || parsedOther === null) {
			if (parsedVersion === null && parsedOther === null) return version.localeCompare(other);
			return parsedVersion === null ? -1 : 1;
		}
		const versionReleases = parsedVersion.release;
		const otherReleases = parsedOther.release;
		const maxLength = versionReleases.length > otherReleases.length ? versionReleases.length : otherReleases.length;
		for (let i = 0; i < maxLength; i++) {
			const verVal = versionReleases[i];
			const otherVal = otherReleases[i];
			if (verVal !== void 0 && otherVal !== void 0 && verVal !== otherVal) return verVal - otherVal;
			else if (verVal === void 0) return 1;
			else if (otherVal === void 0) return -1;
		}
		return 0;
	}
	matches(version, range) {
		if (HermitVersioning._isChannel(version) || HermitVersioning._isChannel(range)) return this.equals(version, range);
		return satisfies(version, range);
	}
};
//#endregion
export { api as default, id };

//# sourceMappingURL=index.js.map