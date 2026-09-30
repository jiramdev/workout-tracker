// app/weight/log/page.tsx
"use client";

import { useState } from "react";
import { logBodyWeight } from "@/app/actions/workout";
import { useRouter } from "next/navigation";
import SubpageHeader from "@/components/SubpageHeader";

export default function WeightLogPage() {
  const router = useRouter();
  const [weight, setWeight] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const val = parseFloat(weight);
    if (!val || val <= 0) {
      setError("Voer een geldig gewicht in.");
      setLoading(false);
      return;
    }

    const res = await logBodyWeight(val);
    if (res?.error) {
      setError(res.error);
      setLoading(false);
    } else {
      router.push("/");
    }
  }

  return (
    <main className="min-h-screen bg-[#baa3d0] text-white p-4 max-w-sm mx-auto space-y-6">
      <SubpageHeader title="Gewicht" href="/account" />

      {error && (
        <div className="p-3 bg-red-950/60 border border-red-800 text-red-200 text-sm rounded-lg">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-5"
      >
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
            Huidig gewicht (in kg)
          </label>
          <input
            type="number"
            step="0.1"
            required
            autoFocus
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="bijv. 82.5"
            className="w-full text-3xl font-extrabold px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-400"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-white text-zinc-950 font-bold rounded-xl text-base hover:bg-zinc-200 transition cursor-pointer disabled:opacity-50"
        >
          {loading ? "Opslaan..." : "Gewicht Opslaan"}
        </button>
      </form>
    </main>
  );
}