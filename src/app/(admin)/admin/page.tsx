import type { Metadata } from "next";
import { getAdminDb } from "@/lib/firebase-admin";
import { DICTIONARY } from "@/constants/dictionary";
import { Map, Bug, Sparkles } from "lucide-react";
import { connection } from "next/server";
import { StatCard } from "@/features/dashboard/components/StatCard";
import { SystemStatusCard } from "@/features/dashboard/components/SystemStatusCard";

export const metadata: Metadata = {
  title: `Dashboard | ${DICTIONARY.global.brand} ${DICTIONARY.admin.dashboard.subtitle}`,
  robots: { index: false, follow: false },
};

const getDashboardStats = async () => {
  await connection();
  const db = getAdminDb();
  const [regions, pests, combinations] = await Promise.all([
    db.collection("regions").count().get(),
    db.collection("pests").count().get(),
    db.collection("combinations").count().get(),
  ]);

  return {
    regions: regions.data().count,
    pests: pests.data().count,
    combinations: combinations.data().count,
  };
};

export default async function AdminPage() {
  const stats = await getDashboardStats();
  const d = DICTIONARY.admin.dashboard;

  const cards = [
    {
      title: d.stats.totalRegions,
      value: stats.regions,
      icon: Map,
      colorClass: "text-info-text",
      bgClass: "bg-info-bg",
    },
    {
      title: d.stats.totalPests,
      value: stats.pests,
      icon: Bug,
      colorClass: "text-error-text",
      bgClass: "bg-error-bg",
    },
    {
      title: d.stats.totalCombinations,
      value: stats.combinations,
      icon: Sparkles,
      colorClass: "text-brand-primary",
      bgClass: "bg-brand-primary/10",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading font-bold text-text-primary text-3xl tracking-tight">
          {d.title}
        </h1>
        <p className="text-text-muted mt-1">
          {d.subtitle}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, index) => (
          <StatCard
            key={index}
            title={card.title}
            value={card.value}
            icon={card.icon}
            colorClass={card.colorClass}
            bgClass={card.bgClass}
          />
        ))}

        {/* System Status Card */}
        <SystemStatusCard 
          title={d.stats.systemStatus} 
          statusLabel={d.stats.active} 
        />
      </div>
    </div>
  );
}
