export function assertSubscriptionOwnership(
  ownedSubscriptionId: string | null | undefined,
  submittedSubscriptionId: string,
): void {
  if (!ownedSubscriptionId || ownedSubscriptionId !== submittedSubscriptionId) {
    throw new Error("Subscription does not belong to the authenticated user");
  }
}
