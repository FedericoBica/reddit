import type { Metadata } from "next";
import { getScheduleSettings } from "@/db/queries/admin";
import { ScheduleForm } from "./schedule-form";

export const metadata: Metadata = { title: "Admin — Schedule" };

export default async function AdminSchedulePage() {
  const settings = await getScheduleSettings();

  return (
    <div className="app-page">
      <header className="page-header">
        <div>
          <p className="page-kicker">Admin</p>
          <h1 className="page-title">Scrape schedule</h1>
          <p className="page-copy">
            Global UTC times for each job type. Billing plan controls the interval
            (how often per week/day); this controls what time of day it fires.
          </p>
        </div>
      </header>

      <section style={{ maxWidth: 560, padding: "0 32px 48px" }}>
        <ScheduleForm settings={settings} />
      </section>
    </div>
  );
}
