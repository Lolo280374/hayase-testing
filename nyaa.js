// ==MiruExtension==
// @name        Nyaa (FR only)
// @version     v0.1.1
// @author      yukidarumasandesu (modded by ChatGPT)
// @lang        fr
// @package     nyaa-fr
// @type        bangumi
// @webSite     https://nyaa.si
// @description Nyaa filtered for French-sub/dub torrents only (VOSTFR, VF, FR, FRENCH)
// ==/MiruExtension==

export default class extends Extension {
  async createFilter() {
    return {
      sort: {
        title: "Sort by",
        max : 1,
        min : 1,
        default: "&s=seeders",
        options: {
          "&s=seeders" : "Seeders",
          "&s=leechers": "Leechers",
          "&s=size"    : "Size",
          ""           : "None"
        }
      },
      order: {
        title: "Order",
        max : 1,
        min : 1,
        default: "&o=desc",
        options: {
          "&o=desc": "Descending",
          "&o=asc" : "Ascending"
        }
      }
    };
  }

  async latest(page) {
    return this._scrape("", page);
  }

  async search(query, page = 1, filter = {}) {
    const extra = (filter.sort ?? "") + (filter.order ?? "");
    return this._scrape(query, page, extra);
  }

  async detail(relUrl) {
    const html   = await this.request(relUrl);
    const magnet = html.match(/href="(magnet:[^"]+)"/)?.[1];
    const title  = html.match(/<title>(.*?)\s*\|/)?.[1] ?? "Nyaa torrent";

    return {
      title,
      episodes: [
        {
          title: "Magnet",
          urls : [{ name: title, url: magnet }]
        }
      ]
    };
  }

  async watch(url) {
    return { type: "torrent", url };
  }

  async _scrape(query = "", page = 1, extra = "") {
    const url  = `/?f=0&c=1_0&q=${encodeURIComponent(query)}&p=${page}${extra}`;
    const html = await this.request(url);
    const rows = html.match(/<tr class="default"[\s\S]+?<\/tr>/g) ?? [];

    // Filter for French-relevant keywords
    const frRegex = /\b(vostfr|vf|french|[^a-z]fr[^a-z])\b/i;

    return rows.map(row => {
      const title    = row.match(/title="([^"]+)"/)?.[1] ?? "Untitled";
      if (!frRegex.test(title)) return null;

      const relUrl   = row.match(/href="(\/view\/\d+)"/)?.[1]  ?? "";
      const seeders  = row.match(/<td class="text-success">(\d+)<\/td>/)?.[1] ?? "0";
      const leechers = row.match(/<td class="text-danger">(\d+)<\/td>/)?.[1] ?? "0";

      return {
        title,
        url   : relUrl,
        update: `Seeders: ${seeders} | Leechers: ${leechers}`
      };
    }).filter(item => item !== null);
  }
}
