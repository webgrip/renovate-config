import { clone } from "../clone.js";
//#region lib/util/http/util.ts
function copyResponse({ statusCode, headers, body, cached }, deep) {
	const res = {
		statusCode,
		headers,
		body
	};
	if (deep) {
		res.headers = clone(headers);
		res.body = body instanceof Buffer ? body.subarray() : clone(body);
	}
	if (cached) res.cached = true;
	return res;
}
//#endregion
export { copyResponse };

//# sourceMappingURL=util.js.map