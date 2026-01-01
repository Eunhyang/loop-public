import { Header } from "@/components/layout";
import { OpportunityDashboard } from "@/components/opportunity";

export default function OpportunityPage() {
  return (
    <>
      <Header
        title="Opportunity"
        description="콘텐츠 기회를 발견하고 평가하세요"
      />
      <div className="flex-1 overflow-auto">
        <OpportunityDashboard />
      </div>
    </>
  );
}
