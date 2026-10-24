{% docs __overview__ %}
# Calgary Transit data product

One governed data layer for Calgary Transit, built on City of Calgary open data and refreshed daily by Airflow.

| Layer | Schema | What it holds |
|---|---|---|
| Bronze | `bronze` | Raw JSON records exactly as the City publishes them, plus a load log |
| Reference | `reference` | Seeds: agency codes, service categories, fare products, and the data contract |
| Silver | `silver` | Typed, deduplicated facts with one definition across reorganizations |
| Gold | `gold` | Consumption tables, each with one declared grain. The only layer the website and AI agent can read |

**Start here:** open the lineage graph (bottom right) to follow any gold table back to its source, or read
`data_contract_status` to see how current each domain is against its target.

Source code: [github.com/frontier-platforms/cody-portfolio (demos/calgary-transit)](https://github.com/frontier-platforms/cody-portfolio/tree/main/demos/calgary-transit)
{% enddocs %}
