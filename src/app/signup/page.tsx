"use client";

import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase/client";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Leaf,
  Loader2,
  Lock,
  Mail,
  Moon,
  Phone,
  ShoppingBag,
  Sun,
  Truck,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();
  const { refreshSession, signInWithOAuth } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const saved = localStorage.getItem("mangobite-theme") as "dark" | "light" | null;
    if (saved) {
      setTheme(saved);
      if (saved === "light") {
        document.documentElement.classList.remove("dark");
        document.documentElement.classList.add("light");
      } else {
        document.documentElement.classList.remove("light");
        document.documentElement.classList.add("dark");
      }
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("mangobite-theme", nextTheme);
    if (nextTheme === "light") {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
      document.documentElement.classList.add("dark");
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) {
      toast.error("Please enter your full name");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    setIsLoading(true);
    if (
      email.toLowerCase() === "customer@mangobite.com" ||
      email.toLowerCase() === "demo@mangobite.com"
    ) {
      setTimeout(() => {
        const storedProfiles = JSON.parse(localStorage.getItem("mangobite-all-profiles") || "[]");
        const newProfile = {
          id: `profile-${Date.now()}`,
          full_name: fullName,
          email: email.toLowerCase(),
          phone: phoneNumber || "01754309016",
          role: "user",
          is_blocked: false,
          created_at: new Date().toISOString()
        };
        localStorage.setItem("mangobite-all-profiles", JSON.stringify([newProfile, ...storedProfiles]));

        setIsLoading(false);
        toast.success("Registration successful!");
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      }, 1000);
      return;
    }

    try {
      // Since "Confirm Email" is disabled in Supabase, this will succeed 
      // and allow immediate login!
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: fullName,
            phone: phoneNumber,
          },
        },
      });

      setIsLoading(false);

      if (error) {
        toast.error(error.message);
      } else {
        const storedProfiles = JSON.parse(localStorage.getItem("mangobite-all-profiles") || "[]");
        const newProfile = {
          id: data?.user?.id || `profile-${Date.now()}`,
          full_name: fullName,
          email: email.toLowerCase(),
          phone: phoneNumber || "",
          role: "user",
          is_blocked: false,
          created_at: new Date().toISOString()
        };
        localStorage.setItem("mangobite-all-profiles", JSON.stringify([newProfile, ...storedProfiles]));

        // Automatically sign in the user after successful registration
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

        toast.success("Registration successful! Logging you in...");
        setTimeout(() => {
          router.push("/dashboard");
        }, 1500);
      }
    } catch {
      setIsLoading(false);
      toast.error("Failed to complete registration. Please try again.");
    }
  };

  const handleOAuthSignUp = async (provider: "google" | "facebook") => {
    setIsLoading(true);
    await signInWithOAuth(provider);
    setIsLoading(false);
  };

  const isDark = theme === "dark";

  const fieldWrapClass = isDark
    ? "group flex items-center gap-3 rounded-md border border-white/10 bg-white/5 px-3.5 py-3 backdrop-blur-sm transition-all duration-200 focus-within:border-blue-400 focus-within:bg-white/10 focus-within:shadow-[0_0_0_3px_rgba(59,130,246,0.2)]"
    : "group flex items-center gap-3 rounded-md border border-white/60 bg-white/50 px-3.5 py-3 backdrop-blur-sm transition-all duration-200 focus-within:border-blue-500 focus-within:bg-white/80 focus-within:shadow-[0_0_0_3px_rgba(59,130,246,0.15)]";

  const inputClass = isDark
    ? "w-full border-0 bg-transparent text-sm font-semibold text-neutral-100 placeholder:text-neutral-500 placeholder:font-normal outline-none"
    : "w-full border-0 bg-transparent text-sm font-semibold text-neutral-900 placeholder:text-neutral-400 placeholder:font-normal outline-none";

  const labelClass = isDark
    ? "mb-2.5 block text-[13px] font-semibold text-neutral-300"
    : "mb-2.5 block text-[13px] font-semibold text-neutral-700";

  const primaryBtnClass = isDark
    ? "group flex w-full items-center justify-center gap-2 rounded-md border border-blue-500 bg-blue-500 px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-blue-600/25 transition-all duration-200 hover:bg-blue-400 hover:shadow-md hover:shadow-blue-600/30 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-neutral-900 disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100"
    : "group flex w-full items-center justify-center gap-2 rounded-md border border-blue-600/80 bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-blue-600/25 transition-all duration-200 hover:bg-blue-700 hover:shadow-md hover:shadow-blue-600/30 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100";

  const secondaryBtnClass = isDark
    ? "flex items-center justify-center gap-2 rounded-md border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-neutral-200 shadow-sm backdrop-blur-sm transition-all duration-200 hover:border-blue-400/40 hover:bg-white/10 hover:shadow active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:ring-offset-neutral-900 disabled:cursor-not-allowed disabled:opacity-50"
    : "flex items-center justify-center gap-2 rounded-md border border-white/70 bg-white/40 px-4 py-2.5 text-sm font-medium text-neutral-700 shadow-sm backdrop-blur-sm transition-all duration-200 hover:border-blue-200 hover:bg-white/70 hover:shadow active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50";

  const iconFieldClass = isDark
    ? "h-4 w-4 shrink-0 text-neutral-500 transition-colors group-focus-within:text-blue-400"
    : "h-4 w-4 shrink-0 text-neutral-400 transition-colors group-focus-within:text-blue-500";

  const iconToggleClass = isDark
    ? "shrink-0 text-neutral-500 transition-colors hover:text-neutral-200 cursor-pointer"
    : "shrink-0 text-neutral-400 transition-colors hover:text-neutral-700 cursor-pointer";

  const cardClass = isDark
    ? "relative z-10 w-full max-w-md overflow-hidden rounded-md border border-blue-500/40 bg-neutral-900/75 shadow-[0_8px_32px_rgba(0,0,0,0.45)] backdrop-blur-xl"
    : "relative z-10 w-full max-w-md overflow-hidden rounded-md border border-blue-400/70 bg-white/55 shadow-[0_8px_32px_rgba(37,99,235,0.12)] backdrop-blur-xl";

  const cardBarClass = isDark
    ? "h-1 w-full bg-gradient-to-r from-blue-500 via-blue-400 to-blue-500"
    : "h-1 w-full bg-gradient-to-r from-blue-400 via-blue-600 to-blue-400";

  const titleClass = isDark
    ? "text-2xl font-semibold tracking-tight text-white"
    : "text-2xl font-semibold tracking-tight text-neutral-900";

  const subtitleClass = isDark
    ? "text-sm text-neutral-400"
    : "text-sm text-neutral-500";

  const optionalClass = isDark
    ? "font-normal text-neutral-500"
    : "font-normal text-neutral-400";

  const dividerLineClass = isDark
    ? "w-full border-t border-white/10"
    : "w-full border-t border-neutral-200";

  const dividerTextClass = isDark
    ? "bg-neutral-900/80 px-2 text-xs font-medium uppercase tracking-wide text-neutral-500 backdrop-blur-sm"
    : "bg-white/70 px-2 text-xs font-medium uppercase tracking-wide text-neutral-400 backdrop-blur-sm";

  const footerWrapClass = isDark
    ? "space-y-3 border-t border-white/10 pt-4"
    : "space-y-3 border-t border-white/50 pt-4";

  const footerTextClass = isDark
    ? "text-center text-sm text-neutral-400"
    : "text-center text-sm text-neutral-500";

  const footerLinkClass = isDark
    ? "font-semibold text-blue-400 transition-colors hover:text-blue-300 hover:underline"
    : "font-semibold text-blue-600 transition-colors hover:text-blue-700 hover:underline";

  const legalClass = isDark
    ? "text-center text-xs leading-relaxed text-neutral-500"
    : "text-center text-xs leading-relaxed text-neutral-400";

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-background text-foreground overflow-hidden font-sans relative select-none">
      <style jsx global>{`
        @keyframes float-leaf {
          0% {
            transform: translateY(-10%) translateX(0) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 0.7;
          }
          90% {
            opacity: 0.7;
          }
          100% {
            transform: translateY(110vh) translateX(80px) rotate(360deg);
            opacity: 0;
          }
        }
        .floating-leaf {
          position: absolute;
          pointer-events: none;
          animation: float-leaf 15s linear infinite;
          z-index: 1;
        }
        .bg-grid-pattern {
          background-image:
            linear-gradient(to right, rgba(0, 0, 0, 0.025) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0, 0, 0, 0.025) 1px, transparent 1px);
          background-size: 24px 24px;
        }
        .dark .bg-grid-pattern {
          background-image:
            linear-gradient(to right, rgba(255, 255, 255, 0.015) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.015) 1px, transparent 1px);
          background-size: 24px 24px;
        }
        @keyframes float-orb {
          0%,
          100% {
            transform: translateY(0) scale(1);
          }
          50% {
            transform: translateY(-20px) scale(1.05);
          }
        }
        .animate-orb {
          animation: float-orb 10s ease-in-out infinite;
        }
      `}</style>

      <div className="absolute inset-0 bg-grid-pattern pointer-events-none z-0" />
      <div
        className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-emerald-500/10 dark:bg-emerald-500/5 blur-[120px] pointer-events-none z-0 animate-orb"
        style={{ animationDelay: "0s" }}
      />
      <div
        className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] rounded-full bg-amber-500/10 dark:bg-amber-500/5 blur-[150px] pointer-events-none z-0 animate-orb"
        style={{ animationDelay: "-3s" }}
      />
      <div
        className="absolute top-1/2 right-1/3 w-[400px] h-[400px] rounded-full bg-green-400/10 dark:bg-green-400/3 blur-[100px] pointer-events-none z-0 animate-orb"
        style={{ animationDelay: "-6s" }}
      />

      <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
        <span
          className="floating-leaf text-emerald-500/20 text-3xl"
          style={{ left: "10%", top: "-5%", animationDelay: "0s", animationDuration: "14s" }}
        >
          🍃
        </span>
        <span
          className="floating-leaf text-emerald-600/15 text-2xl"
          style={{ left: "35%", top: "-5%", animationDelay: "3s", animationDuration: "18s" }}
        >
          🍂
        </span>
        <span
          className="floating-leaf text-emerald-500/15 text-4xl"
          style={{ left: "70%", top: "-5%", animationDelay: "6s", animationDuration: "16s" }}
        >
          🍃
        </span>
        <span
          className="floating-leaf text-emerald-600/20 text-xl"
          style={{ left: "25%", top: "-5%", animationDelay: "9s", animationDuration: "12s" }}
        >
          🍃
        </span>
        <span
          className="floating-leaf text-emerald-500/15 text-3xl"
          style={{ left: "85%", top: "-5%", animationDelay: "12s", animationDuration: "20s" }}
        >
          🍂
        </span>
      </div>

      {/* Left Panel */}
      <div className="hidden lg:flex lg:col-span-5 relative bg-emerald-950 items-center justify-center p-12 overflow-hidden border-r border-border z-10">
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-[12s] hover:scale-105"
          style={{ backgroundImage: "url('/login_orchard_backdrop.png')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-emerald-950 via-emerald-950/85 to-emerald-900/45" />

        <div className="relative z-10 w-full max-w-[26rem] rounded-2xl border border-white/20 bg-gradient-to-b from-white/15 to-white/5 px-10 py-11 text-center text-white shadow-[0_24px_60px_rgba(0,0,0,0.4)] backdrop-blur-2xl">
          <Link
            href="/"
            className="group inline-flex flex-col items-center gap-3 transition-opacity hover:opacity-90"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full border border-amber-200/40 bg-amber-400/20 text-amber-200 shadow-[0_0_24px_rgba(251,191,36,0.2)] transition-transform group-hover:scale-105">
              <ShoppingBag className="h-5 w-5 stroke-[2]" />
            </span>
            <span className="font-display text-[1.85rem] font-semibold tracking-[0.04em] text-white">
              Mango<span className="italic font-medium text-amber-200">Bite</span>
            </span>
          </Link>

          <p className="mt-8 font-sans text-[11px] font-semibold uppercase tracking-[0.28em] text-amber-200/90">
            From orchard to doorstep
          </p>

          <h2 className="font-display mt-3 text-[2.35rem] font-medium leading-[1.15] tracking-[-0.01em] text-white">
            Join Rajshahi&apos;s
            <span className="block italic font-normal text-amber-100/95">
              Finest
            </span>
          </h2>

          <div className="mx-auto mt-6 h-px w-16 bg-gradient-to-r from-transparent via-amber-200/80 to-transparent" />

          <p className="mx-auto mt-6 max-w-[19rem] font-sans text-[15px] font-light leading-[1.7] tracking-[0.01em] text-emerald-50/80">
            Create an account to start ordering handpicked, chemical-free premium
            mangoes delivered straight from the orchards of Rajshahi.
          </p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/20 px-3.5 py-1.5 font-sans text-[11px] font-medium tracking-wide text-emerald-50/95 backdrop-blur-sm">
              <Leaf className="h-3.5 w-3.5 text-amber-200" />
              Chemical-free
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/20 px-3.5 py-1.5 font-sans text-[11px] font-medium tracking-wide text-emerald-50/95 backdrop-blur-sm">
              <Truck className="h-3.5 w-3.5 text-amber-200" />
              Fresh delivery
            </span>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex flex-col lg:col-span-7 items-center justify-center p-6 sm:p-12 relative min-h-screen z-10">
        <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-20">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-semibold text-muted hover:text-[#fbbf24] transition-colors bg-card/80 border border-border px-4 py-2 rounded-xl backdrop-blur-md shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl bg-card/80 border border-border text-muted-foreground hover:text-[#fbbf24] transition-all cursor-pointer backdrop-blur-md shadow-sm"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Form card only */}
        <div className={cardClass}>
          <div className={cardBarClass} />

          <div className="space-y-6 p-6 sm:p-8">
            <div className="space-y-1 text-center">
              <h2 className={titleClass}>Create Account</h2>
              <p className={subtitleClass}>Register to get started.</p>
            </div>

            <form onSubmit={handleSignupSubmit} className="space-y-5">
              <div>
                <label htmlFor="full-name" className={labelClass}>
                  Full Name
                </label>
                <div className={fieldWrapClass}>
                  <UserRound className={iconFieldClass} />
                  <input
                    id="full-name"
                    type="text"
                    required
                    placeholder="Your full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className={labelClass}>
                  Email Address
                </label>
                <div className={fieldWrapClass}>
                  <Mail className={iconFieldClass} />
                  <input
                    id="email"
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="phone" className={labelClass}>
                  Phone Number{" "}
                  <span className={optionalClass}>(optional)</span>
                </label>
                <div className={fieldWrapClass}>
                  <Phone className={iconFieldClass} />
                  <input
                    id="phone"
                    type="tel"
                    placeholder="Phone number"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className={labelClass}>
                  Password
                </label>
                <div className={fieldWrapClass}>
                  <Lock className={iconFieldClass} />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={inputClass}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className={iconToggleClass}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={primaryBtnClass}
                style={{ marginTop: "10px" }}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    Create Account
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </form>

            <div className="relative py-1">
              <div className="absolute inset-0 flex items-center">
                <div className={dividerLineClass} />
              </div>
              <div className="relative flex justify-center">
                <span className={dividerTextClass}>or continue with</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleOAuthSignUp("google")}
                disabled={isLoading}
                className={secondaryBtnClass}
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#EA4335"
                    d="M12.24 10.285V14.4h6.887c-.275 1.41-1.023 2.605-2.186 3.415v2.834h3.545c2.07-1.907 3.265-4.712 3.265-8.05 0-.78-.07-1.532-.2-2.25H12.24z"
                  />
                  <path
                    fill="#34A853"
                    d="M12.24 23c2.97 0 5.46-.98 7.28-2.66l-3.545-2.834c-.98.66-2.23 1.06-3.735 1.06-2.87 0-5.3-1.94-6.16-4.55H2.41v2.92C4.22 20.53 7.94 23 12.24 23z"
                  />
                  <path
                    fill="#4A90E2"
                    d="M6.08 14.016c-.22-.66-.35-1.36-.35-2.086s.13-1.426.35-2.086V6.924H2.41C1.47 8.79 1 10.84 1 11.93c0 1.09.47 3.14 1.41 5.006l3.67-2.92z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M12.24 4.75c1.615 0 3.06.555 4.2 1.645l3.15-3.15C17.695 1.49 15.205.5 12.24.5 7.94.5 4.22 2.97 2.41 6.924l3.67 2.92c.86-2.61 3.29-4.55 6.16-4.55z"
                  />
                </svg>
                Google
              </button>
              <button
                type="button"
                onClick={() => handleOAuthSignUp("facebook")}
                disabled={isLoading}
                className={secondaryBtnClass}
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#1877F2"
                    d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953h-1.513c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"
                  />
                </svg>
                Facebook
              </button>
            </div>

            <div className={footerWrapClass}>
              <p className={footerTextClass}>
                Already have an account?{" "}
                <Link href="/login" className={footerLinkClass}>
                  Sign In
                </Link>
              </p>

              <p className={legalClass}>
                By continuing, you agree to MangoBite&apos;s Terms of Service and
                Privacy Policy.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
