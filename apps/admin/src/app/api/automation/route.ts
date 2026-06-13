import { NextResponse } from "next/server";
import { runAutomationPipeline, getTrendSummary } from "@rsy/automation";
import { requireProject } from "@/lib/project";

export async function POST(request: Request) {
  try {
    const project = await requireProject();
    const body = await request.json().catch(() => ({}));
    const result = await runAutomationPipeline(project.id, {
      force: body.force === true,
    });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Automation failed" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const project = await requireProject();
    const summary = await getTrendSummary(project.id);
    return NextResponse.json(summary);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 500 }
    );
  }
}
