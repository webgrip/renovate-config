import { CombinedHostRule, HostRule } from "../types/host-rules.js";
//#region lib/util/host-rules.d.ts
interface LegacyHostRule {
  hostName?: string;
  domainName?: string;
  baseUrl?: string;
  host?: string;
  endpoint?: string;
}
declare function migrateRule(rule: LegacyHostRule & HostRule): HostRule;
declare function add(params: HostRule): void;
interface HostRuleSearch {
  hostType?: string;
  url?: string;
  readOnly?: boolean;
}
declare function matchesHost(url: string, matchHost: string): boolean;
declare function find(search: HostRuleSearch): CombinedHostRule;
declare function hosts({
  hostType
}: {
  hostType: string;
}): string[];
declare function hostType({
  url
}: {
  url: string;
}): string | null;
declare function findAll({
  hostType
}: {
  hostType: string;
}): HostRule[];
/**
 * @returns a deep copy of all known host rules without any filtering
 */
declare function getAll(): HostRule[];
declare function clear(): void;
//#endregion
export { HostRuleSearch, LegacyHostRule, add, clear, find, findAll, getAll, hostType, hosts, matchesHost, migrateRule };
//# sourceMappingURL=host-rules.d.ts.map