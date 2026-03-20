// Next.js 설정 파일 — OpenNext(Cloudflare) 빌드를 위한 최소 설정
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cloudflare Pages 배포 시 standalone 출력 필요
  output: "standalone",
};

export default nextConfig;
