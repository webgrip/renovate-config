import traverse from "neotraverse/legacy";
//#region lib/logger/config-serializer.ts
function configSerializer(config) {
	const templateFields = ["prBody"];
	const contentFields = [
		"content",
		"contents",
		"packageLockParsed",
		"yarnLockParsed"
	];
	const arrayFields = ["packageFiles", "upgrades"];
	return traverse(config).map(function scrub(val) {
		if (this.key && val) {
			const key = this.key.toString();
			if (templateFields.includes(key)) this.update("[Template]");
			if (contentFields.includes(key)) this.update("[content]");
			if (arrayFields.includes(key)) this.update("[Array]");
		}
	});
}
//#endregion
export { configSerializer as default };

//# sourceMappingURL=config-serializer.js.map