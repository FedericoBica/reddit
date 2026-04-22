"use server";

import { z } from "zod";
import { requireAdmin } from "@/modules/auth/admin";
import { saveScheduleSettings } from "@/db/queries/admin";
import { revalidatePath } from "next/cache";

const hourSchema = z.coerce
  .number()
  .int("Must be a whole number")
  .min(0, "Must be 0–23")
  .max(23, "Must be 0–23");

const scheduleSchema = z.object({
  opportunities_hour: hourSchema,
  mentions_hour: hourSchema,
  searchbox_hour: hourSchema,
  searchbox_days: z
    .string()
    .transform((s) =>
      s
        .split(",")
        .map((d) => Number(d.trim()))
        .filter((d) => Number.isInteger(d) && d >= 1 && d <= 31),
    )
    .pipe(
      z
        .number()
        .int()
        .min(1)
        .max(31)
        .array()
        .min(1, "At least one day is required"),
    ),
});

export async function updateScheduleSettings(
  _prev: { error?: string } | null,
  formData: FormData,
): Promise<{ error?: string }> {
  await requireAdmin();

  const result = scheduleSchema.safeParse({
    opportunities_hour: formData.get("opportunities_hour"),
    mentions_hour: formData.get("mentions_hour"),
    searchbox_hour: formData.get("searchbox_hour"),
    searchbox_days: formData.get("searchbox_days"),
  });

  if (!result.success) {
    const message = result.error.issues.map((i) => i.message).join(", ");
    return { error: message };
  }

  await saveScheduleSettings(result.data);
  revalidatePath("/admin/schedule");
  return {};
}
