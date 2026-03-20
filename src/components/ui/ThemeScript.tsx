// 이 파일이 하는 일: 다크모드 깜빡임 방지 — <head>에 인라인 스크립트로 주입
// localStorage의 'bq-theme' 값을 읽어 <html>에 .dark 클래스를 즉시 부여
export function ThemeScript() {
  const script = `
    (function() {
      try {
        var t = localStorage.getItem('bq-theme');
        if (t === 'dark') document.documentElement.classList.add('dark');
      } catch(e) {}
    })();
  `;
  // dangerouslySetInnerHTML — 의도적인 인라인 스크립트 (FOUC 방지 외 다른 용도 없음)
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
