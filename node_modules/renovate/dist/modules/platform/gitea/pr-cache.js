import { TEMPORARY_ERROR } from "../../../constants/error-messages.js";
import { get, set } from "../../../util/cache/memory/index.js";
import { logger } from "../../../logger/index.js";
import { getQueryString, parseLinkHeader, parseUrl } from "../../../util/url.js";
import { getCache } from "../../../util/cache/repository/index.js";
import { API_PATH, toRenovatePR } from "./utils.js";
import { isNullOrUndefined } from "@sindresorhus/is";
import { dequal } from "dequal";
import { DateTime } from "luxon";
//#region lib/modules/platform/gitea/pr-cache.ts
var GiteaPrCache = class GiteaPrCache {
	cache;
	items = [];
	repo;
	ignorePrAuthor;
	author;
	constructor(repo, ignorePrAuthor, author) {
		this.repo = repo;
		this.ignorePrAuthor = ignorePrAuthor;
		this.author = author;
		const repoCache = getCache();
		repoCache.platform ??= {};
		repoCache.platform.gitea ??= {};
		let pullRequestCache = repoCache.platform.gitea.pullRequestsCache;
		if (isNullOrUndefined(pullRequestCache) || pullRequestCache.author !== author) pullRequestCache = {
			items: {},
			updated_at: null,
			author
		};
		repoCache.platform.gitea.pullRequestsCache = pullRequestCache;
		this.cache = pullRequestCache;
		this.updateItems();
	}
	static forceSync() {
		set("gitea-pr-cache-synced", false);
	}
	static async init(http, repo, ignorePrAuthor, author) {
		const res = new GiteaPrCache(repo, ignorePrAuthor, author);
		if (!get("gitea-pr-cache-synced")) {
			await res.sync(http);
			set("gitea-pr-cache-synced", true);
		}
		return res;
	}
	getPrs() {
		return this.items;
	}
	static async getPrs(http, repo, ignorePrAuthor, author) {
		return (await GiteaPrCache.init(http, repo, ignorePrAuthor, author)).getPrs();
	}
	setPr(item) {
		this.cache.items[item.number] = item;
		this.updateItems();
	}
	static async setPr(http, repo, ignorePrAuthor, author, item) {
		(await GiteaPrCache.init(http, repo, ignorePrAuthor, author)).setPr(item);
	}
	reconcile(rawItems) {
		const { items } = this.cache;
		let { updated_at } = this.cache;
		const cacheTime = updated_at ? DateTime.fromISO(updated_at) : null;
		let needNextPage = true;
		for (const rawItem of rawItems) {
			if (!rawItem) {
				logger.warn("Gitea PR is empty, throwing temporary error");
				throw new Error(TEMPORARY_ERROR);
			}
			const id = rawItem.number;
			const newItem = toRenovatePR(rawItem, this.author);
			if (!newItem) continue;
			const oldItem = items[id];
			if (dequal(oldItem, newItem)) {
				needNextPage = false;
				continue;
			}
			items[id] = newItem;
			const itemTime = DateTime.fromISO(rawItem.updated_at);
			if (!cacheTime || itemTime > cacheTime) updated_at = rawItem.updated_at;
		}
		this.cache.updated_at = updated_at;
		return needNextPage;
	}
	async sync(http) {
		let query = getQueryString({
			state: "all",
			sort: "recentupdate",
			limit: this.items.length ? 20 : 100,
			...this.ignorePrAuthor ? {} : { poster: this.author }
		});
		while (query) {
			const res = await http.getJsonUnchecked(`${API_PATH}/repos/${this.repo}/pulls?${query}`, {
				memCache: false,
				paginate: false
			});
			if (!this.reconcile(res.body)) break;
			const uri = parseUrl(parseLinkHeader(res.headers.link)?.next?.url);
			query = uri ? uri.search : null;
		}
		this.updateItems();
		return this;
	}
	/**
	* Ensure the pr cache starts with the most recent PRs.
	* JavaScript ensures that the cache is sorted by PR number.
	*/
	updateItems() {
		this.items = Object.values(this.cache.items).reverse();
	}
};
//#endregion
export { GiteaPrCache };

//# sourceMappingURL=pr-cache.js.map