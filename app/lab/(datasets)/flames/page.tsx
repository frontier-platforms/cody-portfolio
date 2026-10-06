import type { Metadata } from "next";
import { FlamesDemo } from "@/components/lab/LabDemos";
import { LabPage } from "@/components/lab/LabPage";

export const metadata: Metadata = {
  title: "Lab: Calgary Flames",
  description:
    "Calgary Flames play-by-play since 2021-22: shot maps, scorers and the points race, with a tested pipeline you can run live in your browser.",
};

export default function FlamesLab() {
  return <LabPage dataset="flames" dashboard={<FlamesDemo />} />;
}
