import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";
import { authClient } from "../lib/auth-client";

type Member = {
  id: string;
  role: string;
  user: { id: string; name: string; email: string };
}

export default function MembersPage({ orgId }: { orgId: string }) {
  const queryClient = useQueryClient();
  const { data: session } = authClient.useSession();
  const { data: activeOrg } = authClient.useActiveOrganization();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const [error, setError] = useState("");

  const headers = { "x-organization-id": orgId };

  const {data: members = []} = useQuery<Member[]>({
    queryKey: ["members", orgId],
    queryFn: () => api.get("/members", { headers }).then((r) => r.data),
  });

  const addMutation = useMutation({
    mutationFn: (data: { email: string; role: string }) =>
      api.post("/members", data, { headers }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members", orgId] });
      setEmail("");
      setError("");
    },
    onError: (err: any) => {
      setError(err.response?.data?.error ?? "Failed to add member");
    },
  });

  const removeMutation = useMutation({
    mutationFn: (memberId: string) =>
      api.delete(`/members/${memberId}`, { headers }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["members", orgId] }),
  });

  const isOwnerOrAdmin =
    activeOrg?.members?.find((m: any) => m.userId === session?.user.id)?.role !== "member";

  return(
    <div className="p-6 max-w-2xl">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">Members</h2>

      {isOwnerOrAdmin && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
          <p className="text-sm font-medium text-gray-700 mb-3">Add member by email</p>
          {error && (
            <p className="text-sm text-red-600 mb-2">{error}</p>
          )}
          <div className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="teammate@example.com"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
            <button
              onClick={() => addMutation.mutate({ email, role })}
              disabled={!email.trim() || addMutation.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {addMutation.isPending ? "Adding..." : "Add"}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2">The person must already have a DevBoard account.</p>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {members.map((member, i) => (
          <div
            key={member.id}
            className={`flex items-center justify-between px-4 py-3 ${
              i !== members.length - 1 ? "border-b border-gray-100" : ""
            }`}
          >
            <div>
              <p className="text-sm font-medium text-gray-900">{member.user.name}</p>
              <p className="text-xs text-gray-500">{member.user.email}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 capitalize">
                {member.role}
              </span>
              {isOwnerOrAdmin && member.user.id !== session?.user.id && (
                <button
                  onClick={() => removeMutation.mutate(member.id)}
                  className="text-xs text-red-400 hover:text-red-600"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}