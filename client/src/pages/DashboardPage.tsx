import { useEffect, useState } from "react";
import { authClient } from "../lib/auth-client";
import BoardPage from "./BoardPage.tsx";
import socket from "../lib/socket.ts";
import MembersPage from "./MembersPage.tsx";
import ActivityPage from "./ActivityPage.tsx";

export default function DashboardPage(){
  const { data: session } = authClient.useSession();
  const { data: activeOrg } = authClient.useActiveOrganization();
  const [workspaceName, setWorkspaceName] = useState("");
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState <"board" | "members" | "activity">("board");

  useEffect(() => {
    if(!activeOrg) return;

    socket.connect();
    socket.emit("join-workspace", activeOrg.id);

    return () => {
      socket.emit("leave-workspace", activeOrg.id);
      socket.disconnect();
    }
  }, [activeOrg?.id])

  async function createWorkspace(){
    if (!workspaceName.trim()) return;
    setCreating(true);
    const slug = workspaceName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    await authClient.organization.create({ name: workspaceName, slug });
    setWorkspaceName("");
    setShowForm(false);
    setCreating(false);
  }

  async function signOut(){
    await authClient.signOut();
  }

  return(
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-bold text-gray-900 text-lg">DevBoard</span>
          {activeOrg && <span className="text-gray-400">/</span>}
          {activeOrg && <span className="text-gray-700 font-medium">{activeOrg.name}</span>}
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">{session?.user.name}</span>
          <button onClick={signOut} className="text-sm text-gray-500 hover:text-gray-700">
            Sign out
          </button>
        </div>
      </header>

      <main>
        {!activeOrg ? (
          <div className="max-w-2xl mx-auto mt-16 px-4 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Create your workspace</h2>
            <p className="text-gray-500 mb-8">A workspace is where your team manages issues.</p>
            {!showForm ? (
              <button
                onClick={() => setShowForm(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Create workspace
              </button>
            ) : (
              <div className="bg-white border border-gray-200 rounded-xl p-6 text-left">
                <label className="block text-sm font-medium text-gray-700 mb-1">Workspace name</label>
                <input
                  type="text"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  placeholder="e.g. Acme Corp"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                  onKeyDown={(e) => e.key === "Enter" && createWorkspace()}
                  autoFocus
                />
                <div className="flex gap-3">
                  <button
                    onClick={createWorkspace}
                    disabled={creating || !workspaceName.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {creating ? "Creating..." : "Create workspace"}
                  </button>
                  <button
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div>
            <div className="border-b border-gray-200 bg-white px-6">
              <nav className="flex gap-6">
                {(["board", "members", "activity"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`py-3 text-sm font-medium border-b-2 transition-colors capitalize ${
                      activeTab === tab
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </nav>
            </div>
            {activeTab === "board" && <BoardPage orgId={activeOrg.id} />}
            {activeTab === "members" && <MembersPage orgId={activeOrg.id} />}
            {activeTab === "activity" && <ActivityPage orgId={activeOrg.id} />}
          </div>
        )}
      </main>
    </div>
  );
}