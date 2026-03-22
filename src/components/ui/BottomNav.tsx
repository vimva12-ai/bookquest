// 이 파일이 하는 일: 하단 탭 바 — 5개 탭 전환 버튼
"use client";

type TabId = "library" | "character" | "shop" | "achievements" | "stats";

interface Tab {
  id: TabId;
  icon: string;
  label: string;
}

const TABS: Tab[] = [
  { id: "character",    icon: "⚔️", label: "캐릭터" },
  { id: "shop",         icon: "🏪", label: "상점" },
  { id: "library",      icon: "📖", label: "서재" },
  { id: "achievements", icon: "🏆", label: "업적" },
  { id: "stats",        icon: "📊", label: "통계" },
];

interface Props {
  activeTab: TabId;
  onChange: (tab: TabId) => void;
}

export function BottomNav({ activeTab, onChange }: Props) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 h-16 flex bg-white dark:bg-[#242B24] border-t border-[#E8E4DD] dark:border-[#333D33] shadow-[0_-2px_8px_rgba(0,0,0,0.04)]">
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${
              isActive
                ? "text-[#3D5A3E] dark:text-[#6BA368]"
                : "text-[#A3AEA3] dark:text-[#556655] hover:text-[#6B7C6B] dark:hover:text-[#8A9A8A]"
            }`}
            aria-label={tab.label}
            aria-current={isActive ? "page" : undefined}
          >
            <span className="text-xl leading-none">{tab.icon}</span>
            <span className={`text-[10px] font-medium ${isActive ? "font-semibold" : ""}`}>
              {tab.label}
            </span>
            {/* 활성 탭 인디케이터 */}
            {isActive && (
              <span className="absolute top-0 w-8 h-0.5 bg-[#3D5A3E] dark:bg-[#6BA368] rounded-full" />
            )}
          </button>
        );
      })}
    </nav>
  );
}

export type { TabId };
