import { regEx } from "../../util/regex.js";
import { isHttpUrl } from "../../util/url.js";
import { PRESET_INVALID, PRESET_PROHIBITED_SUBPRESET } from "./util.js";
import { isNonEmptyString } from "@sindresorhus/is";
//#region lib/config/presets/parse.ts
const nonScopedPresetWithSubdirRegex = regEx(/^(?<repo>~?[\w\-. /%]+?)\/\/(?:(?<presetPath>[\w\-./]+)\/)?(?<presetName>[\w\-.]+)(?:#(?<tag>[\w\-./]+?))?$/);
const gitPresetRegex = regEx(/^(?<repo>~?[\w\-. /%]+)(?::(?<presetName>[\w\-.+/]+))?(?:#(?<tag>[\w\-./]+?))?$/);
function parsePreset(input) {
	let str = input;
	let presetSource;
	let presetPath;
	let repo;
	let presetName;
	let tag;
	let rawParams;
	let params;
	if (str.startsWith("github>")) {
		presetSource = "github";
		str = str.substring(7);
	} else if (str.startsWith("gitlab>")) {
		presetSource = "gitlab";
		str = str.substring(7);
	} else if (str.startsWith("gitea>")) {
		presetSource = "gitea";
		str = str.substring(6);
	} else if (str.startsWith("forgejo>")) {
		presetSource = "forgejo";
		str = str.substring(8);
	} else if (str.startsWith("local>")) {
		presetSource = "local";
		str = str.substring(6);
	} else if (isHttpUrl(str)) presetSource = "http";
	else if (!str.startsWith("@") && !str.startsWith(":") && str.includes("/")) presetSource = "local";
	str = str.replace(regEx(/^npm>/), "");
	presetSource = presetSource ?? "npm";
	if (str.includes("(")) {
		rawParams = str.slice(str.indexOf("(") + 1, -1);
		params = rawParams.split(",").map((elem) => elem.trim());
		str = str.slice(0, str.indexOf("("));
	}
	if (presetSource === "http") return {
		presetSource,
		repo: str,
		presetName: "",
		params,
		rawParams
	};
	if ([
		"abandonments",
		"compatibility",
		"config",
		"customManagers",
		"default",
		"docker",
		"global",
		"group",
		"helpers",
		"mergeConfidence",
		"monorepo",
		"npm",
		"packages",
		"preview",
		"replacements",
		"schedule",
		"security",
		"workarounds"
	].some((presetPackage) => str.startsWith(`${presetPackage}:`))) {
		presetSource = "internal";
		[repo, presetName] = str.split(":");
	} else if (str.startsWith(":")) {
		presetSource = "internal";
		repo = "default";
		presetName = str.slice(1);
	} else if (str.startsWith("@")) {
		[, repo] = regEx(/(@.*?)(:|$)/).exec(str);
		str = str.slice(repo.length);
		if (!repo.includes("/")) repo += "/renovate-config";
		if (str === "") presetName = "default";
		else presetName = str.slice(1);
	} else if (str.includes("//")) {
		if (str.includes(":")) throw new Error(PRESET_PROHIBITED_SUBPRESET);
		if (!nonScopedPresetWithSubdirRegex.test(str)) throw new Error(PRESET_INVALID);
		({repo, presetPath, presetName, tag} = nonScopedPresetWithSubdirRegex.exec(str).groups);
	} else {
		({repo, presetName, tag} = gitPresetRegex.exec(str).groups);
		if (presetSource === "npm" && !repo.startsWith("renovate-config-")) repo = `renovate-config-${repo}`;
		if (!isNonEmptyString(presetName)) presetName = "default";
	}
	return {
		presetSource,
		presetPath,
		repo,
		presetName,
		tag,
		params,
		rawParams
	};
}
//#endregion
export { parsePreset };

//# sourceMappingURL=parse.js.map