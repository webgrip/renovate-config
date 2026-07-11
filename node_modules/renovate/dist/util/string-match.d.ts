//#region lib/util/string-match.d.ts
type StringMatchPredicate = (s: string) => boolean;
declare function isDockerDigest(input: string): boolean;
declare function getRegexOrGlobPredicate(pattern: string): StringMatchPredicate;
declare function matchRegexOrGlob(input: string, pattern: string): boolean;
declare function matchRegexOrGlobList(input: string, patterns: string[]): boolean;
declare function anyMatchRegexOrGlobList(inputs: string[], patterns: string[]): boolean;
declare const UUIDRegex: RegExp;
declare function isRegexMatch(input: unknown): input is string;
declare function getRegexPredicate(input: string): StringMatchPredicate | null;
//#endregion
export { StringMatchPredicate, UUIDRegex, anyMatchRegexOrGlobList, getRegexOrGlobPredicate, getRegexPredicate, isDockerDigest, isRegexMatch, matchRegexOrGlob, matchRegexOrGlobList };
//# sourceMappingURL=string-match.d.ts.map