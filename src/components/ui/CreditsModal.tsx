// 이 파일이 하는 일: 에셋 크레딧/라이선스 모달
"use client";

interface Props {
  onClose: () => void;
}

export function CreditsModal({ onClose }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-white dark:bg-[#242B24] rounded-2xl p-5 shadow-xl max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-800 dark:text-gray-100 text-base">📜 크레딧</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors text-lg leading-none"
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400 mb-5 leading-relaxed">
          이 앱에서 사용된 에셋의 저작권은 각 원작자에게 있습니다.
        </p>

        {/* 캐릭터 스프라이트 */}
        <section className="mb-4">
          <h3 className="text-xs font-bold text-[#3D5A3E] dark:text-[#6BA368] uppercase tracking-wide mb-2">
            캐릭터 스프라이트
          </h3>
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 text-xs space-y-1">
            <p className="font-semibold text-gray-700 dark:text-gray-300">
              LPC Medieval Fantasy Character Sprites
            </p>
            <p className="text-gray-500 dark:text-gray-400">
              by wulax (based on work by Redshrike)
            </p>
            <p className="text-gray-500 dark:text-gray-400">
              License: CC-BY-SA 3.0 / CC-BY 3.0
            </p>
            <a
              href="https://opengameart.org/content/lpc-medieval-fantasy-character-sprites"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline break-all"
            >
              opengameart.org
            </a>
          </div>
        </section>

        {/* 장비 아이콘 */}
        <section className="mb-4">
          <h3 className="text-xs font-bold text-[#3D5A3E] dark:text-[#6BA368] uppercase tracking-wide mb-2">
            장비 아이콘
          </h3>
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 text-xs space-y-1">
            <p className="font-semibold text-gray-700 dark:text-gray-300">
              Free Pixel Art Weapon Icons
            </p>
            <p className="text-gray-500 dark:text-gray-400">by MedievalMore</p>
            <p className="text-gray-500 dark:text-gray-400">
              License: 상업/비상업 사용 가능 (수정/리컬러 허용)
            </p>
            <a
              href="https://medievalmore.itch.io/free-weapon-icons"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              medievalmore.itch.io
            </a>
          </div>
        </section>

        {/* 도서 데이터 */}
        <section className="mb-4">
          <h3 className="text-xs font-bold text-[#3D5A3E] dark:text-[#6BA368] uppercase tracking-wide mb-2">
            도서 데이터
          </h3>
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 text-xs space-y-1">
            <p className="font-semibold text-gray-700 dark:text-gray-300">
              Kakao Developers — Daum 책 검색 API
            </p>
            <a
              href="https://developers.kakao.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              developers.kakao.com
            </a>
          </div>
        </section>

        {/* CC-BY-SA 안내 */}
        <p className="text-[11px] text-gray-400 dark:text-gray-600 text-center leading-relaxed">
          CC-BY-SA 3.0 라이선스 에셋은 수정 시 동일 라이선스 적용 필요
        </p>
      </div>
    </div>
  );
}
