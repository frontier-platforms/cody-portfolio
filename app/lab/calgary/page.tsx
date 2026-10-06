import type { Metadata } from "next";
import { PermitsDemo } from "@/components/lab/LabDemos";
import { LabPage } from "@/components/lab/LabPage";

export const metadata: Metadata = {
  title: "Lab: Calgary building permits",
  description:
    "Every Calgary building permit since 2015, with a tested pipeline you can run live, a dashboard and Claude-written SQL, all in your browser.",
};

export default function CalgaryLab() {
  return (
    <LabPage
      dataset="permits"
      intro={
        <p>
          Housing supply is the city’s biggest conversation. This is every building permit application since
          2015: how many homes were permitted, how long permits took, and which communities are growing.
        </p>
      }
      dashboard={<PermitsDemo />}
    />
  );
}
