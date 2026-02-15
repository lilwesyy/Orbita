import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface HealthCheckResult {
  online: boolean;
  statusCode: number | null;
  responseTime: number | null;
  error: string | null;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id },
    select: { websiteUrl: true },
  });

  if (!project?.websiteUrl) {
    return NextResponse.json(
      { online: false, statusCode: null, responseTime: null, error: "No website URL configured" } satisfies HealthCheckResult
    );
  }

  let url = project.websiteUrl;
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }

  try {
    const start = Date.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
      redirect: "follow",
    });

    clearTimeout(timeout);
    const responseTime = Date.now() - start;

    const result: HealthCheckResult = {
      online: res.ok,
      statusCode: res.status,
      responseTime,
      error: null,
    };

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Request failed";
    const result: HealthCheckResult = {
      online: false,
      statusCode: null,
      responseTime: null,
      error: message.includes("abort") ? "Timeout (10s)" : message,
    };

    return NextResponse.json(result);
  }
}
