/**
 * AuthDebugBadge - DEV ONLY
 * 
 * Shows auth state at a glance for debugging redirect issues.
 * Click to expand/collapse.
 */

import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function AuthDebugBadge() {
  const { status, user, profile, roles, isAdmin, onboardingCompleted } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(true);

  const primaryRole = isAdmin ? 'admin' : roles[0] ?? 'none';

  const rows = [
    ["status", status],
    ["userId", user?.id ? user.id.slice(0, 8) + "…" : "null"],
    ["email", user?.email ?? "null"],
    ["roles", roles.length > 0 ? roles.join(", ") : "none"],
    ["profile", profile ? "✓" : "✗"],
    ["onboarding", onboardingCompleted ? "✓" : "✗"],
    ["path", location.pathname],
  ];

  return (
    <div
      className="fixed bottom-4 right-4 z-[9999] font-mono text-xs cursor-pointer select-none"
      onClick={() => setCollapsed((v) => !v)}
      title="DEV Auth Debug (click to expand/collapse)"
    >
      {collapsed ? (
        <div className="flex items-center gap-2 bg-gray-900/90 text-white px-3 py-1.5 rounded-full shadow-lg border border-gray-700">
          <span className="text-gray-400">AUTH</span>
          <span className={status === 'authenticated' ? 'text-green-400' : status === 'loading' ? 'text-yellow-400' : 'text-red-400'}>
            {status}
          </span>
          <span className="text-blue-400">{primaryRole}</span>
        </div>
      ) : (
        <div className="bg-gray-900/95 text-white p-3 rounded-lg shadow-xl border border-gray-700 min-w-[200px]">
          <div className="flex justify-between items-center mb-2">
            <span className="font-bold text-gray-300">DEV Auth Debug</span>
            <span className="text-gray-500 text-[10px]">click to collapse</span>
          </div>
          <hr className="border-gray-700 mb-2" />
          <div className="space-y-1">
            {rows.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4">
                <span className="text-gray-400">{k}</span>
                <span className="text-white truncate max-w-[120px]">{v}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
