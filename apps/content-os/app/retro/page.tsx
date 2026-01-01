import { Header } from "@/components/layout";
import { RetroDashboard } from "./components";

export default function RetroPage() {
  return (
    <>
      <Header
        title="Retro"
        description="콘텐츠 성과 분석 및 학습 대시보드"
      />
      <div className="flex-1 overflow-auto">
        <RetroDashboard />
      </div>
    </>
  );
}
