import { supabase } from "@/lib/supabase";

type Out = Record<"h" | "g", Record<number, unknown>>;

export async function GET() {
  const { data, error } = await supabase
    .from("lessons")
    .select(
      "id, subject, grade, keyword, image_emoji, summary, example, timeline_events(id, year, title, icon, summary), flashcards(id, question, answer), quiz_questions(id, statement, is_true, explanation)"
    )
    .order("id");

  if (error || !data) {
    return Response.json({ ok: false, error: error?.message }, { status: 500 });
  }

  const byId = <T extends { id: number }>(a: T[]) =>
    [...a].sort((x, y) => x.id - y.id);

  const out: Out = { h: {}, g: {} };
  for (const l of data) {
    out[l.subject === "history" ? "h" : "g"][l.grade] = {
      kn: { k: l.keyword, i: l.image_emoji, c: l.summary, e: l.example },
      tl: [...l.timeline_events]
        .sort((a, b) => Number(a.year) - Number(b.year))
        .map((t) => [t.year, t.title, t.icon, t.summary]),
      fc: byId(l.flashcards).map((f) => [f.question, f.answer]),
      qz: byId(l.quiz_questions).map((q) => [q.statement, q.is_true ? 1 : 0, q.explanation]),
    };
  }

  return Response.json(out, {
    headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
  });
}
