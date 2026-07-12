import { useQuery } from "@tanstack/react-query";
import api from "../lib/api";
import { Navbar } from "../components/Navbar";
import { authClient } from "../lib/auth-client";

interface AuditLog {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  actorName: string;
  diff: Record<string, any>;
  createdAt: string;
}

const ACTION_COLORS: Record<string, string> = {
  created: "bg-green-100 text-green-700",
  updated: "bg-blue-100 text-blue-700",
  deleted: "bg-red-100 text-red-700",
};

function formatDiff(action: string, diff: Record<string, any>) {
  if (action === "created") return `created issue "${diff.title}"`;
  if (action === "deleted") return "deleted an issue";
  if (diff.status) return `moved issue to ${diff.status.replace("_", " ").toLowerCase()}.`;
  if (diff.priority) return `changed priority to ${diff.priority.toLowerCase()}.`;
  if (diff.title) return `renamed issue to "${diff.title}."`;
  if (diff.assigneeId !== undefined) return "updated assignee";
  return "updated an issue.";
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

async function signOut(){
  await authClient.signOut();
}

export default function ActivityPage({ orgId }: { orgId: string | undefined}) {
  const headers = { "x-organization-id": orgId };

  const { data: logs = [], isLoading } = useQuery<AuditLog[]>({
    queryKey: ["activity", orgId],
    queryFn: () => api.get("/activity", { headers }).then((r) => r.data),
    refetchInterval: 10000,
  });

  if (isLoading) return <div className="p-8 text-gray-500 text-sm">Loading...</div>;

  return (
    <div className="bg-bg min-h-screen">
      <Navbar signOut={signOut}/>
      <div className="p-6 max-w-full px-60">
        <h2 className="text-2xl text-center font-semibold text-primary mb-6">Activities</h2>

        {logs.length === 0 ? (
          <p className="text-white text-sm">No activity yet. Create some issues to get started.</p>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <div key={log.id} className="flex items-start gap-3 bg-surface border border-border rounded-xl px-4 py-3">
                <div className="mt-0.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ACTION_COLORS[log.action] ?? "bg-gray-100 text-gray-600"}`}>
                    {log.action}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800">
                    <span className="font-medium text-primary">{log.actorName}</span>{" "}
                    <span className="text-secondary">{formatDiff(log.action, log.diff)}</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{timeAgo(log.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}