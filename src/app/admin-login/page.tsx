"use client";

import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase/client";
import {
    ArrowLeft,
    Eye,
    EyeOff,
    Loader2,
    Lock,
    Shield,
    User
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";

export default function AdminLoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const { refreshSession } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error("Please enter both username and password");
      return;
    }

    setIsLoading(true);

    try {
      const email = username.includes("@")
        ? username
        : `${username}@mangodb.com`;

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (!error && data.user) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .single<{ role: string }>();

        if (profileData?.role === "admin") {
          toast.success("Admin login successful!");
          document.cookie = "mangodb-admin=true; path=/; max-age=86400;";
          await refreshSession();
          setIsLoading(false);
          router.push("/admin");
          return;
        } else {
          await supabase.auth.signOut();
          toast.error("This account does not have admin privileges.");
          setIsLoading(false);
          return;
        }
      }

      // Demo admin fallback
      if (username === "admin" && password === "admin123") {
        toast.success("Admin login successful!");
        localStorage.setItem(
          "mangodb-user",
          JSON.stringify({
            phone: "admin",
            name: "Administrator",
            role: "admin",
            email: "admin@mangodb.com",
          })
        );
        document.cookie = "mangodb-admin=true; path=/; max-age=86400;";
        await refreshSession();
        setIsLoading(false);
        router.push("/admin");
        return;
      }

      setIsLoading(false);
      toast.error("Invalid admin credentials");
    } catch {
      setIsLoading(false);
      if (username === "admin" && password === "admin123") {
        toast.success("Admin login successful!");
        localStorage.setItem(
          "mangodb-user",
          JSON.stringify({
            phone: "admin",
            name: "Administrator",
            role: "admin",
            email: "admin@mangodb.com",
          })
        );
        document.cookie = "mangodb-admin=true; path=/; max-age=86400;";
        await refreshSession();
        router.push("/admin");
      } else {
        toast.error("Invalid admin credentials");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent pointer-events-none" />

      <div className="relative w-full max-w-sm">
        {/* Back link */}
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Login
        </Link>

        {/* Card */}
        <div className="bg-slate-800/80 border border-slate-700/60 rounded-md shadow-2xl shadow-blue-900/20 backdrop-blur-xl overflow-hidden">
          {/* Top bar */}
          <div className="h-1 bg-gradient-to-r from-blue-500 via-blue-400 to-blue-500" />

          <div className="p-6 sm:p-8 space-y-6">
            {/* Header */}
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-md bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div className="text-center">
                <h1 className="text-xl font-bold text-white">Admin Login</h1>
                <p className="text-sm text-slate-400 mt-0.5">
                  Sign in to manage your store
                </p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Username
                </label>
                <div className="flex items-center gap-3 rounded-md border border-slate-700/60 bg-slate-900/50 px-3.5 py-2.5 transition-all focus-within:border-blue-500 focus-within:shadow-[0_0_0_3px_rgba(59,130,246,0.15)]">
                  <User className="w-4 h-4 text-slate-500 shrink-0" />
                  <input
                    type="text"
                    required
                    placeholder="Username or email"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full border-0 bg-transparent text-sm font-medium text-slate-100 placeholder:text-slate-500 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Password
                </label>
                <div className="flex items-center gap-3 rounded-md border border-slate-700/60 bg-slate-900/50 px-3.5 py-2.5 transition-all focus-within:border-blue-500 focus-within:shadow-[0_0_0_3px_rgba(59,130,246,0.15)]">
                  <Lock className="w-4 h-4 text-slate-500 shrink-0" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border-0 bg-transparent text-sm font-medium text-slate-100 placeholder:text-slate-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="text-slate-500 hover:text-slate-300 transition-colors cursor-pointer shrink-0"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 rounded-md bg-blue-600 hover:bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4" />
                    Log In as Admin
                  </>
                )}
              </button>
            </form>

            {/* Footer */}
            <div className="text-center">
              <p className="text-xs text-slate-500">
                Default: <span className="font-mono text-slate-400">admin</span> /{" "}
                <span className="font-mono text-slate-400">admin123</span>
              </p>
            </div>
          </div>
        </div>

        <p className="text-center text-[10px] text-slate-600 mt-4">
          MangoDB Admin Panel &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
