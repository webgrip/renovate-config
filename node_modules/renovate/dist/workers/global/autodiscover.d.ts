import { AllConfig } from "../../config/types.js";

//#region lib/workers/global/autodiscover.d.ts
declare function autodiscoverRepositories(config: AllConfig): Promise<AllConfig>;
declare function applyFilters(repos: string[], filters: string[]): string[];
//#endregion
export { applyFilters, autodiscoverRepositories };
//# sourceMappingURL=autodiscover.d.ts.map