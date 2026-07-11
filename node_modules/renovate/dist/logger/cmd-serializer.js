import { regEx } from "../util/regex.js";
//#region lib/logger/cmd-serializer.ts
function cmdSerializer(cmd) {
	if (typeof cmd === "string") return cmd.replace(regEx(/https:\/\/[^@]*@/g), "https://**redacted**@");
	return cmd;
}
//#endregion
export { cmdSerializer as default };

//# sourceMappingURL=cmd-serializer.js.map