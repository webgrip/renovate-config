import { regEx } from "../../../util/regex.js";
import { logger } from "../../../logger/index.js";
import { coerceNumber } from "../../../util/number.js";
import { remark } from "remark";
//#region lib/modules/platform/github/massage-markdown-links.ts
const urlRegex = /(?:https?:)?(?:\/\/)?(?:www\.)?(?<!api\.)(?:to)?github\.com\/[-a-z0-9]+\/[-_a-z0-9.]+\/(?:discussions|issues|pull)\/[0-9]+(?:#[-_a-z0-9]+)?/i;
function massageLink(input) {
	return input.replace(regEx(/(?:to|redirect\.|www\.)?github\.com/i), "redirect.github.com");
}
function collectLinkPosition(input, matches) {
	const transformer = (tree) => {
		const startOffset = coerceNumber(tree.position?.start.offset);
		const endOffset = coerceNumber(tree.position?.end.offset);
		// v8 ignore else -- TODO: add test #40625
		if (tree.type === "link") {
			const substr = input.slice(startOffset, endOffset);
			const url = tree.url;
			const offset = startOffset + substr.lastIndexOf(url);
			if (urlRegex.test(url)) matches.push({
				start: offset,
				end: offset + url.length,
				replaceTo: massageLink(url)
			});
		} else if (tree.type === "text") {
			const globalUrlReg = new RegExp(urlRegex, "gi");
			const urlMatches = [...tree.value.matchAll(globalUrlReg)];
			for (const match of urlMatches) {
				const [url] = match;
				const start = startOffset + coerceNumber(match.index);
				const end = start + url.length;
				const newUrl = massageLink(url);
				matches.push({
					start,
					end,
					replaceTo: `[${url}](${newUrl})`
				});
			}
		} else if ("children" in tree) tree.children.forEach((child) => {
			transformer(child);
		});
	};
	return () => transformer;
}
function massageMarkdownLinks(content) {
	try {
		const rightSpaces = content.replace(content.trimEnd(), "");
		const matches = [];
		remark().use(collectLinkPosition(content, matches)).processSync(content);
		return matches.reduceRight((acc, { start, end, replaceTo }) => {
			const leftPart = acc.slice(0, start);
			const rightPart = acc.slice(end);
			return leftPart + replaceTo + rightPart;
		}, content).trimEnd() + rightSpaces;
	} catch (err) 	/* v8 ignore next */ {
		logger.warn({ err }, `Unable to massage markdown text`);
		return content;
	}
}
//#endregion
export { massageMarkdownLinks };

//# sourceMappingURL=massage-markdown-links.js.map