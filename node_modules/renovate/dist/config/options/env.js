//#region lib/config/options/env.ts
function getEnvName(option) {
	if (option.env === false) return "";
	if (option.env) return option.env;
	return `RENOVATE_${option.name.replace(/([A-Z])/g, "_$1").toUpperCase()}`;
}
//#endregion
export { getEnvName };

//# sourceMappingURL=env.js.map