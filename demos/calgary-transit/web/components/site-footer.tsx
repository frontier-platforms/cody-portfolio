import { CODE_URL, DBT_DOCS_URL } from "@/lib/paths";

export function SiteFooter() {
  return (
    <footer className="bg-cgy-slate text-sm text-white/80">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 sm:flex-row sm:items-start sm:justify-between sm:px-6">
        <p className="max-w-2xl">
          An independent project by Cody Chandler, built for a City of Calgary interview. Contains information licensed
          under the{" "}
          <a className="underline hover:text-white" href="https://data.calgary.ca/d/Open-Data-Terms/u45n-7awa">
            Open Government Licence – City of Calgary
          </a>
          . Not affiliated with or endorsed by The City of Calgary.
        </p>
        <div className="flex gap-4 font-semibold">
          <a className="hover:text-white" href={CODE_URL}>
            GitHub
          </a>
          <a className="hover:text-white" href={DBT_DOCS_URL}>
            dbt docs
          </a>
        </div>
      </div>
    </footer>
  );
}
