"use client";

import { useEffect } from "react";
import { markItemRead } from "@/modules/leads/read-actions";

export function ReadMarker({
  itemId,
  itemType,
  projectId,
}: {
  itemId: string;
  itemType: "lead" | "mention";
  projectId: string;
}) {
  useEffect(() => {
    void markItemRead(itemId, itemType, projectId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemId]);
  return null;
}
