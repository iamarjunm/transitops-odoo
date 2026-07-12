"use client";

import { useState } from "react";
import Image from "next/image";
import { useStore } from "@/lib/store";
import { Role } from "@/lib/types";
import { Truck, Mail, Lock, ArrowRight } from "lucide-react";
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
        <div className="absolute inset-0">
          <Image 
            src="https://picsum.photos/seed/transitops/1920/1080" 
            alt="Logistics background" 
            fill
            className="object-cover opacity-[0.08] dark:opacity-30 mix-blend-multiply dark:mix-blend-luminosity"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-50 via-gray-50/80 to-transparent dark:from-neutral-950 dark:via-neutral-900/80 dark:to-transparent" />
        </div>
        
        <div className="relative z-10 flex flex-col justify-between w-full p-12 lg:p-16">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-500/20">
              <Truck className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white tracking-tight">TransitOps</h1>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-lg"
          >
            <h2 className="text-4xl font-display font-semibold text-gray-900 dark:text-white leading-tight mb-5">
              Command center for your entire transport operation.
            </h2>
            <p className="text-gray-600 dark:text-neutral-300 text-lg leading-relaxed">
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

        </motion.div>
      </div>
    </div>
  );
}
