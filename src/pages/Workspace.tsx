import { WorkspaceLayout } from "@/components/workspace/WorkspaceLayout";
import { WorkspaceDashboard } from "@/components/workspace/WorkspaceDashboard";

export default function WorkspacePage() {
  return (
    <WorkspaceLayout>
      <WorkspaceDashboard />
    </WorkspaceLayout>
  );
}
