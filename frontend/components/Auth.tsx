"use client";

import { useState } from "react";
import Image from "next/image";
import { useStore } from "@/lib/store";
import { Role } from "@/lib/types";
import { Truck, Mail, Lock, ArrowRight, TrendingUp } from "lucide-react";
import { motion } from "motion/react";

type AuthMode = "login";

type BackendUser = {
  id: number;
  full_name: string;
  email: string;
  role: Role;
  is_active: boolean;
  created_at: string;
};

type AuthResponse = {
  access_token: string;
  token_type: string;
  role: Role;
  user: BackendUser;
};

const API_BASE_URL = (process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:8000").replace(/\/$/, "");

const demoUsers = [
  { role: "Admin", email: "admin@transitops.com", password: "Admin@123" },
  { role: "Fleet Manager", email: "fleet@transitops.com", password: "Fleet@123" },
  { role: "Dispatcher", email: "dispatch@transitops.com", password: "Dispatch@123" },
  { role: "Safety Officer", email: "safety@transitops.com", password: "Safety@123" },
  { role: "Financial Analyst", email: "finance@transitops.com", password: "Finance@123" },
];


export default function Auth() {
  const { login } = useStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !password) return;

    try {
      setIsSubmitting(true);

      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: trimmedEmail, password }),
      });

      const data = (await response.json().catch(() => null)) as AuthResponse | { detail?: string } | null;

      if (!response.ok) {
        throw new Error(data && "detail" in data && data.detail ? data.detail : "Authentication failed.");
      }

      const authData = data as AuthResponse;
      login(
        {
          email: authData.user.email,
          name: authData.user.full_name,
          role: authData.user.role,
        },
        authData.access_token
      );

      setPassword("");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Authentication failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white dark:bg-neutral-950 font-sans">
      {/* Left side - Image/Branding */}
      <div className="hidden lg:flex w-1/2 relative bg-gray-50 dark:bg-neutral-900 border-r border-gray-200 dark:border-neutral-800 overflow-hidden">
        <div className="absolute inset-0 bg-slate-950 flex flex-col justify-center items-center overflow-hidden p-8">
          <style>{`
            @keyframes dash {
              to {
                stroke-dashoffset: -200;
              }
            }
          `}</style>
          
          {/* Grid background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-60" />
          
          {/* Glowing nodes and routes */}
          <div className="relative w-full max-w-md aspect-square flex items-center justify-center scale-90 translate-y-6">
            {/* Pulsing glow backdrops */}
            <div className="absolute top-1/4 left-1/4 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl" />

            {/* SVG connecting routes */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 400" fill="none">
              {/* Route 1 */}
              <path d="M 80 150 Q 200 80 320 220" stroke="rgba(59, 130, 246, 0.15)" strokeWidth="3" strokeDasharray="6 6" />
              <path d="M 80 150 Q 200 80 320 220" stroke="url(#blue-grad)" strokeWidth="3" strokeDasharray="30 150" className="animate-[dash_6s_linear_infinite]" />
              
              {/* Route 2 */}
              <path d="M 80 150 Q 150 280 280 320" stroke="rgba(16, 185, 129, 0.15)" strokeWidth="3" strokeDasharray="6 6" />
              <path d="M 80 150 Q 150 280 280 320" stroke="url(#green-grad)" strokeWidth="3" strokeDasharray="40 160" className="animate-[dash_8s_linear_infinite]" />

              <defs>
                <linearGradient id="blue-grad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0" />
                  <stop offset="50%" stopColor="#3b82f6" stopOpacity="1" />
                  <stop offset="100%" stopColor="#60a5fa" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="green-grad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0" />
                  <stop offset="50%" stopColor="#10b981" stopOpacity="1" />
                  <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>

            {/* Interactive nodes */}
            <div className="absolute top-[130px] left-[55px] flex flex-col items-center">
              <div className="w-5 h-5 rounded-full bg-blue-500/20 border-2 border-blue-500 flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-ping absolute" />
                <div className="w-2 h-2 rounded-full bg-blue-500" />
              </div>
              <span className="text-[9px] font-mono font-semibold text-gray-400 mt-1 uppercase tracking-wider">Depot Alpha</span>
            </div>

            <div className="absolute top-[200px] right-[55px] flex flex-col items-center">
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping absolute" />
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>
              <span className="text-[9px] font-mono font-semibold text-gray-400 mt-1 uppercase tracking-wider">Warehouse Beta</span>
            </div>

            <div className="absolute bottom-[60px] left-[255px] flex flex-col items-center">
              <div className="w-5 h-5 rounded-full bg-purple-500/20 border-2 border-purple-500 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-purple-500" />
              </div>
              <span className="text-[9px] font-mono font-semibold text-gray-400 mt-1 uppercase tracking-wider">Hub Gamma</span>
            </div>

            {/* Floating stats card overlay mockups */}
            <div className="absolute top-[20px] right-[10px] bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-3 shadow-xl flex items-center gap-2.5 animate-bounce [animation-duration:5s]">
              <div className="p-1.5 bg-blue-500/10 rounded-lg text-blue-400"><Truck className="w-3.5 h-3.5" /></div>
              <div>
                <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Active Dispatch</p>
                <p className="text-[11px] font-bold text-white mt-0.5 font-mono">GJ01AB1104 <span className="text-[9px] font-normal text-emerald-400 font-sans">On Time</span></p>
              </div>
            </div>

            <div className="absolute bottom-[80px] left-[0px] bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-3 shadow-xl flex items-center gap-2.5 animate-bounce [animation-duration:6s]">
              <div className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-400"><TrendingUp className="w-3.5 h-3.5" /></div>
              <div>
                <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Fleet Performance</p>
                <p className="text-[11px] font-bold text-white mt-0.5 font-mono">94.8% <span className="text-[9px] font-normal text-gray-400 font-sans">Avg. Score</span></p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="relative z-10 flex flex-col justify-between w-full p-12 lg:p-16">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-500/25">
              <Truck className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-display font-bold text-white tracking-tight">TransitOps</h1>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-lg"
          >
            <h2 className="text-4xl font-display font-semibold text-white leading-tight mb-5">
              Command center for your entire transport operation.
            </h2>
            <p className="text-gray-300 text-base leading-relaxed">
              Real-time tracking, intelligent dispatching, and predictive maintenance—all in one unified platform.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 sm:px-12 lg:px-24 xl:px-32 relative">
        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-50/50 via-transparent to-transparent dark:from-blue-900/10 hidden lg:block pointer-events-none" />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-sm mx-auto relative z-10"
        >
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-md">
              <Truck className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white tracking-tight">TransitOps</h1>
          </div>

          <div className="mb-10">
            <h2 className="text-3xl font-display font-bold text-gray-900 dark:text-white tracking-tight mb-2">
              Welcome back
            </h2>
            <p className="text-gray-500 dark:text-neutral-400">Please enter your details to sign in.</p>
          </div>

          {error && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all sm:text-sm shadow-sm"
                  placeholder="name@company.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all sm:text-sm shadow-sm"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="group w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 dark:focus:ring-blue-500 transition-all mt-4 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Please wait..." : "Sign in"}
              <ArrowRight className="ml-2 h-4 w-4 opacity-70 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <div className="mt-8 border-t border-gray-100 dark:border-neutral-800 pt-6">
            <p className="text-[10px] font-bold text-gray-400 dark:text-neutral-500 uppercase tracking-widest mb-3">Quick Demo Logins</p>
            <div className="grid grid-cols-2 gap-2">
              {demoUsers.map((user, i) => (
                <button
                  key={user.email}
                  type="button"
                  onClick={() => {
                    setEmail(user.email);
                    setPassword(user.password);
                  }}
                  className={`flex flex-col text-left p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100/80 dark:bg-neutral-900/50 dark:hover:bg-neutral-900 border border-gray-200/50 dark:border-neutral-800/80 transition-all active:scale-[0.97] ${i === 4 ? "col-span-2" : ""}`}
                >
                  <span className="text-xs font-semibold text-gray-900 dark:text-neutral-200">{user.role}</span>
                  <span className="text-[10px] text-gray-400 dark:text-neutral-500 truncate mt-0.5">{user.email}</span>
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
