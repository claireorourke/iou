import React from "react";
import type { Person, Transaction } from "../../types.js";

interface Props {
    transactions: Transaction[];
    people: Person[];
    onConfirm: () => void;
    onBack: () => void;
}

function formatDate(dt: string): string {
    if (dt === "") return "—";
    const d = new Date(dt);
    if (isNaN(d.getTime())) return dt;
    return d.toLocaleDateString();
}

export function ImportPreview({ transactions, people, onConfirm, onBack }: Props): React.JSX.Element {
    const valid = transactions.filter((tx) => !isNaN(tx.amount));
    const invalid = transactions.filter((tx) => isNaN(tx.amount));
    const hasPayer = transactions.some((tx) => tx.paidBy !== null);

    return (
        <div className="import-section">
            <h3 className="section-title">Preview</h3>

            {invalid.length > 0 && (
                <p className="error-msg" style={{ marginBottom: 12 }}>
                    {invalid.length} row{invalid.length !== 1 ? "s" : ""} have unparseable amounts
                    and will be skipped.
                </p>
            )}

            <div className="card" style={{ padding: 0 }}>
                <div className="preview-table-wrap">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Date</th>
                                <th>Amount</th>
                                {hasPayer && <th>Paid by</th>}
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.map((tx) => {
                                const bad = isNaN(tx.amount);
                                const payer = tx.paidBy !== null
                                    ? people.find((p) => p.id === tx.paidBy)
                                    : undefined;
                                return (
                                    <tr key={tx.id} className={bad ? "preview-row--invalid" : ""}>
                                        <td>{tx.name || "—"}</td>
                                        <td>{formatDate(tx.datetime)}</td>
                                        <td>{bad ? "—" : `$${tx.amount.toFixed(2)}`}</td>
                                        {hasPayer && (
                                            <td>{payer?.name ?? <span style={{ color: "var(--color-text-muted)" }}>—</span>}</td>
                                        )}
                                        <td>
                                            {bad ? (
                                                "Invalid amount"
                                            ) : tx.status === "confirmed" ? (
                                                <span style={{ color: "var(--color-success)", fontWeight: 600 }}>confirmed</span>
                                            ) : (
                                                <span style={{ color: "var(--color-text-muted)" }}>pending</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="import-actions">
                <button className="btn btn-secondary" onClick={onBack}>
                    ← Back
                </button>
                <button
                    className="btn btn-primary"
                    onClick={onConfirm}
                    disabled={valid.length === 0}
                >
                    Import {valid.length} transaction{valid.length !== 1 ? "s" : ""}
                </button>
                {valid.length === 0 && (
                    <span className="error-msg">No valid rows to import.</span>
                )}
            </div>
        </div>
    );
}
