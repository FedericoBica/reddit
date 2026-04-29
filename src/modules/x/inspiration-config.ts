export const INSPIRATION_ANGLES = [
  { id: "insight",  label: "Insight",  angle: "Share a sharp industry observation or lesson — specific, opinionated, backed by something you've seen firsthand" },
  { id: "story",    label: "Story",    angle: "Tell a short first-person story — a win, a failure, or a behind-the-scenes moment from building your product" },
  { id: "question", label: "Question", angle: "Ask a single thought-provoking question that sparks genuine debate or reflection in your niche" },
  { id: "hot-take", label: "Hot Take", angle: "Share a bold contrarian take — something most people in your industry get wrong, stated directly" },
  { id: "product",  label: "Product",  angle: "Write about a real problem your product solves, leading with the pain — not the solution" },
] as const;

export type InspirationAngle = typeof INSPIRATION_ANGLES[number];
