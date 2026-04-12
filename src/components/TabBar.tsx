import React from "react";

type Tab = "people" | "import" | "transactions" | "summary" | "saveload";

interface Props {
    activeTab: Tab;
    onTabChange: (tab: Tab) => void;
}

const TABS: { id: Tab; label: string }[] = [
    { id: "people", label: "People" },
    { id: "import", label: "Import CSV" },
    { id: "transactions", label: "Transactions" },
    { id: "summary", label: "Summary" },
    { id: "saveload", label: "Save / Load" },
];

export function TabBar({ activeTab, onTabChange }: Props): React.JSX.Element {
    return (
        <nav className="tab-bar">
            {TABS.map((tab) => (
                <button
                    key={tab.id}
                    className={activeTab === tab.id ? "active" : ""}
                    onClick={() => onTabChange(tab.id)}
                >
                    {tab.label}
                </button>
            ))}
        </nav>
    );
}
