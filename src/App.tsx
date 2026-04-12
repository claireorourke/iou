import React from "react";
import type { AppState, CsvImportSession, PersonId, SplitEntry, Transaction } from "./types.js";
import { newId, validateAppState } from "./utils.js";
import { TabBar } from "./components/TabBar.js";
import { PeopleTab } from "./components/people/PeopleTab.js";
import { ImportTab } from "./components/import/ImportTab.js";
import { TransactionsTab } from "./components/transactions/TransactionsTab.js";
import { SummaryTab } from "./components/summary/SummaryTab.js";
import { SaveLoadTab } from "./components/saveload/SaveLoadTab.js";
import { ScrollToTop } from "./components/ScrollToTop.js";
import { quotes } from "./quotes.js";
import "./styles/global.css";

type Tab = "people" | "import" | "transactions" | "summary" | "saveload";

const EMPTY_STATE: AppState = { people: [], transactions: [] };
const STORAGE_KEY = "iou-state";

function loadPersistedState(): AppState {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return EMPTY_STATE;
        return validateAppState(JSON.parse(raw) as unknown);
    } catch {
        return EMPTY_STATE;
    }
}

export function App(): React.JSX.Element {
    const [state, setState] = React.useState<AppState>(loadPersistedState);
    const quote = React.useMemo(() => {
        const stored = localStorage.getItem("iou-quote-index");
        const next = stored === null
            ? Math.floor(Math.random() * quotes.length)
            : (parseInt(stored, 10) + 1) % quotes.length;
        localStorage.setItem("iou-quote-index", String(next));
        return quotes[next]!;
    }, []);

    React.useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }, [state]);
    const [activeTab, setActiveTab] = React.useState<Tab>("people");
    const [csvSession, setCsvSession] = React.useState<CsvImportSession | null>(null);

    function addPerson(name: string): void {
        setState((prev) => ({
            ...prev,
            people: [...prev.people, { id: newId(), name: name.trim() }],
        }));
    }

    function removePerson(id: string): void {
        setState((prev) => ({
            people: prev.people.filter((p) => p.id !== id),
            transactions: prev.transactions.map((tx) => ({
                ...tx,
                splits: tx.splits.filter((s) => s.personId !== id),
            })),
        }));
    }

    function addTransaction(tx: Transaction): void {
        setState((prev) => ({
            ...prev,
            transactions: [...prev.transactions, tx],
        }));
    }

    function commitImport(transactions: Transaction[]): void {
        setState((prev) => ({
            ...prev,
            transactions: [...prev.transactions, ...transactions],
        }));
        setCsvSession(null);
        setActiveTab("transactions");
    }

    function updateTransaction(id: string, splits: SplitEntry[], paidBy: PersonId | null): void {
        setState((prev) => ({
            ...prev,
            transactions: prev.transactions.map((tx) =>
                tx.id === id ? { ...tx, splits, paidBy } : tx
            ),
        }));
    }

    function deleteTransaction(id: string): void {
        setState((prev) => ({
            ...prev,
            transactions: prev.transactions.filter((tx) => tx.id !== id),
        }));
    }

    function confirmTransaction(id: string): void {
        setState((prev) => ({
            ...prev,
            transactions: prev.transactions.map((tx) =>
                tx.id === id ? { ...tx, status: "confirmed" as const } : tx
            ),
        }));
    }

    function deleteTransactions(ids: ReadonlySet<string>): void {
        setState((prev) => ({
            ...prev,
            transactions: prev.transactions.filter((tx) => !ids.has(tx.id)),
        }));
    }

    function importState(newState: AppState): void {
        setState(newState);
    }

    return (
        <div className="app">
            <header className="app-header">
                <h1>iou</h1>
            </header>
            <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
            <main className="app-content">
                {activeTab === "people" && (
                    <PeopleTab
                        people={state.people}
                        onAdd={addPerson}
                        onRemove={removePerson}
                    />
                )}
                {activeTab === "import" && (
                    <ImportTab
                        people={state.people}
                        csvSession={csvSession}
                        onSessionChange={setCsvSession}
                        onCommit={commitImport}
                        onAddTransaction={addTransaction}
                    />
                )}
                {activeTab === "transactions" && (
                    <TransactionsTab
                        transactions={state.transactions}
                        people={state.people}
                        onUpdate={updateTransaction}
                        onDelete={deleteTransaction}
                        onConfirm={confirmTransaction}
                        onDeleteMany={deleteTransactions}
                    />
                )}
                {activeTab === "summary" && <SummaryTab state={state} />}
                {activeTab === "saveload" && (
                    <SaveLoadTab state={state} onLoad={importState} />
                )}
                {activeTab === "people" && (
                    <div className="tab-next-row">
                        <button className="btn btn-primary" onClick={() => setActiveTab("import")}>
                            next: import →
                        </button>
                    </div>
                )}
                {activeTab === "import" && csvSession === null && (
                    <div className="tab-next-row">
                        <button className="btn btn-primary" onClick={() => setActiveTab("transactions")}>
                            next: transactions →
                        </button>
                    </div>
                )}
                {activeTab === "transactions" && (
                    <div className="tab-next-row">
                        <button className="btn btn-primary" onClick={() => setActiveTab("summary")}>
                            next: summary →
                        </button>
                    </div>
                )}
                {activeTab === "summary" && (
                    <div className="tab-next-row">
                        <button className="btn btn-primary" onClick={() => setActiveTab("saveload")}>
                            next: save / load →
                        </button>
                    </div>
                )}
            </main>
            <ScrollToTop />
            <footer className="app-footer">
                <a className="app-footer-quote" href={quote.url} target="_blank" rel="noopener noreferrer">
                    <span>"{quote.quote}"</span>
                    <span className="app-footer-quote__attr">— {quote.character}, <em>{quote.source}</em></span>
                </a>
                <a
                    className="github-link"
                    href="https://github.com/claireorourke/iou"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="view source on github"
                    title="view source on github"
                >
                    <img src="github-mark-white.svg" alt="" width="16" height="16" />
                </a>
            </footer>
        </div>
    );
}
