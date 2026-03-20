// 이 파일이 하는 일: 브라우저(클라이언트 컴포넌트)에서 사용하는 Supabase 클라이언트 생성
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
