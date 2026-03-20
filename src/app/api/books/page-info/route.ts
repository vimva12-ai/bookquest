// 이 파일이 하는 일: 커뮤니티 페이지 정보 조회(GET) / 기여(POST)
import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

interface PageEntry {
  pages: number;
  count: number;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const isbn = searchParams.get("isbn");

  if (!isbn) {
    return NextResponse.json({ data: null });
  }

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("community_book_info")
    .select("*")
    .eq("isbn", isbn)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ data: null });
  }

  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const supabase = await getSupabaseServerClient();

  // 인증 확인
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { isbn, title, pages } = body as { isbn: string; title: string; pages: number };

  if (!isbn || !pages || pages < 1 || pages > 9999) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  // 기존 레코드 조회
  const { data: existing } = await supabase
    .from("community_book_info")
    .select("*")
    .eq("isbn", isbn)
    .maybeSingle();

  if (!existing) {
    // 신규 생성
    await supabase.from("community_book_info").insert({
      isbn,
      title,
      total_pages: pages,
      page_entries: [{ pages, count: 1 }],
      contributor_count: 1,
    });
  } else {
    const entries: PageEntry[] = existing.page_entries ?? [];
    const existingEntry = entries.find((e) => e.pages === pages);

    let newEntries: PageEntry[];
    if (existingEntry) {
      // 기존 값의 count +1
      newEntries = entries.map((e) =>
        e.pages === pages ? { ...e, count: e.count + 1 } : e
      );
    } else {
      // 이상치 체크: 현재 total_pages 대비 ±50% 초과 시 추천에서 제외
      const current = existing.total_pages ?? pages;
      const isOutlier = Math.abs(pages - current) / current > 0.5;
      if (isOutlier) {
        newEntries = entries; // 이상치는 추가하지 않음
      } else {
        newEntries = [...entries, { pages, count: 1 }];
      }
    }

    // total_pages = 가장 많이 입력된 값 (다수결)
    const newTotalPages =
      newEntries.length > 0
        ? newEntries.reduce((best, e) => (e.count > best.count ? e : best), newEntries[0]).pages
        : pages;

    await supabase
      .from("community_book_info")
      .update({
        total_pages: newTotalPages,
        page_entries: newEntries,
        contributor_count: (existing.contributor_count ?? 1) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("isbn", isbn);
  }

  return NextResponse.json({ success: true });
}
