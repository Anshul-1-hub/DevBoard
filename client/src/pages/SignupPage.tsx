import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authClient } from "../lib/auth-client";
import { Link } from "react-router-dom";
import { Logo } from "../components/Logo.tsx";

export default function SignupPage(){
    const navigate = useNavigate();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>){
        e.preventDefault();
        setLoading(true);
        setError("");

        const { error } = await authClient.signUp.email({ name, email, password });

        if(error){
            setError(error.message ? error.message : "Something went wrong.");
            setLoading(false);
            return;
        }

        navigate("/dashboard");
    }

    return (
        <div className="flex flex-col min-h-screen">
            <Logo />
            <div className="flex items-center justify-center bg-bg flex-1">
                <div className="w-full max-w-md bg-surface rounded-xl shadow-sm border border-border p-8">
                    <h1 className="text-2xl font-bold text-primary mb-1 text-center">Create an account</h1>
                    <p className="text-secondary text-sm mb-6 text-center">Start managing your team's work</p>

                    {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                        {error}
                    </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-secondary mb-1">Name</label>
                        <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary placeholder-ph text-ph font-medium"
                        placeholder="Your name"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-secondary mb-1">Email</label>
                        <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary placeholder-ph text-ph font-medium"
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
                        minLength={8}
                        className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary placeholder-ph text-ph font-medium"
                        placeholder="Min. 8 characters"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2 px-4 bg-primary text-surface rounded-lg text-sm font-medium hover:bg-primary-hover hover:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {loading ? "Creating account..." : "Create account"}
                    </button>
                    </form>

                    <p className="mt-4 text-center text-sm text-gray-500">
                    Already have an account?{" "}
                    <Link to="/login" className="text-primary hover:underline font-medium">
                        Sign in
                    </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}