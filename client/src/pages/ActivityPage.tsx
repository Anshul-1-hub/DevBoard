import { useQuery } from "@tanstack/react-query";
import api from "../lib/api";

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
  if (diff.status) return `moved issue to ${diff.status.replace("_", " ").toLowerCase()}`;
  if (diff.priority) return `changed priority to ${diff.priority.toLowerCase()}`;
  if (diff.title) return `renamed issue to "${diff.title}"`;
  if (diff.assigneeId !== undefined) return "updated assignee";
  return "updated an issue";
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

export default function ActivityPage({ orgId }: { orgId: string | undefined}) {
  const headers = { "x-organization-id": orgId };

  const { data: logs = [], isLoading } = useQuery<AuditLog[]>({
    queryKey: ["activity", orgId],
    queryFn: () => api.get("/activity", { headers }).then((r) => r.data),
    refetchInterval: 10000,
  });

  if (isLoading) return <div className="p-8 text-gray-500 text-sm">Loading...</div>;

  return (
    <div className="p-6 max-w-2xl">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">Activity</h2>

      {logs.length === 0 ? (
        <p className="text-gray-400 text-sm">No activity yet. Create some issues to get started.</p>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => (
            <div key={log.id} className="flex items-start gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3">
              <div className="mt-0.5">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ACTION_COLORS[log.action] ?? "bg-gray-100 text-gray-600"}`}>
                  {log.action}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800">
                  <span className="font-medium">{log.actorName}</span>{" "}
                  {formatDiff(log.action, log.diff)}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{timeAgo(log.createdAt)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}