import { NextResponse } from "next/server";
import { prisma } from "@rsy/db";
import { requireProject } from "@/lib/project";

export async function PATCH(request: Request) {
  try {
    const project = await requireProject();
    const body = await request.json();

    const settings = await prisma.automationSettings.upsert({
      where: { projectId: project.id },
      update: {
        enabled: body.enabled ?? undefined,
        autoPublish: body.autoPublish ?? undefined,
        maxArticlesPerRun: body.maxArticlesPerRun ?? undefined,
        maxArticlesPerDay: body.maxArticlesPerDay ?? undefined,
        scanIntervalHours: body.scanIntervalHours ?? undefined,
        seedKeywords: body.seedKeywords ?? undefined,
      },
      create: {
        projectId: project.id,
        enabled: body.enabled ?? true,
        autoPublish: body.autoPublish ?? true,
        maxArticlesPerRun: body.maxArticlesPerRun ?? 5,
        maxArticlesPerDay: body.maxArticlesPerDay ?? 20,
        scanIntervalHours: body.scanIntervalHours ?? 6,
        seedKeywords: body.seedKeywords ?? [],
      },
    });

    return NextResponse.json(settings);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Update failed" },
      { status: 500 }
    );
  }
}
