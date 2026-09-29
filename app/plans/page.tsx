// app/plans/page.tsx
import { getUserPlans } from "@/app/actions/plans";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { Plus, ArrowLeft } from "lucide-react";

export default async function PlansPage() {
  const plans = await getUserPlans();

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6 pb-24">
        <div className="flex justify-between items-center">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-[13px] text-[#7a7a7a] hover:text-[#1d1d1f] mb-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Terug
            </Link>
            <h1 className="text-[34px] font-semibold tracking-[-0.374px] text-[#1d1d1f]">
              Workout Plannen
            </h1>
          </div>
          <Link
            href="/plans/new"
            className="inline-flex items-center gap-1.5 bg-[#0066cc] text-white text-[14px] font-normal py-[9px] px-[18px] rounded-full transition apple-btn-active"
          >
            <Plus className="w-4 h-4" />
            <span>Nieuw Plan</span>
          </Link>
        </div>

        {plans.length === 0 ? (
          <div className="bg-[#ffffff] border border-[#e5e5ea] rounded-[18px] p-8 text-center space-y-4">
            <p className="text-[17px] text-[#7a7a7a] font-normal leading-[1.47]">
              Je hebt nog geen schema's aangemaakt. Maak een plan zoals Push, Pull of Legs aan.
            </p>
            <Link
              href="/plans/new"
              className="inline-block bg-[#0066cc] text-white text-[15px] font-normal py-[10px] px-[20px] rounded-full apple-btn-active"
            >
              Maak je eerste plan
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className="bg-[#ffffff] border border-[#e5e5ea] rounded-[18px] p-6 space-y-4"
              >
                <div>
                  <h2 className="text-[21px] font-semibold text-[#1d1d1f] tracking-[-0.231px]">
                    {plan.name}
                  </h2>
                  <p className="text-[13px] text-[#7a7a7a]">
                    {plan.exercises.length} oefeningen
                  </p>
                </div>

                <div className="divide-y divide-[#f0f0f0] border-t border-[#f0f0f0] pt-2">
                  {plan.exercises.map((ex) => (
                    <div key={ex.id} className="py-2.5 flex justify-between items-center text-[15px]">
                      <span className="text-[#1d1d1f] font-normal">{ex.name}</span>
                      <span className="text-[13px] text-[#7a7a7a] font-mono">
                        {ex.targetSets} sets • {ex.restSeconds}s
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}