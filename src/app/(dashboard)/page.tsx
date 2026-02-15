import { getDashboardStats } from "@/lib/dashboard";
import { StatsCards } from "@/components/stats-cards";
import { LazyRevenueChart } from "@/components/lazy-revenue-chart";
import { RecentProjects } from "@/components/recent-projects";

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        <h1 className="text-2xl font-semibold text-foreground">Overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your business at a glance
        </p>
      </div>
      <StatsCards
        totalRevenue={stats.totalRevenue}
        activeProjects={stats.activeProjects}
        hoursThisMonth={stats.hoursThisMonth}
        totalClients={stats.totalClients}
        draftInvoices={stats.draftInvoices}
        overdueInvoices={stats.overdueInvoices}
        trends={stats.trends}
      />
      <div className="px-4 lg:px-6">
        <LazyRevenueChart data={stats.revenueByMonth} />
      </div>
      <div className="px-4 lg:px-6">
        <RecentProjects projects={stats.recentProjects} />
      </div>
    </div>
  );
}
