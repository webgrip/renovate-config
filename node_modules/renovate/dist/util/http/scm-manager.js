import { ensureTrailingSlash } from "../url.js";
import { HttpBase } from "./http.js";
//#region lib/util/http/scm-manager.ts
let baseUrl;
const setBaseUrl = (newBaseUrl) => {
	baseUrl = ensureTrailingSlash(newBaseUrl);
};
const getBaseUrl = () => baseUrl;
var ScmManagerHttp = class extends HttpBase {
	constructor() {
		super("scm-manager");
	}
	get baseUrl() {
		return baseUrl;
	}
};
//#endregion
export { ScmManagerHttp, getBaseUrl, setBaseUrl };

//# sourceMappingURL=scm-manager.js.map