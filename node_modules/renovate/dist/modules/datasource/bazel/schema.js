import { z } from "zod/v4";
//#region lib/modules/datasource/bazel/schema.ts
const BazelModuleMetadata = z.object({
	homepage: z.string().optional().nullable(),
	versions: z.array(z.string()),
	yanked_versions: z.record(z.string(), z.string()).optional()
});
//#endregion
export { BazelModuleMetadata };

//# sourceMappingURL=schema.js.map