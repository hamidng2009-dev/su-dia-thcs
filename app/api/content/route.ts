import { supabase } from "@/lib/supabase";

export async function GET() {
  const [ls, fg, rg] = await Promise.all([
    supabase
      .from("lessons")
      .select(
        "id, subject, grade, chapter, lesson_no, title, keyword, image_emoji, summary, example, timeline_events(id, year, title, icon, summary), flashcards(id, question, answer), quiz_questions(id, statement, is_true, explanation)"
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

  const L = ls.data.map((l) => ({
    id: l.id,
    s: l.subject === "history" ? "h" : "g",
    g: l.grade,
    ch: l.chapter,
    no: l.lesson_no,
    t: l.title,
    kn: { k: l.keyword, i: l.image_emoji, c: l.summary, e: l.example },
    tl: [...l.timeline_events]
      .sort((a, b) => Number(a.year) - Number(b.year))
      .map((t) => [t.year, t.title, t.icon, t.summary]),
    fc: byId(l.flashcards).map((f) => [f.question, f.answer]),
    qz: byId(l.quiz_questions).map((q) => [q.statement, q.is_true ? 1 : 0, q.explanation]),
  }));

  return Response.json(
    {
      L,
      pf: (fg.data ?? []).map((f) => [f.name, f.icon, f.title, f.quote, f.achievement]),
      rg: (rg.data ?? []).map((r) => [r.name, r.icon, r.summary]),
    },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } }
  );
}