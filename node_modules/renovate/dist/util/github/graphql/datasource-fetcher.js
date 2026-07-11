import { get, set } from "../../cache/memory/index.js";
import { GlobalConfig } from "../../../config/global.js";
import { logger } from "../../../logger/index.js";
import { ExternalHostError } from "../../../types/errors/external-host-error.js";
import { get as get$1, set as set$1 } from "../../cache/package/index.js";
import { getApiBaseUrl } from "../url.js";
import { GithubGraphqlMemoryCacheStrategy } from "./cache-strategies/memory-cache-strategy.js";
import { GithubGraphqlPackageCacheStrategy } from "./cache-strategies/package-cache-strategy.js";
import is from "@sindresorhus/is";
//#region lib/util/github/graphql/datasource-fetcher.ts
/**
* We know empirically that certain type of GraphQL errors
* can be fixed by shrinking page size.
*
* @see https://github.com/renovatebot/renovate/issues/16343
*/
function isUnknownGraphqlError(err) {
	const { message } = err;
	return message.startsWith("Something went wrong while executing your query.");
}
function canBeSolvedByShrinking(err) {
	return (err instanceof AggregateError ? err.errors : [err]).some((e) => err instanceof ExternalHostError || isUnknownGraphqlError(e));
}
var GithubGraphqlDatasourceFetcher = class GithubGraphqlDatasourceFetcher {
	static async query(config, http, adapter) {
		return await new GithubGraphqlDatasourceFetcher(config, http, adapter).getItems();
	}
	baseUrl;
	repoOwner;
	repoName;
	itemsPerQuery = 100;
	queryCount = 0;
	cursor = null;
	isPersistent;
	http;
	datasourceAdapter;
	constructor(packageConfig, http, datasourceAdapter) {
		this.http = http;
		this.datasourceAdapter = datasourceAdapter;
		const { packageName, registryUrl } = packageConfig;
		[this.repoOwner, this.repoName] = packageName.split("/");
		this.baseUrl = getApiBaseUrl(registryUrl).replace(/\/v3\/$/, "/");
	}
	getCacheNs() {
		return this.datasourceAdapter.key;
	}
	getCacheKey() {
		return [
			this.baseUrl,
			this.repoOwner,
			this.repoName
		].join(":");
	}
	getRawQueryOptions() {
		return {
			baseUrl: this.baseUrl,
			repository: `${this.repoOwner}/${this.repoName}`,
			readOnly: true,
			body: {
				query: this.datasourceAdapter.query,
				variables: {
					owner: this.repoOwner,
					name: this.repoName,
					count: this.itemsPerQuery,
					cursor: this.cursor
				}
			}
		};
	}
	async doRawQuery() {
		const requestOptions = this.getRawQueryOptions();
		let httpRes;
		try {
			httpRes = await this.http.postJson("/graphql", requestOptions);
		} catch (err) {
			return [null, err];
		}
		const { body } = httpRes;
		const { data, errors } = body;
		if (errors?.length) if (errors.length === 1) {
			const { message } = errors[0];
			return [null, new Error(message)];
		} else {
			const errorInstances = errors.map(({ message }) => new Error(message));
			return [null, new AggregateError(errorInstances)];
		}
		if (!data) return [null, /* @__PURE__ */ new Error("GitHub GraphQL datasource: failed to obtain data")];
		if (!data.repository) return [null, /* @__PURE__ */ new Error("GitHub GraphQL datasource: failed to obtain repository data")];
		if (!data.repository.payload) return [null, /* @__PURE__ */ new Error("GitHub GraphQL datasource: failed to obtain repository payload data")];
		this.queryCount += 1;
		this.isPersistent ??= data.repository.isRepoPrivate === false;
		return [data.repository.payload, null];
	}
	shrinkPageSize() {
		if (this.itemsPerQuery === 100) {
			this.itemsPerQuery = 50;
			return true;
		}
		if (this.itemsPerQuery === 50) {
			this.itemsPerQuery = 25;
			return true;
		}
		return false;
	}
	hasReachedQueryLimit() {
		return this.queryCount >= 100;
	}
	async doShrinkableQuery() {
		let res = null;
		let err = null;
		while (!res) {
			[res, err] = await this.doRawQuery();
			if (err) {
				if (!canBeSolvedByShrinking(err)) throw err;
				if (!this.shrinkPageSize()) throw err;
				const { body: _, ...options } = this.getRawQueryOptions();
				logger.debug({
					options,
					newSize: this.itemsPerQuery
				}, "Shrinking GitHub GraphQL page size after error");
			}
		}
		return res;
	}
	_cacheStrategy;
	cacheStrategy() {
		if (this._cacheStrategy) return this._cacheStrategy;
		const cacheNs = this.getCacheNs();
		const cacheKey = this.getCacheKey();
		const cachePrivatePackages = GlobalConfig.get("cachePrivatePackages");
		const skipStabilization = !is.undefined(this.datasourceAdapter.maxItems);
		this._cacheStrategy = cachePrivatePackages || this.isPersistent ? new GithubGraphqlPackageCacheStrategy(cacheNs, cacheKey, skipStabilization) : new GithubGraphqlMemoryCacheStrategy(cacheNs, cacheKey, skipStabilization);
		return this._cacheStrategy;
	}
	/**
	* This method is responsible for data synchronization.
	* It also detects persistence of the package, based on the first page result.
	*/
	async doPaginatedFetch() {
		let hasNextPage = true;
		let isPaginationDone = false;
		let nextCursor;
		let itemCount = 0;
		const maxItems = this.datasourceAdapter.maxItems;
		while (hasNextPage && !isPaginationDone && !this.hasReachedQueryLimit()) {
			if (!is.undefined(maxItems) && itemCount >= maxItems) break;
			const queryResult = await this.doShrinkableQuery();
			const resultItems = [];
			for (const node of queryResult.nodes) {
				const item = this.datasourceAdapter.transform(node);
				if (!item) {
					logger.once.info({
						packageName: `${this.repoOwner}/${this.repoName}`,
						baseUrl: this.baseUrl
					}, `GitHub GraphQL datasource: skipping empty item`);
					continue;
				}
				resultItems.push(item);
			}
			itemCount += resultItems.length;
			isPaginationDone = await this.cacheStrategy().reconcile(resultItems);
			hasNextPage = !!queryResult?.pageInfo?.hasNextPage;
			nextCursor = queryResult?.pageInfo?.endCursor;
			if (hasNextPage && nextCursor) this.cursor = nextCursor;
		}
		if (this.isPersistent) await this.storePersistenceFlag(30);
	}
	async doCachedQuery() {
		await this.loadPersistenceFlag();
		if (!this.isPersistent) await this.doPaginatedFetch();
		const res = await this.cacheStrategy().finalizeAndReturn();
		if (res.length) return res;
		delete this.isPersistent;
		await this.doPaginatedFetch();
		return this.cacheStrategy().finalizeAndReturn();
	}
	async loadPersistenceFlag() {
		const ns = this.getCacheNs();
		const key = `${this.getCacheKey()}:is-persistent`;
		this.isPersistent = await get$1(ns, key);
	}
	async storePersistenceFlag(minutes) {
		await set$1(this.getCacheNs(), `${this.getCacheKey()}:is-persistent`, true, minutes);
	}
	/**
	* This method ensures the only one query is executed
	* to a particular package during single run.
	*/
	doUniqueQuery() {
		const cacheKey = `github-pending:${this.getCacheNs()}:${this.getCacheKey()}`;
		let resultPromise = get(cacheKey);
		resultPromise ??= this.doCachedQuery();
		set(cacheKey, resultPromise);
		return resultPromise;
	}
	async getItems() {
		return await this.doUniqueQuery();
	}
};
//#endregion
export { GithubGraphqlDatasourceFetcher };

//# sourceMappingURL=datasource-fetcher.js.map