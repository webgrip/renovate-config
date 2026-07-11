import { parseSingleYaml } from "../../../../util/yaml.js";
import { readLocalFile } from "../../../../util/fs/index.js";
//#region lib/modules/datasource/custom/formats/yaml.ts
var YamlFetcher = class {
	async fetch(http, registryURL) {
		return parseSingleYaml((await http.getText(registryURL)).body);
	}
	async readFile(registryURL) {
		return parseSingleYaml(await readLocalFile(registryURL, "utf8"));
	}
};
//#endregion
export { YamlFetcher };

//# sourceMappingURL=yaml.js.map