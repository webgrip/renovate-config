import { Json, LooseRecord, Yaml } from "../../../util/schema-utils/index.js";
import { z } from "zod/v4";
//#region lib/modules/manager/npm/schema.ts
const PnpmCatalogs = z.object({
	catalog: z.optional(z.record(z.string(), z.string())),
	catalogs: z.optional(z.record(z.string(), z.record(z.string(), z.string())))
});
const YarnCatalogs = z.object({
	catalog: z.optional(z.record(z.string(), z.string())),
	catalogs: z.optional(z.record(z.string(), z.record(z.string(), z.string()))).catch(void 0)
});
const YarnConfig = Yaml.pipe(z.object({
	npmRegistryServer: z.string().optional(),
	npmScopes: z.record(z.string(), z.object({ npmRegistryServer: z.string().optional() })).optional()
}).and(YarnCatalogs));
const PnpmWorkspaceFile = Yaml.pipe(z.object({
	packages: z.array(z.string()).optional(),
	minimumReleaseAge: z.number().nullish(),
	minimumReleaseAgeExclude: z.array(z.string()).optional(),
	overrides: z.record(z.string(), z.string()).optional()
}).and(PnpmCatalogs));
const PackageManager = z.string().transform((val) => val.split("@")).transform(([name, ...version]) => ({
	name,
	version: version.join("@")
}));
const DevEngineDependency = z.object({
	name: z.string(),
	version: z.string().optional()
});
const DevEngine = z.object({ packageManager: DevEngineDependency.or(z.array(DevEngineDependency)).optional() });
const PackageJson = Json.pipe(z.object({
	devEngines: DevEngine.optional(),
	engines: LooseRecord(z.string()).optional(),
	dependencies: LooseRecord(z.string()).optional(),
	devDependencies: LooseRecord(z.string()).optional(),
	peerDependencies: LooseRecord(z.string()).optional(),
	packageManager: PackageManager.optional(),
	volta: LooseRecord(z.string()).optional()
}));
const PackageLockV3 = z.object({
	lockfileVersion: z.literal(3),
	packages: LooseRecord(z.string().transform((x) => x.replace(/^node_modules\//, "")).refine((x) => x.trim() !== ""), z.object({ version: z.string() }))
});
const PackageLockPreV3 = z.object({
	lockfileVersion: z.union([z.literal(2), z.literal(1)]),
	dependencies: LooseRecord(z.object({ version: z.string() }))
}).transform(({ lockfileVersion, dependencies: packages }) => ({
	lockfileVersion,
	packages
}));
const PackageLock = Json.pipe(z.union([PackageLockV3, PackageLockPreV3])).transform(({ packages, lockfileVersion }) => {
	const lockedVersions = {};
	for (const [entry, val] of Object.entries(packages)) lockedVersions[entry] = val.version;
	return {
		lockedVersions,
		lockfileVersion
	};
});
//#endregion
export { PackageJson, PackageLock, PnpmWorkspaceFile, YarnConfig };

//# sourceMappingURL=schema.js.map