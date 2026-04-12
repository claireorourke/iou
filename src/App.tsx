import React from "react";
import type { AppState, CsvImportSession, PersonId, SplitEntry, Transaction } from "./types.js";
import { newId, validateAppState } from "./utils.js";
import { TabBar } from "./components/TabBar.js";
import { PeopleTab } from "./components/people/PeopleTab.js";
import { ImportTab } from "./components/import/ImportTab.js";
import { TransactionsTab } from "./components/transactions/TransactionsTab.js";
import { SummaryTab } from "./components/summary/SummaryTab.js";
import { SaveLoadTab } from "./components/saveload/SaveLoadTab.js";
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
            </main>
        </div>
    );
}
