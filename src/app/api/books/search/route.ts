// 이 파일이 하는 일: 카카오 책 검색 API 프록시 (API 키를 서버에서만 사용)
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");
  const size = searchParams.get("size") ?? "10";

  if (!q || q.trim().length < 1) {
    return NextResponse.json({ documents: [] });
  }

  const apiKey = process.env.KAKAO_REST_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  try {
    const url = `https://dapi.kakao.com/v3/search/book?query=${encodeURIComponent(q)}&size=${size}&target=title`;
    const res = await fetch(url, {
      headers: { Authorization: `KakaoAK ${apiKey}` },
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Kakao API error" }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Network error" }, { status: 500 });
  }
}
