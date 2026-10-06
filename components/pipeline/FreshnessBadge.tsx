"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** Age of the snapshot against its SLA, computed in the browser so it's never stale. */
export function FreshnessBadge({ runAt, slaDays }: { runAt: string; slaDays: number }) {
  const now = useSyncExternalStore(
    subscribe,
    () => Math.floor(Date.now() / 60_000),
    () => null,
  );
  if (now == null) return <span>{runAt.slice(0, 10)}</span>;

  const hours = (now * 60_000 - Date.parse(runAt)) / 3_600_000;
  const fresh = hours <= slaDays * 24;
  const age =
    hours < 1 ? "under an hour" : hours < 48 ? `${Math.round(hours)} h` : `${Math.round(hours / 24)} days`;

  return (
    <span className="flex flex-col">
      <span>{age} ago</span>
      <span className={`text-xs ${fresh ? "text-[#15803d] dark:text-[#4ade80]" : "text-flames"}`}>
        {fresh ? "● within SLA" : "● past SLA"}
      </span>
    </span>
  );
}
