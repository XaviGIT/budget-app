import { AnalysisList } from "@/components/analysis/analysis-list";
import { Suspense } from "react";

export default function AnalysisPage() {
  return (
    <Suspense fallback={<div className="p-8">Loading analysis...</div>}>
      <AnalysisList />
    </Suspense>
  );
}
