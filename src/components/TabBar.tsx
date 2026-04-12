import React from "react";

type Tab = "people" | "import" | "transactions" | "summary" | "saveload";

interface Props {
    activeTab: Tab;
    onTabChange: (tab: Tab) => void;
}

const TABS: { id: Tab; label: string }[] = [
    { id: "people", label: "people" },
    { id: "import", label: "import csv" },
    { id: "transactions", label: "transactions" },
    { id: "summary", label: "summary" },
    { id: "saveload", label: "save / load" },
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
