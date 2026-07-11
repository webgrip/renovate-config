import { regEx } from "../../../util/regex.js";
import { GenericVersioningApi } from "../generic.js";
const versionRegex = regEx(/^v?(?<major>[0-9]+)(?:\.(?<minor>[0-9]+))?(?:\.(?<patch>[0-9]+))?(?<extra>(?:\.[0-9]+)*)(?<letter>[a-z])?(?:(?<prereleaseType>_alpha|_beta|_pre|_rc)(?<prereleaseNum>[0-9]*))?(?:(?<packageFixType>_cvs|_svn|_git|_hg|_p)(?<packageFixNum>[0-9]*))?(?:-r(?<releaseNum>[0-9]+))?$/);
const alphaNumRegex = regEx(/([a-zA-Z]+)|(\d+)/g);
var ApkVersioningApi = class extends GenericVersioningApi {
	/**
	* Parse APK version format using apko's version parsing patterns
	* Based on `Apache-2.0` code in https://github.com/chainguard-dev/apko/blob/v0.30.35/pkg/apk/apk/version.go
	*/
	_parse(version) {
		const match = versionRegex.exec(version);
		if (!match?.groups) return null;
		const { major, minor, patch, extra, letter, prereleaseType, prereleaseNum, packageFixType, packageFixNum, releaseNum } = match.groups;
		const packageFixFull = packageFixType ? packageFixType + packageFixNum : "";
		const versionStr = major + ((minor ? `.${minor}` : "") + (patch ? `.${patch}` : "") + extra) + (letter ?? "") + packageFixFull;
		let prerelease;
		if (prereleaseType) prerelease = prereleaseType.substring(1) + prereleaseNum;
		const release = [parseInt(major, 10)];
		if (minor) release.push(parseInt(minor, 10));
		if (patch) release.push(parseInt(patch, 10));
		if (extra) {
			const extraParts = extra.substring(1).split(".").filter(Boolean).map(Number);
			release.push(...extraParts);
		}
		return {
			version: versionStr,
			releaseString: releaseNum ?? "",
			release,
			prerelease
		};
	}
	/**
	* Compare two APK versions according to Alpine Linux rules
	*/
	_compare(version, other) {
		const parsed1 = this._parse(version);
		const parsed2 = this._parse(other);
		if (!(parsed1 && parsed2)) return 1;
		const versionCompare = this._compareVersionParts(parsed1.version, parsed2.version);
		if (versionCompare !== 0) return versionCompare;
		const prerelease1 = parsed1.prerelease;
		const prerelease2 = parsed2.prerelease;
		if (prerelease1 || prerelease2) {
			if (!prerelease1) return -1;
			if (!prerelease2) return 1;
			const prereleaseCompare = prerelease1.localeCompare(prerelease2);
			if (prereleaseCompare !== 0) return prereleaseCompare;
		}
		const release1 = parsed1.releaseString || "";
		const release2 = parsed2.releaseString || "";
		if (release1 && !release2) return 1;
		if (!release1 && release2) return -1;
		return this._compareVersionParts(release1 || "0", release2 || "0");
	}
	/**
	* Compare version parts using APK's version comparison rules
	*/
	_compareVersionParts(v1, v2) {
		if (v1 === v2) return 0;
		const matchesv1 = v1.match(alphaNumRegex);
		const matchesv2 = v2.match(alphaNumRegex);
		const matches = Math.min(matchesv1.length, matchesv2.length);
		for (let i = 0; i < matches; i++) {
			const matchv1 = matchesv1[i];
			const matchv2 = matchesv2[i];
			if (matchv1 && /^\d+$/.test(matchv1)) {
				if (!matchv2 || !/^\d+$/.test(matchv2)) return 1;
				const num1 = parseInt(matchv1, 10);
				const num2 = parseInt(matchv2, 10);
				if (num1 !== num2) return num1 - num2;
			} else if (matchv2 && /^\d+$/.test(matchv2)) return -1;
			else if (matchv1 !== matchv2) return matchv1.localeCompare(matchv2);
		}
		if (matchesv1.length !== matchesv2.length) {
			const maxLength = Math.max(matchesv1.length, matchesv2.length);
			for (let i = matches; i < maxLength; i++) {
				const matchv1 = matchesv1[i];
				const matchv2 = matchesv2[i];
				if (matchv1 && /^\d+$/.test(matchv1)) return 1;
				else if (matchv2 && /^\d+$/.test(matchv2)) return -1;
				else if (matchv1) return -1;
				else return 1;
			}
		}
		return 0;
	}
	isValid(version) {
		if (!version) return false;
		const cleanVersion = version.replace(/^[=><~][=]?/, "");
		return this._parse(cleanVersion) !== null;
	}
	isSingleVersion(version) {
		if (!version) return false;
		if (/^[><~]/.test(version)) return false;
		return this.isValid(version);
	}
	isStable(version) {
		if (!version) return false;
		const cleanVersion = version.replace(/^[=><~][=]?/, "");
		const parsed = this._parse(cleanVersion);
		if (!parsed) return false;
		return !parsed.prerelease;
	}
	getSatisfyingVersion(versions, range) {
		const rangeMatch = /^([><=~]+)(.+)$/.exec(range);
		if (!rangeMatch) return versions.find((v) => this.equals(v, range)) ?? null;
		const [, operator, targetVersion] = rangeMatch;
		const satisfyingVersions = versions.filter((version) => {
			if (!this.isValid(version) || !this.isValid(targetVersion)) return false;
			switch (operator) {
				case ">": return this.isGreaterThan(version, targetVersion);
				case ">=": return this.isGreaterThan(version, targetVersion) || this.equals(version, targetVersion);
				case "<": return this.isLessThanRange(version, targetVersion);
				case "<=": return this.isLessThanRange(version, targetVersion) || this.equals(version, targetVersion);
				case "=":
				case "==": return this.equals(version, targetVersion);
				case "~": {
					const targetParsed = this._parse(targetVersion);
					const versionParsed = this._parse(version);
					if (targetParsed.release[0] !== versionParsed.release[0] || targetParsed.release[1] !== versionParsed.release[1]) return false;
					return this.isGreaterThan(version, targetVersion) || this.equals(version, targetVersion);
				}
			}
			return false;
		});
		if (satisfyingVersions.length === 0) return null;
		return satisfyingVersions.sort((a, b) => this.sortVersions(b, a))[0];
	}
	getMajor(version) {
		if (!version) return null;
		const cleanVersion = version.replace(/^[=><~][=]?/, "");
		return this._parse(cleanVersion)?.release[0] ?? null;
	}
	getMinor(version) {
		if (!version) return null;
		const cleanVersion = version.replace(/^[=><~][=]?/, "");
		return this._parse(cleanVersion)?.release[1] ?? null;
	}
	getPatch(version) {
		if (!version) return null;
		const cleanVersion = version.replace(/^[=><~][=]?/, "");
		const parsed = this._parse(cleanVersion);
		if (!parsed) return null;
		return parsed.release[2] ?? null;
	}
	getNewValue({ currentValue, newVersion }) {
		if (!/-r\d+$/.test(currentValue)) return newVersion.replace(/-r\d+$/, "");
		return newVersion;
	}
	sortVersions(a, b) {
		const cleanA = a.replace(/^=/, "");
		const cleanB = b.replace(/^=/, "");
		return super.sortVersions(cleanA, cleanB);
	}
};
const api = new ApkVersioningApi();
//#endregion
export { api as default };

//# sourceMappingURL=index.js.map