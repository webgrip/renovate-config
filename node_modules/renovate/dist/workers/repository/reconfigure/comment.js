import { GlobalConfig } from "../../../config/global.js";
import { logger } from "../../../logger/index.js";
import { platform } from "../../../modules/platform/index.js";
import { ensureComment } from "../../../modules/platform/comment.js";
import { getDepWarningsOnboardingPR, getErrors, getWarnings } from "../errors-warnings.js";
import { getBaseBranchDesc } from "../onboarding/pr/base-branch.js";
import { getScheduleDesc } from "../onboarding/pr/config-description.js";
import { getExpectedPrList } from "../onboarding/pr/pr-list.js";
import { isArray, isString } from "@sindresorhus/is";
//#region lib/workers/repository/reconfigure/comment.ts
async function ensureReconfigurePrComment(config, packageFiles, branches, branchName, pr) {
	logger.debug("ensureReconfigurePrComment()");
	logger.trace({ config });
	let prCommentTemplate = `This is a reconfigure PR comment to help you understand and re-configure your renovate bot settings. If this Reconfigure PR were to be merged, we'd expect to see the following outcome:\n\n`;
	prCommentTemplate += `
---
{{PACKAGE FILES}}
{{CONFIG}}
{{BASEBRANCH}}
{{PRLIST}}
{{WARNINGS}}
{{ERRORS}}
`;
	let prBody = prCommentTemplate;
	if (packageFiles && Object.entries(packageFiles).length) {
		let files = [];
		for (const [manager, managerFiles] of Object.entries(packageFiles)) files = files.concat(managerFiles.map((file) => ` * \`${file.packageFile}\` (${manager})`));
		prBody = `${prBody.replace("{{PACKAGE FILES}}", `### Detected Package Files\n\n${files.join("\n")}`)}\n`;
	} else prBody = prBody.replace("{{PACKAGE FILES}}\n", "");
	let configDesc = "";
	if (GlobalConfig.get("dryRun")) logger.info(`DRY-RUN: Would check branch ${branchName}`);
	else configDesc = getConfigDesc(config);
	prBody = prBody.replace("{{CONFIG}}\n", configDesc);
	prBody = prBody.replace("{{WARNINGS}}\n", getWarnings(config) + getDepWarningsOnboardingPR(packageFiles, config));
	prBody = prBody.replace("{{ERRORS}}\n", getErrors(config));
	prBody = prBody.replace("{{BASEBRANCH}}\n", getBaseBranchDesc(config));
	prBody = prBody.replace("{{PRLIST}}\n", getExpectedPrList(config, branches));
	logger.trace(`prBody:\n${prBody}`);
	prBody = platform.massageMarkdown(prBody);
	if (GlobalConfig.get("dryRun")) {
		logger.info("DRY-RUN: Would ensure comment");
		return true;
	}
	return await ensureComment({
		number: pr.number,
		topic: "Reconfigure PR Results",
		content: prBody
	});
}
function getDescriptionArray(config) {
	logger.debug("getDescriptionArray()");
	logger.trace({ config });
	return (isArray(config.description, isString) ? config.description : []).concat(getScheduleDesc(config));
}
function getConfigDesc(config) {
	logger.debug("getConfigDesc()");
	logger.trace({ config });
	const descriptionArr = getDescriptionArray(config);
	if (!descriptionArr.length) {
		logger.debug("No config description found");
		return "";
	}
	logger.debug(`Found description array with length:${descriptionArr.length}`);
	let desc = `\n### Configuration Summary\n\nBased on the default config's presets, Renovate will:\n\n`;
	descriptionArr.forEach((d) => {
		desc += `  - ${d}\n`;
	});
	desc += "\n\n---\n";
	return desc;
}
//#endregion
export { ensureReconfigurePrComment };

//# sourceMappingURL=comment.js.map