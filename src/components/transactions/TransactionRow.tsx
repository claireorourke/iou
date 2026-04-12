import React from "react";
import type { Person, PersonId, SplitEntry, Transaction } from "../../types.js";
import { SplitEditor } from "./SplitEditor.js";

interface Props {
    transaction: Transaction;
    people: Person[];
    variant: "featured" | "compact";
    onUpdate: (id: string, splits: SplitEntry[], paidBy: PersonId | null) => void;
    onConfirm?: (id: string) => void;
    onDelete: (id: string) => void;
    selected?: boolean;
    onSelectToggle?: (id: string) => void;
}

function formatDate(dt: string): string {
    if (dt === "") return "";
    const d = new Date(dt);
    if (isNaN(d.getTime())) return dt;
    return d.toLocaleDateString();
}

function splitSummary(tx: Transaction, people: Person[]): string {
    const payer = tx.paidBy !== null ? people.find((p) => p.id === tx.paidBy) : undefined;
    const payerStr = payer !== undefined ? `Paid by ${payer.name}` : "Payer unset";
    if (tx.splits.length === 0) return payerStr;
    const mode = tx.splits[0]?.mode ?? "percent";
    const parts = tx.splits
        .map((s) => {
            const person = people.find((p) => p.id === s.personId);
            const name = person?.name ?? "Unknown";
            if (mode === "percent") {
                return `${name} ${s.value.toFixed(0)}%`;
            }
            return `${name} $${s.value.toFixed(2)}`;
        })
        .join(" · ");
    return `${payerStr} · ${parts}`;
}

export function TransactionRow({
    transaction,
    people,
    variant,
    onUpdate,
    onConfirm,
    onDelete,
    selected,
    onSelectToggle,
}: Props): React.JSX.Element {
    const [editing, setEditing] = React.useState(variant === "featured");
    const dateStr = formatDate(transaction.datetime);

    if (variant === "featured") {
        return (
            <div className="tx-card tx-card--featured">
                <div className="tx-header">
                    <div className="tx-header__info">
                        <div className="tx-header__name">{transaction.name || "(unnamed)"}</div>
                        {dateStr !== "" && (
                            <div className="tx-header__meta">{dateStr}</div>
                        )}
                    </div>
                    <div className="tx-header__amount">${transaction.amount.toFixed(2)}</div>
                    <div className="tx-header__actions">
                        {onConfirm !== undefined && (
                            <button
                                className="btn btn-primary"
                                onClick={() => onConfirm(transaction.id)}
                            >
                                Confirm
                            </button>
                        )}
                        <button
                            className="btn btn-secondary"
                            onClick={() => setEditing((v) => !v)}
                        >
                            {editing ? "Close" : "Edit splits"}
                        </button>
                        <button
                            className="btn btn-ghost"
                            onClick={() => onDelete(transaction.id)}
                            title="Delete transaction"
                        >
                            ✕
                        </button>
                    </div>
                </div>
                {!editing && (
                    <div className="tx-split-summary">
                        {splitSummary(transaction, people)}
                    </div>
                )}
                {editing && (
                    <SplitEditor
                        transaction={transaction}
                        people={people}
                        onSave={(splits, paidBy) => {
                            onUpdate(transaction.id, splits, paidBy);
                            setEditing(false);
                        }}
                        onCancel={() => setEditing(false)}
                    />
                )}
            </div>
        );
    }

    // compact variant
    return (
        <div className="tx-card">
            <div className="tx-row">
                {onSelectToggle !== undefined && (
                    <input
                        type="checkbox"
                        checked={selected ?? false}
                        onChange={() => onSelectToggle(transaction.id)}
                        aria-label={`Select ${transaction.name || "transaction"}`}
                    />
                )}
                <span className="tx-row__name">{transaction.name || "(unnamed)"}</span>
                {dateStr !== "" && <span className="tx-row__date">{dateStr}</span>}
                <span className="tx-row__amount">${transaction.amount.toFixed(2)}</span>
                {!editing && (
                    <span className="tx-row__splits">{splitSummary(transaction, people)}</span>
                )}
                <div className="tx-row__actions">
                    {transaction.status === "pending" && onConfirm !== undefined && (
                        <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => onConfirm(transaction.id)}
                        >
                            Confirm
                        </button>
                    )}
                    <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => setEditing((v) => !v)}
                        title="Edit splits"
                    >
                        ✎
                    </button>
                    <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => onDelete(transaction.id)}
                        title="Delete transaction"
                    >
                        ✕
                    </button>
                </div>
            </div>
            {editing && (
                <SplitEditor
                    transaction={transaction}
                    people={people}
                    onSave={(splits, paidBy) => {
                        onUpdate(transaction.id, splits, paidBy);
                        setEditing(false);
                    }}
                    onCancel={() => setEditing(false)}
                />
            )}
        </div>
    );
}
