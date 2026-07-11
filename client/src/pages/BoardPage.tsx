import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authClient } from "../lib/auth-client";
import api from "../lib/api";
import socket from "../lib/socket";
import { Navbar } from "../components/Navbar";
import type { Issue, IssueStatus } from "../types";

const COLUMNS: { status: IssueStatus; label: string }[] = [
  { status: "TODO", label: "Todo" },
  { status: "IN_PROGRESS", label: "In Progress" },
  { status: "DONE", label: "Done" },
];

const PRIORITY_COLORS: Record<string, string> = {
  LOW: "bg-gray-100 text-gray-600",
  MEDIUM: "bg-blue-50 text-blue-600",
  HIGH: "bg-orange-50 text-orange-600",
  URGENT: "bg-red-50 text-red-600",
};

async function signOut(){
  await authClient.signOut();
}

export default function BoardPage({ orgId }: { orgId: string | undefined}){
  const queryClient = useQueryClient();
  const { data: session } = authClient.useSession();
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState("MEDIUM");
  const [newDescription, setNewDescription] = useState("");

  const headers = { "x-organization-id": orgId };

  const { data: issues = [], isLoading } = useQuery<Issue[]>({
    queryKey: ["issues", orgId],
    queryFn: () => api.get("/issues", { headers }).then((r) => r.data),
  });

  useEffect(() => {
    socket.on("issue:created", (issue: Issue) => {
      queryClient.setQueryData<Issue[]>(["issues", orgId], (old) => 
        old ? [issue, ...old] : [issue]    // if exists add the issue, or just a new one
      );
    })

    socket.on("issue:updated", (issue: Issue) => {
      queryClient.setQueryData<Issue[]>(["issues", orgId], (old) => 
        old?.map((i) => (i.id === issue.id ? issue : i))
      );
    });

    socket.on("issue:deleted", ({id} : {id: string}) => {
      queryClient.setQueryData<Issue[]>(["issues", orgId], (old) => 
        old?.filter((i) => i.id !== id)
      );
    });

    return () => {
      socket.off("issue:created");
      socket.off("issue:updated");
      socket.off("issue:deleted");
    }
  }, [orgId, queryClient]);

  const createMutation = useMutation({
    mutationFn: (data: { title: string; priority: string; description: string }) =>
      api.post("/issues", data, { headers }),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["issues", orgId] });
      setShowCreate(false);
      setNewTitle("");
      setNewDescription("");
      setNewPriority("MEDIUM");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: Partial<Issue> & { id: string }) =>
      api.patch(`/issues/${id}`, data, { headers }),

    onMutate: async ({ id, ...data }) => {
      await queryClient.cancelQueries({ queryKey: ["issues", orgId] });
      const previous = queryClient.getQueryData<Issue[]>(["issues", orgId]);
      queryClient.setQueryData<Issue[]>(["issues", orgId], (old) =>
        old?.map((i) => (i.id === id ? { ...i, ...data } : i))
      );
      return { previous };
    },

    onError: (_err, _vars, context) => {
      queryClient.setQueryData(["issues", orgId], context?.previous);
    },

    onSettled: () => queryClient.invalidateQueries({ queryKey: ["issues", orgId] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/issues/${id}`, { headers }),
    
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["issues", orgId] }),
  });

  function moveIssue(issue: Issue, direction: "forward" | "back"){
    const order: IssueStatus[] = ["TODO", "IN_PROGRESS", "DONE"];
    const idx = order.indexOf(issue.status);
    const next = direction === "forward" ? order[idx + 1] : order[idx - 1];
    if(next) updateMutation.mutate({ id: issue.id, status: next });
  }

  if(isLoading) return <div className="p-8 text-gray-500">Loading...</div>;

  return(
    <div className="bg-bg min-h-screen flex flex-col">
      <Navbar signOut={signOut}/>
      <div className="p-6 flex-1">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-primary">Board</h2>
          <button
            onClick={() => setShowCreate(true)}
            className="px-4 py-2 bg-primary text-bg rounded-lg text-sm font-bold hover:bg-primary-hover hover:cursor-pointer transition-colors"
          >
            + New Issue
          </button>
        </div>

        {showCreate && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-surface rounded-xl shadow-xl w-full max-w-md p-6">
              <h3 className="font-semibold text-primary mb-4">Create Issue</h3>
              <div className="space-y-3">
                <input
                  autoFocus
                  type="text"
                  placeholder="Issue Title"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary placeholder-ph text-ph"
                />
                <textarea
                  placeholder="Description (optional)"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none placeholder-ph text-ph"
                />
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary placeholder-ph"
                >
                  <option value="LOW">Low priority</option>
                  <option value="MEDIUM">Medium priority</option>
                  <option value="HIGH">High priority</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() =>
                    createMutation.mutate({
                      title: newTitle,
                      priority: newPriority,
                      description: newDescription,
                    })
                  }
                  disabled={!newTitle.trim() || createMutation.isPending}
                  className="px-4 py-2 bg-primary text-bg rounded-lg text-sm font-medium hover:bg-primary-hover hover:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {createMutation.isPending ? "Creating..." : "Create"}
                </button>
                <button
                  onClick={() => setShowCreate(false)}
                  className="px-4 py-2 bg-secondary text-gray-600 rounded-lg text-sm font-medium hover:cursor-pointer hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-4">
          {COLUMNS.map(({ status, label }) => {
            const columnIssues = issues.filter((i) => i.status === status);
            return(
              <div key={status} className="bg-gray-100 rounded-xl p-4 min-h-100">
                <div className="flex items-center gap-2 mb-3">
                  <span className="font-medium text-gray-700 text-sm">{label}</span>
                  <span className="bg-gray-200 text-gray-500 text-xs rounded-full px-2 py-0.5">
                    {columnIssues.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {columnIssues.map((issue) => (
                    <div
                      key={issue.id}
                      className="bg-white rounded-lg p-3 shadow-sm border border-gray-200"
                    >
                      <p className="text-sm font-medium text-gray-900 mb-2">{issue.title}</p>
                      {issue.description && (
                        <p className="text-xs text-gray-500 mb-2 line-clamp-2">{issue.description}</p>
                      )}
                      <div className="flex items-center justify-between">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_COLORS[issue.priority]}`}>
                          {issue.priority.charAt(0) + issue.priority.slice(1).toLowerCase()}
                        </span>
                        <div className="flex gap-1">
                          {status !== "TODO" && (
                            <button
                              onClick={() => moveIssue(issue, "back")}
                              className="text-xs text-gray-400 hover:text-gray-600 px-1"
                              title="Move back"
                            >
                              ←
                            </button>
                          )}
                          {status !== "DONE" && (
                            <button
                              onClick={() => moveIssue(issue, "forward")}
                              className="text-xs text-gray-400 hover:text-gray-600 px-1"
                              title="Move forward"
                            >
                              →
                            </button>
                          )}
                          {issue.creatorId === session?.user.id && (
                            <button
                              onClick={() => deleteMutation.mutate(issue.id)}
                              className="text-xs text-red-400 hover:text-red-600 px-1"
                              title="Delete"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}