import { createHash } from "node:crypto";
//#region lib/util/fingerprint.ts
function isEmittable(value, cache) {
	if (value === void 0 || typeof value === "function" || typeof value === "symbol") return false;
	if (value === null || typeof value !== "object") return true;
	const cached = cache.get(value);
	if (cached !== void 0) return cached;
	const obj = value;
	const result = typeof obj.toJSON === "function" ? isEmittable(obj.toJSON(), cache) : true;
	cache.set(value, result);
	return result;
}
function fingerprintInto(h, value, seen, emittableCache) {
	if (value === null || typeof value !== "object") {
		h.update(JSON.stringify(value));
		return;
	}
	const obj = value;
	if (typeof obj.toJSON === "function") {
		fingerprintInto(h, obj.toJSON(), seen, emittableCache);
		return;
	}
	if (seen.has(value)) {
		h.update("\"[Circular]\"");
		return;
	}
	seen.add(value);
	if (Array.isArray(value)) {
		h.update("[");
		for (let i = 0; i < value.length; i++) {
			if (i > 0) h.update(",");
			const item = value[i];
			if (isEmittable(item, emittableCache)) fingerprintInto(h, item, seen, emittableCache);
			else h.update("null");
		}
		h.update("]");
	} else {
		const entries = value;
		const keys = Object.keys(entries).sort();
		h.update("{");
		let first = true;
		for (const k of keys) {
			const v = entries[k];
			if (!isEmittable(v, emittableCache)) continue;
			if (!first) h.update(",");
			first = false;
			h.update(JSON.stringify(k));
			h.update(":");
			fingerprintInto(h, v, seen, emittableCache);
		}
		h.update("}");
	}
	seen.delete(value);
}
function fingerprint(input) {
	const emittableCache = /* @__PURE__ */ new WeakMap();
	if (!isEmittable(input, emittableCache)) return "";
	const h = createHash("sha512");
	fingerprintInto(h, input, /* @__PURE__ */ new WeakSet(), emittableCache);
	return h.digest("hex");
}
//#endregion
export { fingerprint };

//# sourceMappingURL=fingerprint.js.map