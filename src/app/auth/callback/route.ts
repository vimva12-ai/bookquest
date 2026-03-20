// 이 파일이 하는 일: 구글 OAuth 로그인 후 Supabase가 리다이렉트하는 콜백 처리
// code를 받아 세션 쿠키로 교환하고 메인 페이지로 이동
import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await getSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // 로그인 성공 → 메인 페이지(서재)로 이동
      return NextResponse.redirect(`${origin}/`);
    }
  }

  // 실패 → 로그인 페이지로 돌아가기
  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
