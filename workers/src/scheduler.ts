import cron from "node-cron";
import { prisma } from "@rsy/db";
import { siteConfig } from "@rsy/config";
import { runAutomationPipeline } from "@rsy/automation";

export function startAutomationScheduler() {
  cron.schedule("0 */6 * * *", async () => {
    try {
      const project = await prisma.project.findFirst({
        where: { domain: siteConfig.domain },
        include: { automationSettings: true },
      });
      if (!project?.automationSettings?.enabled) return;

      console.log("[scheduler] Starting automation run...");
      const result = await runAutomationPipeline(project.id);
      console.log("[scheduler] Done:", result);
    } catch (e) {
      console.error("[scheduler] Failed:", e);
    }
  });

  console.log("[scheduler] Automation cron active (every 6 hours)");
}
