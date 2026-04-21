import { NextRequest, NextResponse } from "next/server";

function toRedditPath(permalink: string): string {
  if (!permalink.startsWith("http")) return permalink;
  try { return new URL(permalink).pathname; } catch { return permalink; }
}

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("permalink");
  if (!raw) return NextResponse.json({ error: "Missing permalink" }, { status: 400 });

  const permalink = toRedditPath(raw);
  if (!permalink.startsWith("/r/")) {
    return NextResponse.json({ error: "Invalid permalink" }, { status: 400 });
  }

  try {
    const url = `https://www.reddit.com${permalink}.json?limit=15&sort=top&depth=1`;
    const res = await fetch(url, {
      headers: { "User-Agent": "ReddProwl/1.0 (lead monitoring tool)" },
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Reddit returned an error" }, { status: 502 });
    }

    const data = await res.json();

    const comments = (data[1]?.data?.children ?? [])
      .filter((c: any) => c.kind === "t1" && c.data?.body && c.data.body !== "[deleted]" && c.data.body !== "[removed]")
      .slice(0, 12)
      .map((c: any) => ({
        id: c.data.id as string,
        author: c.data.author as string,
        body: c.data.body as string,
        score: c.data.score as number,
      }));

    return NextResponse.json({ comments });
  } catch {
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
  }
}
