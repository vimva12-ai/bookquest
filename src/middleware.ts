// 이 파일이 하는 일: 모든 요청에서 Supabase 세션 쿠키를 갱신하고,
//   로그인 안 된 사용자가 보호 페이지에 접근하면 /login으로 리다이렉트
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// 로그인 없이도 접근 가능한 경로
const PUBLIC_PATHS = ["/login", "/auth/callback"];

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // 요청 쿠키 업데이트
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          // 응답 쿠키 업데이트 (브라우저 → 갱신된 세션 전달)
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // 세션 갱신 (만료 토큰 자동 리프레시)
  const { data: { user } } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  // 로그인 안 됨 + 보호 페이지 → /login 리다이렉트
  if (!user && !isPublic) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 이미 로그인됨 + /login 접근 → / 리다이렉트
  if (user && pathname === "/login") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return response;
}

// 미들웨어 적용 범위 — API 내부 라우트와 정적 파일은 제외
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
