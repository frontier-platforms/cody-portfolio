"use client";

import { PanelState } from "@/components/panel";
import { useQuery } from "@/lib/use-query";
import { fmtDate } from "@/lib/format";

type Row = {
  domain: string;
  data_owner: string;
  publish_cadence: string;
  freshness_target_days: number;
  incident_tier: string;
  accuracy_rule: string;
  latest_data_date: string;
  freshness_status: string;
};

const SQL = `
select domain, data_owner, publish_cadence, freshness_target_days, incident_tier,
       accuracy_rule, latest_data_date, freshness_status
from data_contract_status
order by incident_tier, domain`;

export function ContractTable() {
  const { rows, error } = useQuery<Row>(SQL);
  if (!rows) return <PanelState error={error} height={160} />;
  return (
    <div className="overflow-x-auto rounded-lg border border-cgy-line">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="bg-cgy-mist text-cgy-navy">
          <tr>
            {["Domain", "Owner and cadence", "Freshness target", "Tier", "Accuracy rule", "Status"].map((h) => (
              <th key={h} className="px-3 py-2 font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.domain} className="border-t border-cgy-line align-top">
              <td className="px-3 py-2 font-semibold text-cgy-navy">{r.domain}</td>
              <td className="px-3 py-2">
                {r.data_owner}
                <span className="block text-xs text-cgy-grey">{r.publish_cadence}</span>
              </td>
              <td className="px-3 py-2 whitespace-nowrap">{r.freshness_target_days} days</td>
              <td className="px-3 py-2 whitespace-nowrap">{r.incident_tier}</td>
              <td className="px-3 py-2">{r.accuracy_rule}</td>
              <td className="px-3 py-2">
                <span
                  className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-bold text-white ${
                    r.freshness_status === "Meeting target" ? "bg-cgy-green" : "bg-cgy-orange"
                  }`}
                >
                  {r.freshness_status}
                </span>
                <span className="mt-1 block text-xs text-cgy-grey">Data to {fmtDate(r.latest_data_date)}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
