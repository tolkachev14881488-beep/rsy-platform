import { NextResponse } from "next/server";
import { prisma, LayoutVariant } from "@rsy/db";
import { requireProject } from "@/lib/project";

export async function POST(request: Request) {
  try {
    const project = await requireProject();
    const body = await request.json();
    const variant = body.variant as LayoutVariant;
    const revenue = Number(body.revenue) || 0;
    const impressions = Number(body.impressions) || 0;
    const bounceRate = body.bounceRate != null ? Number(body.bounceRate) : undefined;

    if (variant !== "A" && variant !== "B") {
      return NextResponse.json({ error: "Invalid variant" }, { status: 400 });
    }

    const test = await prisma.layoutTest.findFirst({
      where: { projectId: project.id, variant, active: true },
    });

    if (!test) {
      return NextResponse.json({ error: "No active test for variant" }, { status: 404 });
    }

    await prisma.layoutTest.update({
      where: { id: test.id },
      data: {
        revenue: { increment: revenue },
        impressions: { increment: impressions },
        bounceRate: bounceRate ?? test.bounceRate,
      },
    });

    const allTests = await prisma.layoutTest.findMany({
      where: { projectId: project.id, active: true, name: test.name },
    });

    const leader = [...allTests].sort((a, b) => b.revenue - a.revenue)[0];

    return NextResponse.json({
      updated: test.id,
      leader: leader?.variant,
      recommendation:
        leader && leader.revenue > 0
          ? `Вариант ${leader.variant} лидирует по доходу. Рассмотрите отключение проигравшего варианта.`
          : "Недостаточно данных для рекомендации",
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Update failed" },
      { status: 500 }
    );
  }
}
