import React from "react";
import type { Person, PersonId, SplitEntry, Transaction } from "../../types.js";
import { TransactionRow } from "./TransactionRow.js";

interface Props {
    transactions: Transaction[];
    people: Person[];
    onUpdate: (id: string, splits: SplitEntry[], paidBy: PersonId | null) => void;
    onDelete: (id: string) => void;
    onConfirm: (id: string) => void;
    onDeleteMany: (ids: ReadonlySet<string>) => void;
}

interface MonthGroup {
    key: string;
    label: string;
    items: Transaction[];
}

function monthKey(datetime: string): string {
    if (datetime === "") return "undated";
    const d = new Date(datetime);
    if (isNaN(d.getTime())) return "undated";
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonthKey(key: string): string {
    if (key === "undated") return "Undated";
    const [year, month] = key.split("-");
    return new Date(Number(year), Number(month) - 1).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
    });
}

function groupByMonth(txs: Transaction[]): MonthGroup[] {
    const buckets = new Map<string, Transaction[]>();
    for (const tx of txs) {
        const key = monthKey(tx.datetime);
        if (!buckets.has(key)) buckets.set(key, []);
        buckets.get(key)!.push(tx);
    }
    return [...buckets.keys()]
        .sort((a, b) => {
            if (a === "undated") return 1;
            if (b === "undated") return -1;
            return a.localeCompare(b);
        })
        .map((key) => ({ key, label: formatMonthKey(key), items: buckets.get(key)! }));
}

export function TransactionsTab({
    transactions,
    people,
    onUpdate,
    onDelete,
    onConfirm,
    onDeleteMany,
}: Props): React.JSX.Element {
    const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());

    React.useEffect(() => {
        const txIds = new Set(transactions.map((tx) => tx.id));
        setSelectedIds((prev) => {
            const next = new Set([...prev].filter((id) => txIds.has(id)));
            return next.size === prev.size ? prev : next;
        });
    }, [transactions]);

    const pending = transactions.filter((tx) => tx.status === "pending");
    const confirmed = transactions.filter((tx) => tx.status === "confirmed");
    const featuredTx = pending[0] ?? null;
    const remainingPending = pending.slice(1);

    const pendingGroups = groupByMonth(remainingPending);
    const confirmedGroups = groupByMonth(confirmed);

    function toggleSelect(id: string): void {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    }

    function toggleSelectAll(group: Transaction[]): void {
        const allSelected = group.length > 0 && group.every((tx) => selectedIds.has(tx.id));
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (allSelected) {
                group.forEach((tx) => next.delete(tx.id));
            } else {
                group.forEach((tx) => next.add(tx.id));
            }
            return next;
        });
    }

    function handleDeleteSelected(): void {
        onDeleteMany(selectedIds);
        setSelectedIds(new Set());
    }

    if (transactions.length === 0) {
        return (
            <div className="card">
                <div className="empty-state">
                    <p>no transactions yet. import a CSV to get started.</p>
                </div>
            </div>
        );
    }

    const pendingAllSelected =
        remainingPending.length > 0 && remainingPending.every((tx) => selectedIds.has(tx.id));
    const confirmedAllSelected =
        confirmed.length > 0 && confirmed.every((tx) => selectedIds.has(tx.id));

    function renderRows(txs: Transaction[]): React.JSX.Element {
        return (
            <div className="tx-list">
                {txs.map((tx) => (
                    <TransactionRow
                        key={tx.id}
                        transaction={tx}
                        people={people}
                        variant="compact"
                        onUpdate={onUpdate}
                        onConfirm={onConfirm}
                        onDelete={onDelete}
                        selected={selectedIds.has(tx.id)}
                        onSelectToggle={toggleSelect}
                    />
                ))}
            </div>
        );
    }

    function renderGrouped(groups: MonthGroup[]): React.JSX.Element {
        return (
            <div className="tx-month-groups">
                {groups.map((group) => (
                    <div key={group.key} className="tx-month-group">
                        <div className="tx-month-header">{group.label}</div>
                        {renderRows(group.items)}
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div>
            {selectedIds.size > 0 && (
                <div className="tx-bulk-bar">
                    <span>{selectedIds.size} selected</span>
                    <button className="btn btn-danger btn-sm" onClick={handleDeleteSelected}>
                        delete selected ({selectedIds.size})
                    </button>
                    <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => setSelectedIds(new Set())}
                    >
                        clear selection
                    </button>
                </div>
            )}

            <div className="tx-sections">
                {/* Next Pending */}
                <div className="tx-section">
                    <div className="tx-section-header">
                        <span className="tx-section-title">next pending</span>
                    </div>
                    {featuredTx !== null ? (
                        <TransactionRow
                            key={featuredTx.id}
                            transaction={featuredTx}
                            people={people}
                            variant="featured"
                            onUpdate={onUpdate}
                            onConfirm={onConfirm}
                            onDelete={onDelete}
                        />
                    ) : (
                        <div className="card">
                            <div className="empty-state">
                                <p>no pending transactions — you're all caught up.</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Remaining Pending */}
                {remainingPending.length > 0 && (
                    <div className="tx-section">
                        <div className="tx-section-header">
                            <label className="tx-section-select-all">
                                <input
                                    type="checkbox"
                                    checked={pendingAllSelected}
                                    onChange={() => toggleSelectAll(remainingPending)}
                                />
                                <span className="tx-section-title">
                                    pending ({remainingPending.length})
                                </span>
                            </label>
                        </div>
                        {renderGrouped(pendingGroups)}
                    </div>
                )}

                {/* Confirmed */}
                <div className="tx-section">
                    <div className="tx-section-header">
                        <label className="tx-section-select-all">
                            <input
                                type="checkbox"
                                checked={confirmedAllSelected}
                                onChange={() => toggleSelectAll(confirmed)}
                            />
                            <span className="tx-section-title">
                                confirmed ({confirmed.length})
                            </span>
                        </label>
                    </div>
                    {confirmed.length === 0 ? (
                        <p className="info-msg">no confirmed transactions yet.</p>
                    ) : (
                        renderGrouped(confirmedGroups)
                    )}
                </div>
            </div>
        </div>
    );
}
