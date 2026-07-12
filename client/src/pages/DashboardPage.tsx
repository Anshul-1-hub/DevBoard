import { useEffect, useState } from "react";
import { authClient } from "../lib/auth-client";
import socket from "../lib/socket.ts";
import { Navbar } from "../components/Navbar.tsx";
import { useSearchParams } from "react-router-dom";

export default function DashboardPage(){
  const { data:session } = authClient.useSession();
  const { data: activeOrg } = authClient.useActiveOrganization();
  const [workspaceName, setWorkspaceName] = useState("");
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const forceSwitch = searchParams.get("switch") === "true";
  const [showWorkspaces, setShowWorkspaces] = useState(false);
  const {data: organizations} = authClient.useListOrganizations();

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
    const newOrg = await authClient.organization.create({ name: workspaceName, slug });
    await authClient.organization.setActive({organizationId: newOrg.data?.id, organizationSlug: newOrg?.data?.slug})
    setWorkspaceName("");
    setShowForm(false);
    setCreating(false);
  }

  async function signOut(){
    await authClient.signOut();
  }

  return(
    <div className="bg-bg min-h-screen flex flex-col">
    <Navbar signOut={signOut}/>
    <div className="flex-1 flex items-center justify-center pb-15">
      <main>
        {(!activeOrg || forceSwitch) ? (
          <div className="max-w-2xl w-full mx-auto px-4 text-center">
            <h2 className="text-2xl font-bold text-primary mb-2">Create your workspace.</h2>
            <p className="text-secondary mb-8">A workspace is where your team manages issues.</p>
            {!showForm ? (
              <button
                onClick={() => setShowForm(true)}
                className="px-6 py-3 bg-primary text-bg rounded-lg font-medium hover:bg-primary-hover hover:cursor-pointer transition-colors"
              >
                Create Workspace
              </button>
            ) :(
              <div className="bg-surface rounded-xl p-6 text-left">
                <label className="block text-sm font-medium text-secondary mb-1 pb-3">Workspace Name:</label>
                <input
                  type="text"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  placeholder="e.g. DevBoard"
                  className="w-full px-3 py-2 border border-primary rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary mb-4 placeholder-ph text-ph font-medium"
                  onKeyDown={(e) => e.key === "Enter" && createWorkspace()}
                  autoFocus
                />
                <div className="flex gap-3">
                  <button
                    onClick={createWorkspace}
                    disabled={creating || !workspaceName.trim()}
                    className="px-4 py-2 bg-primary text-bg rounded-lg text-sm font-medium hover:primary-hover hover:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {creating ? "Creating..." : "Create Workspace"}
                  </button>
                  <button
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 text-gray-600 rounded-lg text-sm font-medium bg-white hover:bg-gray-300 hover:cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <br />
            <div className="text-primary font-bold pt-100">Your Workspaces</div>
            <div className="flex flex-col gap-2 text-white font-medium py-4">
              {organizations?.map((org) => (
                <button key={org.id} onClick={async () => {
                  authClient.organization.setActive({organizationId: org.id, organizationSlug: org.slug});
                  setSearchParams({});
                }} 
                className="bg-surface border border-border rounded-lg py-3 hover:bg-surface-hover hover:cursor-pointer">{org.name}</button>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <span className="text-primary text-2xl font-bold">Welcome back, {session?.user.name}!</span>
          </div>
        )}
      </main>
    </div>
    </div>
  );
}

// Main layout component after login. Does 3 things:
// 1. Socket lifecycle — connects when workspace is active, joins the workspace room,
//    cleans up (leave room + disconnect) when org changes or component unmounts
// 2. Workspace creation — if no active org, shows create workspace form
// 3. Tab navigation — switches between Board, Members, Activity pages
//    passing orgId down to each as a prop