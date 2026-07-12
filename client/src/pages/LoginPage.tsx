import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authClient } from "../lib/auth-client";
import { Logo } from "../components/Logo.tsx"

export default function LoginPage(){
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>){
        e.preventDefault();
        setLoading(true);
        setError("");

        const { error } = await authClient.signIn.email({email, password})

        if(error){
            setError(error.message ?? "Something went wrong!");
            setLoading(false);
            return;
        }

        navigate("/dashboard");
    }

    return (
        <div className="min-h-screen flex flex-col">
            <Logo />
            <div className="flex items-center justify-center bg-bg flex-1">
                <div className="w-full max-w-md bg-surface rounded-xl shadow-sm border border-border p-8">
                    <h1 className="text-center text-2xl font-bold text-primary mb-1">Welcome Back</h1>
                    <p className="text-secondary text-center text-sm mb-6">Sign in to your DevBoard account</p>

                    {error && (
                    <div className="mb-4 p-3 bg-red-100 border border-red-200 rounded-lg text-red-600 text-sm">
                        {error}
                    </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-secondary mb-1">Email</label>
                        <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary placeholder-grey-500 placeholder-ph text-ph font-medium"
                        placeholder="you@example.com"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-secondary mb-1">Password</label>
                        <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary placeholder-ph text-ph font-medium"
                        placeholder="••••••••"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2 px-4 bg-primary text-surface rounded-lg text-sm font-medium hover:bg-primary-hover hover:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {loading ? "Signing in..." : "Sign in"}
                    </button>
                    </form>

                    <p className="mt-4 text-center text-sm text-gray-500">
                    Don't have an account?{" "}
                    <Link to="/signup" className="text-primary hover:underline font-medium">
                        Sign up
                    </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}