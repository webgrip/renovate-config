import { CONFIG_VALIDATION, REPOSITORY_CHANGED } from "../../../constants/error-messages.js";
import { pkg } from "../../../expose.js";
import { setUserEnv } from "../../../util/env.js";
import { regEx } from "../../../util/regex.js";
import { getConfigFileNames } from "../../../config/app-strings.js";
import { coerceString } from "../../../util/string.js";
import { logger } from "../../../logger/index.js";
import { clone } from "../../../util/clone.js";
import { mergeChildConfig } from "../../../config/utils.js";
import { migrateConfig } from "../../../config/migration.js";
import { add } from "../../../util/host-rules.js";
import { getInheritedOrGlobal, parseJson } from "../../../util/common.js";
import { coerceArray } from "../../../util/array.js";
import { ExternalHostError } from "../../../types/errors/external-host-error.js";
import { resolveConfigPresets } from "../../../config/presets/index.js";
import { validateConfig } from "../../../config/validation.js";
import { readLocalFile, readSystemFile } from "../../../util/fs/index.js";
import { decryptConfig } from "../../../config/decrypt.js";
import { applySecretsAndVariablesToConfig } from "../../../config/secrets.js";
import { clear } from "../../../util/http/queue.js";
import { clear as clear$1 } from "../../../util/http/throttle.js";
import { getCache } from "../../../util/cache/repository/index.js";
import { maskToken } from "../../../util/mask.js";
import { coerceObject } from "../../../util/object.js";
import { setNpmrc } from "../../../modules/datasource/npm/npmrc.js";
import "../../../modules/datasource/npm/index.js";
import { scm } from "../../../modules/platform/scm.js";
import { platform } from "../../../modules/platform/index.js";
import "../../../config/index.js";
import { migrateAndValidate } from "../../../config/migrate-validate.js";
import { parseFileConfig } from "../../../config/parse.js";
import { getOnboardingConfig } from "../onboarding/branch/config.js";
import { getOnboardingConfigFromCache, getOnboardingFileNameFromCache, setOnboardingConfigDetails } from "../onboarding/branch/onboarding-branch-cache.js";
import { OnboardingState, getDefaultConfigFileName } from "../onboarding/common.js";
import { isNonEmptyArray, isNonEmptyObject, isNonEmptyString, isString } from "@sindresorhus/is";
//#region lib/workers/repository/init/merge.ts
async function detectConfigFile() {
	const fileList = await scm.getFileList();
	for (const fileName of getConfigFileNames()) if (fileName === "package.json") try {
		if (JSON.parse(await readLocalFile("package.json", "utf8")).renovate) {
			logger.warn("Using package.json for Renovate config is deprecated - please use a dedicated configuration file instead");
			return "package.json";
		}
	} catch {}
	else if (fileList.includes(fileName)) return fileName;
	return null;
}
async function detectRepoFileConfig(branchName) {
	const cache = getCache();
	let { configFileName } = cache;
	if (isNonEmptyString(configFileName)) {
		let configFileRaw;
		try {
			configFileRaw = await platform.getRawFile(configFileName, void 0, branchName);
		} catch (err) {
			// istanbul ignore if
			if (err instanceof ExternalHostError) throw err;
			configFileRaw = null;
		}
		if (configFileRaw) {
			let configFileParsed = parseJson(configFileRaw, configFileName);
			if (configFileName === "package.json") configFileParsed = configFileParsed.renovate;
			return {
				configFileName,
				configFileParsed
			};
		} else {
			logger.debug("Existing config file no longer exists");
			delete cache.configFileName;
		}
	}
	if (OnboardingState.onboardingCacheValid) configFileName = getOnboardingFileNameFromCache();
	else configFileName = coerceString(await detectConfigFile());
	if (!configFileName) {
		logger.debug("No renovate config file found");
		cache.configFileName = "";
		return {};
	}
	cache.configFileName = configFileName;
	logger.debug(`Found ${configFileName} config file`);
	let configFileParsed;
	let configFileRaw;
	if (OnboardingState.onboardingCacheValid) {
		const cachedConfig = getOnboardingConfigFromCache();
		const parsedConfig = cachedConfig ? JSON.parse(cachedConfig) : void 0;
		if (parsedConfig) {
			setOnboardingConfigDetails(configFileName, JSON.stringify(parsedConfig));
			return {
				configFileName,
				configFileParsed: parsedConfig
			};
		}
	}
	if (configFileName === "package.json") {
		configFileParsed = JSON.parse(await readLocalFile("package.json", "utf8")).renovate;
		if (isString(configFileParsed)) {
			logger.debug("Massaging string renovate config to extends array");
			configFileParsed = { extends: [configFileParsed] };
		}
		logger.debug({ config: configFileParsed }, "package.json>renovate config");
	} else {
		configFileRaw = await readLocalFile(configFileName, "utf8");
		// istanbul ignore if
		if (!isString(configFileRaw)) {
			logger.warn({ configFileName }, "Null contents when reading config file");
			throw new Error(REPOSITORY_CHANGED);
		}
		// istanbul ignore if
		if (!configFileRaw.length) configFileRaw = "{}";
		const parseResult = parseFileConfig(configFileName, configFileRaw);
		if (!parseResult.success) return {
			configFileName,
			configFileParseError: {
				validationError: parseResult.validationError,
				validationMessage: parseResult.validationMessage
			}
		};
		configFileParsed = parseResult.parsedContents;
		logger.debug({
			fileName: configFileName,
			config: configFileParsed
		}, "Repository config");
	}
	setOnboardingConfigDetails(configFileName, JSON.stringify(configFileParsed));
	return {
		configFileName,
		configFileParsed
	};
}
function checkForRepoConfigError(repoConfig) {
	if (!repoConfig.configFileParseError) return;
	const error = new Error(CONFIG_VALIDATION);
	error.validationSource = repoConfig.configFileName;
	error.validationError = repoConfig.configFileParseError.validationError;
	error.validationMessage = repoConfig.configFileParseError.validationMessage;
	throw error;
}
async function mergeRenovateConfig(config, branchName) {
	let returnConfig = { ...config };
	let repoConfig = {};
	if (getInheritedOrGlobal("requireConfig") !== "ignored") repoConfig = await detectRepoFileConfig(branchName);
	if (!repoConfig.configFileParsed && config.mode === "silent") {
		logger.debug("When mode=silent and repo has no config file, we use the onboarding config as repo config");
		repoConfig = {
			configFileName: getDefaultConfigFileName(),
			configFileParsed: await getOnboardingConfig(config)
		};
	}
	const resolvedRepoConfig = await resolveStaticRepoConfig(coerceObject(repoConfig?.configFileParsed), process.env.RENOVATE_X_STATIC_REPO_CONFIG_FILE);
	const repoEntryConfig = returnConfig.repositoryEntryConfig;
	delete returnConfig.repositoryEntryConfig;
	if (isNonEmptyObject(repoEntryConfig)) {
		const repoEntry = repoEntryConfig;
		const toResolve = {
			...repoEntry,
			extends: [...coerceArray(returnConfig.extends), ...coerceArray(repoEntry.extends)],
			ignorePresets: [
				...coerceArray(returnConfig.ignorePresets),
				...coerceArray(repoEntry.ignorePresets),
				...coerceArray(resolvedRepoConfig.ignorePresets)
			]
		};
		delete returnConfig.extends;
		const { config: resolvedRepoEntry } = await resolveConfigPresets(toResolve, config);
		applyNpmrc(resolvedRepoEntry, "resolvedRepoEntry");
		const resolvedRepoEntryWithSecrets = applySecretsAndVariablesToConfig({
			config: resolvedRepoEntry,
			secrets: config.secrets,
			variables: config.variables
		});
		applyHostRules(resolvedRepoEntryWithSecrets);
		returnConfig = mergeChildConfig(returnConfig, resolvedRepoEntryWithSecrets);
	}
	if (isNonEmptyArray(returnConfig.extends)) {
		resolvedRepoConfig.extends = [...coerceArray(returnConfig.extends), ...coerceArray(resolvedRepoConfig.extends)];
		delete returnConfig.extends;
	}
	checkForRepoConfigError(repoConfig);
	const migratedConfig = await migrateAndValidate(config, resolvedRepoConfig);
	if (migratedConfig.errors?.length) {
		const error = new Error(CONFIG_VALIDATION);
		error.validationSource = repoConfig.configFileName;
		error.validationError = "The renovate configuration file contains some invalid settings";
		error.validationMessage = migratedConfig.errors.map((e) => e.message).join(", ");
		throw error;
	}
	if (migratedConfig.warnings) returnConfig.warnings = [...coerceArray(returnConfig.warnings), ...migratedConfig.warnings];
	delete migratedConfig.errors;
	delete migratedConfig.warnings;
	const repository = config.repository;
	const decryptedConfig = await decryptConfig(migratedConfig, repository);
	applyNpmrc(decryptedConfig, "decrypted");
	await logShallowConfig(decryptedConfig, config);
	const { config: configToDecrypt } = await resolveConfigPresets(decryptedConfig, config, config.ignorePresets);
	let resolvedConfig = await decryptConfig(configToDecrypt, repository);
	logger.trace({ config: resolvedConfig }, "resolved config");
	const migrationResult = migrateConfig(resolvedConfig);
	if (migrationResult.isMigrated) {
		logger.debug("Resolved config needs migrating");
		logger.trace({ config: resolvedConfig }, "resolved config after migrating");
		resolvedConfig = migrationResult.migratedConfig;
	}
	if (isString(resolvedConfig.npmrc)) logger.debug("Ignoring any .npmrc files in repository due to configured npmrc");
	applyNpmrc(resolvedConfig, "resolved");
	resolvedConfig = applySecretsAndVariablesToConfig({
		config: resolvedConfig,
		secrets: mergeChildConfig(coerceObject(config.secrets), coerceObject(resolvedConfig.secrets)),
		variables: mergeChildConfig(coerceObject(config.variables), coerceObject(resolvedConfig.variables))
	});
	applyHostRules(resolvedConfig);
	returnConfig = mergeChildConfig(returnConfig, resolvedConfig);
	({config: returnConfig} = await resolveConfigPresets(returnConfig, config));
	returnConfig.renovateJsonPresent = true;
	// istanbul ignore if
	if (returnConfig.ignorePaths?.length) logger.debug({ ignorePaths: returnConfig.ignorePaths }, `Found repo ignorePaths`);
	setUserEnv(returnConfig.env);
	delete returnConfig.env;
	return returnConfig;
}
function applyNpmrc(config, configType) {
	setNpmTokenInNpmrc(config);
	if (!isString(config.npmrc)) return;
	logger.debug(`Setting npmrc from ${configType ? `${configType} ` : ""}config`);
	setNpmrc(config.npmrc);
}
function applyHostRules(config) {
	if (!config.hostRules) return;
	logger.debug("Setting hostRules from config");
	for (const rule of config.hostRules) try {
		add(rule);
	} catch (err) {
		logger.warn({
			err,
			config: rule
		}, "Error setting hostRule from config");
	}
	clear();
	clear$1();
	delete config.hostRules;
}
/** needed when using portal secrets for npmToken */
function setNpmTokenInNpmrc(config) {
	if (!isString(config.npmToken)) return;
	const token = config.npmToken;
	logger.debug({ npmToken: maskToken(token) }, "Migrating npmToken to npmrc");
	if (!isString(config.npmrc)) {
		logger.debug("Adding npmrc to config");
		config.npmrc = `//registry.npmjs.org/:_authToken=${token}\n`;
		delete config.npmToken;
		return;
	}
	if (config.npmrc.includes(`\${NPM_TOKEN}`)) {
		logger.debug(`Replacing \${NPM_TOKEN} with npmToken`);
		config.npmrc = config.npmrc.replace(regEx(/\${NPM_TOKEN}/g), token);
	} else {
		logger.debug("Appending _authToken= to end of existing npmrc");
		config.npmrc = config.npmrc.replace(regEx(/\n?$/), `\n_authToken=${token}\n`);
	}
	delete config.npmToken;
}
async function resolveStaticRepoConfig(config, filename) {
	if (!isNonEmptyString(filename)) return config;
	let staticRepoConfig;
	try {
		staticRepoConfig = await tryReadStaticRepoFileConfig(filename);
	} catch (err) {
		logger.fatal({ err }, "Failed to load static repository config file");
		process.exit(1);
	}
	if (!isNonEmptyObject(staticRepoConfig)) return config;
	return mergeStaticConfig(config, staticRepoConfig);
}
async function tryReadStaticRepoFileConfig(staticRepoConfigFile) {
	logger.debug(`Reading static repo config file from ${staticRepoConfigFile}`);
	let staticRepoConfigRaw;
	try {
		staticRepoConfigRaw = await readSystemFile(staticRepoConfigFile, "utf8");
	} catch (err) {
		throw new Error(`Failed to read static repo config file: "${staticRepoConfigFile}"`, { cause: err });
	}
	const staticRepoConfig = parseJson(staticRepoConfigRaw, staticRepoConfigFile);
	const { errors, warnings } = await validateConfig("repo", staticRepoConfig);
	if (isNonEmptyArray(errors) || isNonEmptyArray(warnings)) logger.info({
		errors,
		warnings
	}, "Static repo config validation issues detected");
	else logger.debug({ staticRepoConfig }, "Static repository config file successfully parsed and validated");
	return staticRepoConfig;
}
function mergeStaticConfig(config, staticRepoConfig) {
	if (isNonEmptyArray(staticRepoConfig.extends)) {
		config.extends = [...staticRepoConfig.extends, ...coerceArray(config.extends)];
		delete staticRepoConfig.extends;
	}
	return mergeChildConfig(staticRepoConfig, config);
}
/**
* Resolve everything but internal Renovate presets and log it out.
*
* This allows users to understand the fully resolved configuration, including any `github>`, `local>`, etc presets, but excluding anything that's internal to Renovate (which can be verbose and/or less relevant), and provides useful output for debugging purposes.

* This is also known as the "shallow" config.

* Due to caching, this doesn't add any additional requests.
*/
async function logShallowConfig(_decryptedConfig, _config) {
	const decryptedConfig = clone(_decryptedConfig);
	const config = clone(_config);
	const { config: resolvedConfig, visitedPresets } = await resolveConfigPresets(clone(decryptedConfig), clone(config), [], [], false);
	logger.debug({
		renovateVersion: pkg.version,
		config: resolvedConfig,
		visitedPresets
	}, "Resolved shallow config, without merging internal presets");
}
//#endregion
export { applyHostRules, detectConfigFile, detectRepoFileConfig, mergeRenovateConfig };

//# sourceMappingURL=merge.js.map