import { prisma } from "@/lib/prisma";
import { ProjectSummary } from "@/components/project-summary";
import { notFound } from "next/navigation";

interface ProjectPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { id } = await params;

  const [project, clients] = await Promise.all([
    prisma.project.findUnique({
      where: { id },
      include: {
        client: { select: { id: true, name: true, company: true } },
        tasks: {
          select: { id: true, status: true, subtasks: { select: { completed: true } } },
        },
        timeEntries: {
          select: {
            id: true, startTime: true, duration: true, notes: true,
            task: { select: { title: true } },
          },
          orderBy: { startTime: "desc" },
        },
        invoices: {
          select: { id: true, status: true, total: true },
        },
      },
    }),
    prisma.client.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!project) {
    notFound();
  }

  // --- Task Breakdown ---
  const todo = project.tasks.filter((t) => t.status === "TODO").length;
  const inProgress = project.tasks.filter((t) => t.status === "IN_PROGRESS").length;
  const done = project.tasks.filter((t) => t.status === "DONE").length;
  const taskTotal = project.tasks.length;

  const allSubtasks = project.tasks.flatMap((t) => t.subtasks);
  const subtaskTotal = allSubtasks.length;
  const subtaskDone = allSubtasks.filter((s) => s.completed).length;

  const taskBreakdown = {
    total: taskTotal,
    todo,
    inProgress,
    done,
    completionPercent: taskTotal > 0 ? Math.round((done / taskTotal) * 100) : 0,
    subtaskTotal,
    subtaskDone,
  };

  // --- Time Stats ---
  const completedEntries = project.timeEntries.filter((e) => e.duration != null);
  const totalMinutes = completedEntries.reduce((sum, e) => sum + (e.duration ?? 0), 0);
  const totalHours = totalMinutes / 60;
  const hourlyRate = project.hourlyRate ? Number(project.hourlyRate) : 0;
  const totalEarned = totalHours * hourlyRate;

  const timeStats = { totalMinutes, totalHours, totalEarned };

  // --- Budget Stats ---
  const budgetRaw = project.budget ? Number(project.budget) : 0;
  const consumed = totalEarned;
  const consumedPercent = budgetRaw > 0 ? Math.round((consumed / budgetRaw) * 100) : 0;
  const remaining = Math.max(0, budgetRaw - consumed);

  const budgetStats = { budgetRaw, consumed, consumedPercent, remaining };

  // --- Invoice Stats ---
  const invoiceCount = project.invoices.length;
  const totalInvoiced = project.invoices.reduce((sum, inv) => sum + Number(inv.total), 0);
  const paidInvoices = project.invoices.filter((inv) => inv.status === "PAID");
  const totalPaid = paidInvoices.reduce((sum, inv) => sum + Number(inv.total), 0);

  const invoiceStats = {
    count: invoiceCount,
    totalInvoiced,
    totalPaid,
    draft: project.invoices.filter((inv) => inv.status === "DRAFT").length,
    sent: project.invoices.filter((inv) => inv.status === "SENT").length,
    paid: paidInvoices.length,
    overdue: project.invoices.filter((inv) => inv.status === "OVERDUE").length,
  };

  // --- Recent Activity (last 5 time entries) ---
  const recentActivity = project.timeEntries.slice(0, 5).map((entry) => ({
    id: entry.id,
    date: entry.startTime.toISOString(),
    taskTitle: entry.task?.title ?? null,
    durationMinutes: entry.duration ?? null,
    notes: entry.notes,
  }));

  // --- Serialize project ---
  const serializedProject = {
    id: project.id,
    name: project.name,
    websiteUrl: project.websiteUrl,
    logoUrl: project.logoUrl,
    brandProfile: project.brandProfile,
    seoAudit: project.seoAudit,
    description: project.description,
    status: project.status,
    startDate: project.startDate ? project.startDate.toISOString() : null,
    endDate: project.endDate ? project.endDate.toISOString() : null,
    budget: project.budget ? String(project.budget) : null,
    hourlyRate: project.hourlyRate ? String(project.hourlyRate) : null,
    clientId: project.clientId,
    client: {
      id: project.client.id,
      name: project.client.name,
      company: project.client.company,
    },
  };

  return (
    <div className="flex flex-col gap-4 px-4 py-4 lg:px-6 md:gap-6 md:py-6">
      <ProjectSummary
        project={serializedProject}
        clients={clients}
        taskBreakdown={taskBreakdown}
        timeStats={timeStats}
        budgetStats={budgetStats}
        invoiceStats={invoiceStats}
        recentActivity={recentActivity}
      />
    </div>
  );
}
