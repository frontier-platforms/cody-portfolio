import type { Metadata } from "next";
import { SLIDES } from "../slides";
import { SlideFrame } from "../slide-kit";

export const metadata: Metadata = { title: "Presentation (print)", robots: { index: false } };

// Every slide at its native 1280x720, one per page. Used to export the PDF and PowerPoint downloads.
export default function PrintDeck() {
  return (
    <>
      <style>{`
        @page { size: 1280px 720px; margin: 0; }
        html, body { margin: 0; background: #fff; }
        .print-slide { width: 1280px; height: 720px; break-after: page; overflow: hidden; }
        .print-slide:last-child { break-after: auto; }
      `}</style>
      {SLIDES.map((s, i) => (
        <section key={s.id} className="print-slide" data-slide={i + 1} data-notes={JSON.stringify(s.notes)}>
          <SlideFrame slide={s} index={i} total={SLIDES.length} />
        </section>
      ))}
    </>
  );
}
