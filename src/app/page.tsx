// 이 파일이 하는 일: 메인 페이지 — 서버에서 사용자 데이터 로드 후 앱 셸로 전달
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/AppShell";
import type { Book, CharacterData } from "@/types/database";

export default async function HomePage() {
  const supabase = await getSupabaseServerClient();

  // 로그인 확인
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // ── 사용자 프로필 조회 (없으면 신규 생성) ──
  let { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    const { data: newProfile } = await supabase
      .from("users")
      .insert({
        id: user.id,
        nickname: user.user_metadata?.full_name || user.email?.split("@")[0] || "모험가",
        level: 1,
        exp: 0,
        gold: 0,
        selected_title_id: "apprentice",
        streak: 0,
        last_read_date: null,
      })
      .select()
      .single();
    profile = newProfile;
  }

  // ── 스탯 조회 (없으면 생성) ──
  let { data: stats } = await supabase
    .from("user_stats")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!stats) {
    const { data: newStats } = await supabase
      .from("user_stats")
      .insert({ user_id: user.id, wisdom: 0, empathy: 0, insight: 0, creation: 0 })
      .select()
      .single();
    stats = newStats;
  }

  // ── 장비 조회 (없으면 생성) ──
  let { data: equipment } = await supabase
    .from("user_equipment")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!equipment) {
    const { data: newEquip } = await supabase
      .from("user_equipment")
      .insert({
        user_id: user.id,
        helmet: null, armor: null, cloak: null,
        weapon: null, shield: null, boots: null,
      })
      .select()
      .single();
    equipment = newEquip;
  }

  // ── 해금 칭호 조회 ──
  const { data: titles } = await supabase
    .from("user_titles")
    .select("*")
    .eq("user_id", user.id);

  // ── 책 목록 조회 ──
  const { data: books } = await supabase
    .from("books")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const characterData: CharacterData = {
    profile: profile!,
    stats: stats!,
    equipment: equipment!,
    titles: titles || [],
  };

  return (
    <AppShell
      initialCharacter={characterData}
      initialBooks={(books as Book[]) || []}
      userId={user.id}
    />
  );
}
