import { Header } from "@/components/layout";
import { PipelineBoard } from "./components/pipeline-board";

export default function PipelinePage() {
  return (
    <>
      <Header
        title="Pipeline"
        description="Manage your content production workflow"
      />
      <div className="flex-1 overflow-auto p-6">
        <PipelineBoard />
      </div>
    </>
  );
}
