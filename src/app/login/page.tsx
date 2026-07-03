"use client";

import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase/client";
import {
    ArrowLeft,
    Check,
    Loader2,
    Lock,
    Moon,
    ShieldCheck,
    ShoppingBag,
    Sparkles,
    Sun,
    User,
    X
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const { refreshSession } = useAuth();
  
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Admin login states
  const [activeTab, setActiveTab] = useState<"customer" | "admin">("customer");
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  
  // OTP Modal states
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpValues, setOtpValues] = useState(["", "", "", "", "", ""]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [timer, setTimer] = useState(59);
  const [isResendActive, setIsResendActive] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Demo / error feedback states
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [shouldShake, setShouldShake] = useState(false);
  const [isOtpError, setIsOtpError] = useState(false);

  // Theme state
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  // Refs for OTP input focusing
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null)
  ];

  // Sync theme with document class list
  useEffect(() => {
    const saved = localStorage.getItem("mangodb-theme") as "dark" | "light" | null;
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
    localStorage.setItem("mangodb-theme", nextTheme);
    if (nextTheme === "light") {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
      document.documentElement.classList.add("dark");
    }
  };

  // Timer countdown for OTP resend
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (showOtpModal && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setIsResendActive(true);
    }
    return () => clearInterval(interval);
  }, [showOtpModal, timer]);

  // Format number to: 1XXX-XXXXXX and strip leading zero
  const formatPhoneNumber = (value: string) => {
    const clean = value.replace(/\D/g, "").replace(/^0/, "").substring(0, 10);
    if (clean.length > 4) {
      return `${clean.slice(0, 4)}-${clean.slice(4)}`;
    }
    return clean;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhoneNumber(formatted);
  };

  // Format number to international format: +8801XXXXXXXXX for Supabase
  const getFormattedPhone = (rawPhone: string) => {
    const cleanPhone = rawPhone.replace(/\D/g, "");
    return `+880${cleanPhone}`;
  };

  // Handle Admin credentials submit
  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminUsername || !adminPassword) {
      toast.error("Please enter both username and password");
      return;
    }

    setIsLoading(true);

    try {
      // Path 1: Try Supabase email/password auth (for real admin accounts)
      // The username field accepts email for Supabase auth
      const email = adminUsername.includes("@")
        ? adminUsername
        : `${adminUsername}@mangodb.com`;

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: adminPassword,
      });

      if (!error && data.user) {
        // Check if user has admin role in profiles
        const { data: profileData } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .single<{ role: string }>();

        if (profileData?.role === "admin") {
          toast.success("Admin login successful!");
          await refreshSession();
          setIsLoading(false);
          router.push("/admin");
          return;
        } else {
          // Signed in but not admin — sign out and show error
          await supabase.auth.signOut();
          toast.error("This account does not have admin privileges.");
          setIsLoading(false);
          return;
        }
      }

      // Path 2: Supabase auth failed — try demo credentials fallback
      if (adminUsername === "admin" && adminPassword === "admin123") {
        toast.success("Admin login successful!");

        localStorage.setItem("mangodb-user", JSON.stringify({
          phone: "admin",
          name: "Administrator",
          role: "admin",
          email: "admin@mangodb.com"
        }));

        await refreshSession();
        setIsLoading(false);
        router.push("/admin");
        return;
      }

      // Neither path worked
      setIsLoading(false);
      toast.error("Invalid admin credentials");
      setShouldShake(true);
      setTimeout(() => setShouldShake(false), 400);
    } catch (err) {
      setIsLoading(false);
      // Fallback to demo credentials on any error
      if (adminUsername === "admin" && adminPassword === "admin123") {
        toast.success("Admin login successful!");

        localStorage.setItem("mangodb-user", JSON.stringify({
          phone: "admin",
          name: "Administrator",
          role: "admin",
          email: "admin@mangodb.com"
        }));

        await refreshSession();
        router.push("/admin");
      } else {
        toast.error("Invalid admin credentials");
        setShouldShake(true);
        setTimeout(() => setShouldShake(false), 400);
      }
    }
  };

  // Handle phone number submit
  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const cleanPhone = phoneNumber.replace(/\D/g, "");
    if (cleanPhone.length !== 10) {
      toast.error("Please enter a valid 10-digit phone number");
      return;
    }

    setIsLoading(true);

    // AUTOMATIC DEMO INTERCEPTOR
    if (cleanPhone === "1754309016") {
      setTimeout(() => {
        setIsLoading(false);
        setIsDemoMode(true);
        setShowOtpModal(true);
        setTimer(59);
        setIsResendActive(false);
        setOtpValues(["", "", "", "", "", ""]);
        toast.success(`Verification code sent to +880 1754-309016!`);
        setTimeout(() => {
          inputRefs[0].current?.focus();
        }, 100);
      }, 1000);
      return;
    }

    try {
      const formattedPhone = getFormattedPhone(cleanPhone);
      const { error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
      });

      setIsLoading(false);

      if (error) {
        toast.error(error.message);
      } else {
        setIsDemoMode(false);
        setShowOtpModal(true);
        setTimer(59);
        setIsResendActive(false);
        setOtpValues(["", "", "", "", "", ""]);
        toast.success(`Verification code sent to ${formattedPhone}!`);
        
        // Auto-focus first input
        setTimeout(() => {
          inputRefs[0].current?.focus();
        }, 100);
      }
    } catch (err: any) {
      setIsLoading(false);
      toast.error("Failed to send code. Please try again.");
    }
  };

  // Trigger verification
  const triggerOtpVerification = async (codeArray: string[]) => {
    const otpCode = codeArray.join("");
    setIsVerifying(true);
    setIsOtpError(false);

    if (isDemoMode || phoneNumber.replace(/\D/g, "") === "1754309016") {
      setTimeout(() => {
        setIsVerifying(false);
        if (otpCode === "112233") {
          setIsSuccess(true);
          toast.success("Login successful!");
          
          localStorage.setItem("mangodb-user", JSON.stringify({
            phone: `0${phoneNumber.replace(/\D/g, "")}`,
            name: "Premium Customer",
            role: "user"
          }));

          setTimeout(() => {
            router.push("/");
          }, 1500);
        } else {
          toast.error("Invalid verification code.");
          setShouldShake(true);
          setIsOtpError(true);
          setOtpValues(["", "", "", "", "", ""]);
          inputRefs[0].current?.focus();
          setTimeout(() => setShouldShake(false), 400);
        }
      }, 1000);
      return;
    }

    try {
      const formattedPhone = getFormattedPhone(phoneNumber);
      const { data, error } = await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token: otpCode,
        type: "sms",
      });

      setIsVerifying(false);

      if (error) {
        toast.error(error.message);
        setShouldShake(true);
        setIsOtpError(true);
        setOtpValues(["", "", "", "", "", ""]);
        inputRefs[0].current?.focus();
        setTimeout(() => setShouldShake(false), 400);
      } else {
        setIsSuccess(true);
        toast.success("Authentication successful!");
        
        localStorage.setItem("mangodb-user", JSON.stringify({
          phone: `0${phoneNumber.replace(/\D/g, "")}`,
          name: data.user?.user_metadata?.name || "Premium Customer",
          role: "user"
        }));

        setTimeout(() => {
          router.push("/");
        }, 1500);
      }
    } catch (err: any) {
      setIsVerifying(false);
      toast.error("Verification failed. Please try again.");
      setShouldShake(true);
      setIsOtpError(true);
      setOtpValues(["", "", "", "", "", ""]);
      inputRefs[0].current?.focus();
      setTimeout(() => setShouldShake(false), 400);
    }
  };

  // Handle OTP value change
  const handleOtpChange = (index: number, value: string) => {
    if (isNaN(Number(value))) return; // Only allow numbers
    setIsOtpError(false);
    
    const newOtpValues = [...otpValues];
    newOtpValues[index] = value.substring(value.length - 1); // Only keep the last digit
    setOtpValues(newOtpValues);

    // Move to next input if digit entered
    if (value !== "" && index < 5) {
      inputRefs[index + 1].current?.focus();
    }

    // Auto-submit if all 6 digits are filled
    const fullyFilled = newOtpValues.every(val => val !== "");
    if (fullyFilled && value !== "") {
      triggerOtpVerification(newOtpValues);
    }
  };

  // Handle OTP key down (for backspace)
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && otpValues[index] === "" && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  // Handle OTP pasting
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();
    if (pastedData.length === 6 && /^\d+$/.test(pastedData)) {
      const digits = pastedData.split("");
      setOtpValues(digits);
      triggerOtpVerification(digits);
    }
  };

  const handleResendCode = async () => {
    if (isDemoMode) {
      setTimer(59);
      setIsResendActive(false);
      setOtpValues(["", "", "", "", "", ""]);
      toast.success("Verification code resent.");
      inputRefs[0].current?.focus();
      return;
    }

    try {
      const formattedPhone = getFormattedPhone(phoneNumber);
      const { error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
      });

      if (error) {
        toast.error(error.message);
      } else {
        setTimer(59);
        setIsResendActive(false);
        setOtpValues(["", "", "", "", "", ""]);
        toast.success("A new verification code has been sent!");
        inputRefs[0].current?.focus();
      }
    } catch (err: any) {
      toast.error("Failed to resend code.");
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-background text-foreground overflow-hidden font-sans relative select-none">
      
      {/* CSS Styles for Animations & Grid */}
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
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-8px); }
          40%, 80% { transform: translateX(8px); }
        }
        .shake-element {
          animation: shake 0.4s ease-in-out;
        }
        @keyframes shimmer {
          100% {
            transform: translateX(100%);
          }
        }
        .shimmer-btn {
          position: relative;
          overflow: hidden;
        }
        .shimmer-btn::after {
          position: absolute;
          top: 0;
          right: 0;
          bottom: 0;
          left: 0;
          transform: translateX(-100%);
          background-image: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0) 0%,
            rgba(255, 255, 255, 0.15) 30%,
            rgba(255, 255, 255, 0.3) 60%,
            rgba(255, 255, 255, 0) 100%
          );
          animation: shimmer 3.5s infinite;
          content: '';
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
          0%, 100% {
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

      {/* Global Background Grid & Flowing Orbs */}
      <div className="absolute inset-0 bg-grid-pattern pointer-events-none z-0" />
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-emerald-500/10 dark:bg-emerald-500/5 blur-[120px] pointer-events-none z-0 animate-orb" style={{ animationDelay: "0s" }} />
      <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] rounded-full bg-amber-500/10 dark:bg-amber-500/5 blur-[150px] pointer-events-none z-0 animate-orb" style={{ animationDelay: "-3s" }} />
      <div className="absolute top-1/2 right-1/3 w-[400px] h-[400px] rounded-full bg-green-400/10 dark:bg-green-400/3 blur-[100px] pointer-events-none z-0 animate-orb" style={{ animationDelay: "-6s" }} />

      {/* Floating Leaves (Across entire viewport) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
        <span className="floating-leaf text-emerald-500/20 text-3xl" style={{ left: "10%", top: "-5%", animationDelay: "0s", animationDuration: "14s" }}>🍃</span>
        <span className="floating-leaf text-emerald-600/15 text-2xl" style={{ left: "35%", top: "-5%", animationDelay: "3s", animationDuration: "18s" }}>🍂</span>
        <span className="floating-leaf text-emerald-500/15 text-4xl" style={{ left: "70%", top: "-5%", animationDelay: "6s", animationDuration: "16s" }}>🍃</span>
        <span className="floating-leaf text-emerald-600/20 text-xl" style={{ left: "25%", top: "-5%", animationDelay: "9s", animationDuration: "12s" }}>🍃</span>
        <span className="floating-leaf text-emerald-500/15 text-3xl" style={{ left: "85%", top: "-5%", animationDelay: "12s", animationDuration: "20s" }}>🍂</span>
      </div>

      {/* Left Panel - Premium Brand Story (Hidden on mobile) */}
      <div className="hidden lg:flex lg:col-span-5 relative bg-emerald-950 items-center justify-center p-12 overflow-hidden border-r border-border z-10">
        {/* Orchard Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-[12s] hover:scale-105"
          style={{ backgroundImage: "url('/login_orchard_backdrop.png')" }}
        />
        {/* Premium Dark Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-emerald-950 via-emerald-950/70 to-emerald-900/30" />
        
        {/* Brand Card */}
        <div className="relative z-10 max-w-md bg-black/30 border border-white/10 p-8 rounded-3xl backdrop-blur-md space-y-6 text-white text-center shadow-2xl">
          <Link href="/" className="inline-flex items-center gap-2 text-[#fbbf24] hover:text-amber-400 transition-colors">
            <ShoppingBag className="w-8 h-8 stroke-[2.5]" />
            <span className="font-serif-heading text-2xl font-black tracking-wide text-white">MangoDB</span>
          </Link>
          <h2 className="font-serif-heading text-3xl font-bold leading-tight">
            Rajshahi's Premium Harvest
          </h2>
          <p className="text-sm text-emerald-100/80 leading-relaxed font-light">
            Handpicked, chemical-free, and delivered fresh. Experience the true taste of premium Bangladeshi mangoes.
          </p>
        </div>
      </div>

      {/* Right Panel - Form (Centered) */}
      <div className="flex flex-col lg:col-span-7 items-center justify-center p-6 sm:p-12 relative min-h-screen z-10">
        
        {/* Header Buttons */}
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
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>

        {/* Login Card */}
        <div className="w-full max-w-md bg-white/70 dark:bg-[#0a1a12]/80 border border-white/50 dark:border-emerald-400/15 rounded-[2.5rem] p-8 sm:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.03)] dark:shadow-[0_30px_60px_rgba(0,0,0,0.5)] relative z-10 space-y-8 backdrop-blur-xl animate-fade-in">
          
          {/* Brand Logo & Header */}
          <div className="text-center space-y-4">
            <div className="relative inline-flex items-center justify-center">
              {/* Outer glowing ring */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-400 to-emerald-500 blur-md opacity-40 animate-pulse" />
              {/* Inner glass badge */}
              <div className="relative w-14 h-14 rounded-2xl bg-white/80 dark:bg-[#0d2418]/80 border border-white/60 dark:border-amber-400/25 flex items-center justify-center shadow-md">
                <Sparkles className="w-5 h-5 text-emerald-600 dark:text-amber-400" />
              </div>
            </div>
            
            <div className="space-y-1.5">
              <h2 className="font-serif-heading text-3xl font-black tracking-tight bg-gradient-to-r from-emerald-800 to-green-600 dark:from-amber-300 dark:to-amber-500 bg-clip-text text-transparent">
                Welcome Back
              </h2>
              <p className="text-xs text-muted-foreground max-w-[280px] mx-auto leading-relaxed font-sans font-medium">
                Sign in to access your fresh orchard deliveries.
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex bg-muted-bg border border-border p-1 rounded-2xl relative z-10">
            <button
              type="button"
              onClick={() => setActiveTab("customer")}
              className={`flex-1 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                activeTab === "customer"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-muted-foreground hover:text-hero-text"
              }`}
            >
              Customer
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("admin")}
              className={`flex-1 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                activeTab === "admin"
                  ? "bg-amber-500 text-black shadow-sm"
                  : "text-muted-foreground hover:text-hero-text"
              }`}
            >
              Admin Panel
            </button>
          </div>

          {/* Input Form */}
          {activeTab === "customer" ? (
            <form onSubmit={handlePhoneSubmit} className="space-y-6">
              <div className="space-y-2.5">
                <label className="text-[11px] font-extrabold text-emerald-800 dark:text-emerald-400 tracking-widest uppercase block font-sans">
                  Enter Phone Number
                </label>
                
                {/* Premium Input Container */}
                <div className="flex items-center gap-3 bg-white/60 dark:bg-[#0d2418]/60 border border-black/10 dark:border-emerald-400/15 rounded-2xl p-2.5 focus-within:border-emerald-500/40 dark:focus-within:border-amber-400/50 focus-within:ring-4 focus-within:ring-emerald-500/5 dark:focus-within:ring-amber-400/10 transition-all shadow-sm">
                  {/* Pill Flag Badge with Dropdown Arrow */}
                  <div className="flex items-center gap-2 bg-black/[0.03] dark:bg-white/[0.06] border border-black/5 dark:border-white/10 py-1.5 px-3 rounded-xl select-none shrink-0 shadow-sm">
                    <span className="text-lg leading-none">🇧🇩</span>
                    <span className="text-sm font-black text-hero-text">+880</span>
                    <span className="text-[9px] text-muted-foreground/55 font-bold">▼</span>
                  </div>
                  
                  <input
                    type="tel"
                    required
                    placeholder="1754-309016"
                    value={phoneNumber}
                    onChange={handlePhoneChange}
                    className="w-full bg-transparent border-0 text-hero-text placeholder-muted-foreground/60 focus:ring-0 focus:outline-none text-base font-extrabold tracking-widest"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="shimmer-btn w-full py-4 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-extrabold rounded-2xl shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/30 hover:-translate-y-0.5 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-xs tracking-widest uppercase font-sans border border-emerald-500/20"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending OTP...
                  </>
                ) : (
                  "Submit"
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleAdminSubmit} className="space-y-6">
              <div className="space-y-4">
                {/* Username */}
                <div className="space-y-2.5">
                  <label className="text-[11px] font-extrabold text-amber-500 tracking-widest uppercase block font-sans">
                    Username
                  </label>
                  <div className="flex items-center gap-3 bg-white/60 dark:bg-[#0d2418]/60 border border-black/10 dark:border-emerald-400/15 rounded-2xl p-3 focus-within:border-amber-400/50 focus-within:ring-4 focus-within:ring-amber-400/10 transition-all shadow-sm">
                    <User className="w-4 h-4 text-muted-foreground/60 shrink-0" />
                    <input
                      type="text"
                      required
                      placeholder="Username (e.g. admin)"
                      value={adminUsername}
                      onChange={(e) => setAdminUsername(e.target.value)}
                      className="w-full bg-transparent border-0 text-hero-text placeholder-muted-foreground/60 focus:ring-0 focus:outline-none text-sm font-bold"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-2.5">
                  <label className="text-[11px] font-extrabold text-amber-500 tracking-widest uppercase block font-sans">
                    Password
                  </label>
                  <div className="flex items-center gap-3 bg-white/60 dark:bg-[#0d2418]/60 border border-black/10 dark:border-emerald-400/15 rounded-2xl p-3 focus-within:border-amber-400/50 focus-within:ring-4 focus-within:ring-amber-400/10 transition-all shadow-sm">
                    <Lock className="w-4 h-4 text-muted-foreground/60 shrink-0" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      className="w-full bg-transparent border-0 text-hero-text placeholder-muted-foreground/60 focus:ring-0 focus:outline-none text-sm font-bold"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="shimmer-btn w-full py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold rounded-2xl shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 hover:-translate-y-0.5 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-xs tracking-widest uppercase font-sans border border-amber-500/20"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Verifying Admin...
                  </>
                ) : (
                  "Log In as Admin"
                )}
              </button>
            </form>
          )}

          {/* Signup Redirection Link */}
          <div className="text-center">
            <p className="text-xs text-muted-foreground font-medium">
              Don't have an account?{" "}
              <Link href="/signup" className="text-emerald-600 dark:text-emerald-400 font-extrabold hover:underline">
                Sign Up
              </Link>
            </p>
          </div>

          {/* Fine Print */}
          <p className="text-[10px] text-muted-foreground/70 text-center font-sans leading-relaxed px-4">
            By continuing, you agree to MangoDB's Terms of Service and Privacy Policy. We'll send a 6-digit OTP via SMS. Standard rates apply.
          </p>
        </div>
      </div>

      {/* OTP Verification Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={() => !isSuccess && setShowOtpModal(false)}
          />

          {/* Modal Panel */}
          <div className="relative w-full max-w-sm bg-white/90 dark:bg-[#0a1a12]/90 border border-white/40 dark:border-emerald-400/15 rounded-[2.5rem] shadow-2xl dark:shadow-[0_30px_60px_rgba(0,0,0,0.5)] p-8 text-center z-10 animate-fade-in space-y-6 backdrop-blur-xl">
            
            {/* Close Button */}
            {!isSuccess && (
              <button 
                onClick={() => setShowOtpModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg bg-black/[0.03] dark:bg-white/[0.06] border border-black/5 dark:border-white/10 text-muted-foreground hover:text-hero-text transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* Icon / Status badge */}
            <div className="flex justify-center">
              {isSuccess ? (
                <div className="w-16 h-16 rounded-full bg-emerald-500/15 text-emerald-500 flex items-center justify-center animate-bounce">
                  <Check className="w-8 h-8 stroke-[3]" />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-full bg-[#fbbf24]/10 dark:bg-[#fbbf24]/5 border border-[#fbbf24]/20 text-[#fbbf24] flex items-center justify-center relative">
                  <ShieldCheck className="w-8 h-8" />
                  <div className="absolute top-0 right-0 w-4 h-4 rounded-full bg-emerald-500 border-2 border-card flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 text-white stroke-[3]" />
                  </div>
                </div>
              )}
            </div>

            {/* Header Text */}
            <div className="space-y-1">
              <h3 className="font-serif-heading text-2xl font-bold text-hero-text">
                {isSuccess ? "Success" : "Verification Code"}
              </h3>
              <p className="text-xs text-muted-foreground font-sans max-w-[250px] mx-auto leading-relaxed">
                {isSuccess 
                  ? "Taking you to your fresh mango dashboard..." 
                  : `Enter the 6-digit code sent to +880 ${phoneNumber}`
                }
              </p>
            </div>

            {/* OTP Form */}
            {!isSuccess && (
              <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
                {/* 6 Inputs */}
                <div 
                  className={`flex justify-center gap-2 ${shouldShake ? "shake-element" : ""}`}
                  onPaste={handlePaste}
                >
                  {otpValues.map((val, idx) => (
                    <input
                      key={idx}
                      ref={inputRefs[idx]}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={val}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(idx, e)}
                      className={`w-11 h-12 sm:w-12 sm:h-14 bg-white/40 dark:bg-[#0d2418]/60 border rounded-2xl text-center font-black text-xl text-hero-text transition-all focus:ring-0 focus:outline-none ${
                        isOtpError 
                          ? "border-red-500/60 focus:border-red-500" 
                          : "border-black/10 dark:border-emerald-400/15 focus:border-emerald-500/50 dark:focus:border-amber-400/50 focus:ring-4 focus:ring-emerald-500/5 dark:focus:ring-amber-400/10"
                      }`}
                    />
                  ))}
                </div>

                {/* Resend timer */}
                <div className="text-xs font-sans">
                  {isResendActive ? (
                    <button
                      type="button"
                      onClick={handleResendCode}
                      className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline cursor-pointer"
                    >
                      Resend Code
                    </button>
                  ) : (
                    <span className="text-muted-foreground">
                      Resend code in <strong className="text-hero-text">{timer}s</strong>
                    </span>
                  )}
                </div>

                {/* Loader showing if verifying */}
                {isVerifying && (
                  <div className="flex items-center justify-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-bold font-sans">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Verifying code...
                  </div>
                )}
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
