import type { Metadata } from "next";
import { HousingDemo, ValueModelDemo } from "@/components/lab/LabDemos";
import { LabPage } from "@/components/lab/LabPage";

export const metadata: Metadata = {
  title: "Lab: Calgary home values",
  description:
    "Every Calgary home's 2026 assessment, a gradient-boosted value model with explained estimates, and a panel to retrain it in your browser.",
};

export default function HousingLab() {
  return (
    <LabPage
      dataset="housing"
      intro={
        <p>
          Every home in Calgary has a 2026 assessed value: the City’s estimate of what it would have sold for
          on July 1, 2025. Here are about 488,000 of them, by community, type and age. Calgary’s sale prices
          aren’t open data, so assessments are the best public view of home values.
        </p>
      }
      dashboard={<HousingDemo />}
      extras={[
        {
          id: "model",
          label: "Value model",
          intro: (
            <>
              <p>
                A machine-learning model that estimates a home’s assessed value from five public facts:
                community, property type, zoning, year built and lot size. It explains every estimate, and
                it’s judged against the obvious baseline, not against nothing.
              </p>
              <p>
                It’s scikit-learn, trained in Python. The same Python file trains in the weekly pipeline and,
                through Pyodide, in your browser.
              </p>
            </>
          ),
          content: <ValueModelDemo />,
        },
      ]}
    />
  );
}
