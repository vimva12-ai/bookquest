// 이 파일이 하는 일: 브라우저(클라이언트 컴포넌트)에서 사용하는 Supabase 클라이언트 생성
// ⚠️ CRITICAL: 컴포넌트 body에서 직접 호출 금지 — SSR 시 env var 없이 실행되어 빌드 오류 발생
// 반드시 이벤트 핸들러나 useEffect 안에서만 호출할 것
import { createBrowserClient } from "@supabase/ssr";

// 싱글턴 패턴 — 컴포넌트마다 새 클라이언트 생성 방지
let client: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseBrowserClient() {
  if (client) return client;

  client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  return client;
}
