import type { Metadata } from "next";
import { Deck } from "./deck";

export const metadata: Metadata = { title: "Presentation" };

export default function PresentationPage() {
  return <Deck />;
}
