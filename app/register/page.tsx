// app/register/page.tsx
"use client";

import { useState } from "react";
import { registerUser } from "@/app/actions/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const res = await registerUser(formData);

    if (res?.error) {
      setError(res.error);
      setLoading(false);
    } else {
      router.push("/login?registered=true");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-950 text-zinc-100">
      <div className="w-full max-w-md p-8 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Account aanmaken</h1>
          <p className="text-sm text-zinc-400">Begin met het tracken van je workouts</p>
        </div>

        {error && (
          <div className="p-3 text-sm bg-red-950/50 border border-red-800 text-red-200 rounded-lg text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1">
              Naam
            </label>
            <input
              type="text"
              name="name"
              required
              placeholder="Je naam"
              className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-zinc-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1">
              E-mailadres
            </label>
            <input
              type="email"
              name="email"
              required
              placeholder="naam@voorbeeld.nl"
              className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-zinc-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1">
              Wachtwoord
            </label>
            <input
              type="password"
              name="password"
              required
              placeholder="••••••••"
              className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-zinc-500 text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-white text-zinc-900 hover:bg-zinc-200 font-semibold rounded-lg text-sm transition disabled:opacity-50 cursor-pointer"
          >
            {loading ? "Account maken..." : "Registreren"}
          </button>
        </form>

        <p className="text-center text-xs text-zinc-400">
          Heb je al een account?{" "}
          <Link href="/login" className="text-white hover:underline font-medium">
            Inloggen
          </Link>
        </p>
      </div>
    </div>
  );
}