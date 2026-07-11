import { Json } from "../../../util/schema-utils/index.js";
import { z } from "zod/v4";
//#region lib/modules/manager/swift/schema.ts
const PackageResolvedPin = z.object({
	identity: z.string(),
	kind: z.string(),
	location: z.string(),
	state: z.object({
		revision: z.string(),
		version: z.string().nullable().optional(),
		branch: z.string().nullable().optional()
	})
});
const PackageResolvedJson = Json.pipe(z.object({
	pins: z.array(PackageResolvedPin),
	version: z.number().int().min(2),
	originHash: z.string().optional()
}));
//#endregion
export { PackageResolvedJson };

//# sourceMappingURL=schema.js.map