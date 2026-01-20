import { Outlet } from "react-router-dom";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { AppRail } from "@/components/workspace/AppRail";
import { ContextColumnsContainer } from "@/components/workspace/ContextColumns";
import { AIColumn } from "@/components/workspace/AIColumn";
import { useWorkspaceStore } from "@/stores/workspaceStore";

interface WorkspaceLayoutProps {
  children?: React.ReactNode;
}

export function WorkspaceLayout({ children }: WorkspaceLayoutProps) {
  const { aiColumnOpen, contextColumns } = useWorkspaceStore();

  return (
    <div className="h-screen w-full flex bg-background overflow-hidden">
      {/* App Rail - Left */}
      <AppRail />

      {/* Main Content Area */}
      <div className="flex-1 flex min-w-0">
        {/* Primary Column - Center */}
        <motion.main
          className="flex-1 min-w-0 h-full overflow-hidden"
          layout
          transition={{ duration: 0.2 }}
        >
          <div className="h-full overflow-auto">
            {children || <Outlet />}
          </div>
        </motion.main>

        {/* Context Columns - Right side, stacking */}
        {contextColumns.length > 0 && (
          <ContextColumnsContainer />
        )}
      </div>

      {/* AI Column - Far Right (or FAB when closed) */}
      <AIColumn />
    </div>
  );
}
