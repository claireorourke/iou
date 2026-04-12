import React from "react";
import type { AppState } from "../../types.js";
import { computeBalances } from "../../utils.js";
import { SpendingPieChart } from "./SpendingPieChart.js";
import type { PieSlice } from "./SpendingPieChart.js";

interface Props {
    state: AppState;
}

const PIE_COLORS = [
    "#2563eb",
    "#16a34a",
    "#dc2626",
    "#d97706",
    "#7c3aed",
    "#0891b2",
    "#be185d",
    "#65a30d",
    "#c2410c",
    "#1d4ed8",
];

export function SummaryTab({ state }: Props): React.JSX.Element {
    if (state.people.length === 0) {
        return (
            <div className="card">
                <div className="empty-state">
                    <p>Add people and transactions to see a summary.</p>
                </div>
            </div>
        );
    }

    const confirmedState: AppState = {
        ...state,
        transactions: state.transactions.filter((tx) => tx.status === "confirmed"),
    };

    const balances = computeBalances(confirmedState);
    const rows = state.people
        .map((p) => ({ person: p, balance: balances.get(p.id) ?? 0 }))
        .sort((a, b) => b.balance - a.balance);

    const slices: PieSlice[] = rows
        .filter((r) => r.balance > 0)
        .map((r, i) => ({
            personId: r.person.id,
            name: r.person.name,
            amount: r.balance,
            color: PIE_COLORS[i % PIE_COLORS.length]!,
        }));

    return (
        <div className="card">
            <h2 className="section-title">Balance Summary (Confirmed)</h2>
            <div className="summary-layout">
                <SpendingPieChart slices={slices} />
                <table className="data-table" style={{ flex: 1, minWidth: 240 }}>
                    <thead>
                        <tr>
                            <th>Person</th>
                            <th style={{ textAlign: "right" }}>Net Balance</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map(({ person, balance }) => (
                            <tr key={person.id}>
                                <td>{person.name}</td>
                                <td style={{ textAlign: "right" }}>
                                    <span
                                        className="balance-amount"
                                        style={{
                                            color:
                                                balance > 0.005
                                                    ? "var(--color-success)"
                                                    : balance < -0.005
                                                      ? "var(--color-danger)"
                                                      : undefined,
                                        }}
                                    >
                                        {balance >= 0 ? "+" : ""}
                                        {balance.toFixed(2)}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <p style={{ marginTop: 12, color: "var(--color-text-muted)", fontSize: "0.85em" }}>
                Positive = owed to you · Negative = you owe
            </p>
        </div>
    );
}
