import { supabase } from "@/lib/supabase";

type G = { kn: unknown[]; tl: string[][]; fc: string[][]; qz: unknown[][] };
type Out = { h: Record<number, G>; g: Record<number, G>; pf: unknown[]; rg: unknown[] };

export async function GET() {
  const [ls, fg, rg] = await Promise.all([
    supabase
      .from("lessons")
      .select(
        "id, subject, grade, keyword, image_emoji, summary, example, timeline_events(id, year, title, icon, summary), flashcards(id, question, answer), quiz_questions(id, statement, is_true, explanation)"
      )
      .order("id"),
    supabase.from("figures").select("*").order("id"),
    supabase.from("regions").select("*").order("id"),
  ]);

  if (ls.error || !ls.data) {
    return Response.json({ ok: false, error: ls.error?.message }, { status: 500 });
  }

  const byId = <T extends { id: number }>(a: T[]) =>
    [...a].sort((x, y) => x.id - y.id);

  const out: Out = { h: {}, g: {}, pf: [], rg: [] };
  for (const l of ls.data) {
    const o = out[l.subject === "history" ? "h" : "g"];
    const x = (o[l.grade] ??= { kn: [], tl: [], fc: [], qz: [] });
    x.kn.push({ k: l.keyword, i: l.image_emoji, c: l.summary, e: l.example });
    x.tl.push(...l.timeline_events.map((t) => [t.year, t.title, t.icon, t.summary]));
    x.fc.push(...byId(l.flashcards).map((f) => [f.question, f.answer]));
    x.qz.push(
      ...byId(l.quiz_questions).map((q) => [q.statement, q.is_true ? 1 : 0, q.explanation])
    );
  }
  for (const g of Object.values(out.h)) {
    g.tl.sort((a, b) => Number(a[0]) - Number(b[0]));
  }
  out.pf = (fg.data ?? []).map((f) => [f.name, f.icon, f.title, f.quote, f.achievement]);
  out.rg = (rg.data ?? []).map((r) => [r.name, r.icon, r.summary]);

  return Response.json(out, {
    headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
  });
}