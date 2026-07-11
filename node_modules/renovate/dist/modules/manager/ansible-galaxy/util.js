import { regEx } from "../../../util/regex.js";
//#region lib/modules/manager/ansible-galaxy/util.ts
const newBlockRegEx = /^\s*-\s*((\w+):\s*(.*))$/;
const blockLineRegEx = /^\s*((\w+):\s*(\S+))\s*$/;
const galaxyDepRegex = /[\w-]+\.[\w-]+/;
const dependencyRegex = /^dependencies:/;
const galaxyRegEx = regEx(/^\s+["']?(?<packageName>[\w.]+)["']?:\s*["']?(?<version>.+?)["']?\s*(\s#.*)?$/);
const nameMatchRegex = regEx(/(?<source>((git\+)?(?:(git|ssh|https?):\/\/)?(.*@)?(?<hostname>[\w.-]+)(?:(:\d+)?\/|:))(?<depName>[\w./-]+)(?:\.git)?)(,(?<version>[\w.]*))?/);
//#endregion
export { blockLineRegEx, dependencyRegex, galaxyDepRegex, galaxyRegEx, nameMatchRegex, newBlockRegEx };

//# sourceMappingURL=util.js.map