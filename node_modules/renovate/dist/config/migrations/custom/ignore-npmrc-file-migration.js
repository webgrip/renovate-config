import { AbstractMigration } from "../base/abstract-migration.js";
import { isString } from "@sindresorhus/is";
//#region lib/config/migrations/custom/ignore-npmrc-file-migration.ts
var IgnoreNpmrcFileMigration = class extends AbstractMigration {
	deprecated = true;
	propertyName = "ignoreNpmrcFile";
	run() {
		if (!isString(this.get("npmrc"))) this.setHard("npmrc", "");
	}
};
//#endregion
export { IgnoreNpmrcFileMigration };

//# sourceMappingURL=ignore-npmrc-file-migration.js.map