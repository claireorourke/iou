import React from "react";
import type { AppState } from "../../types.js";
import { computeBalances, computeSettlements } from "../../utils.js";
import { BalanceBarChart } from "./BalanceBarChart.js";

interface Props {
    state: AppState;
}

export function SummaryTab({ state }: Props): React.JSX.Element {
    if (state.people.length === 0) {
        return (
            <div className="card">
                <div className="empty-state">
                    <p>add people and transactions to see a summary.</p>
                </div>
            </div>
        );
    }

    const confirmedState: AppState = {
        ...state,
        transactions: state.transactions.filter(
            (tx) => tx.status === "confirmed",
        ),
    };

    const balances = computeBalances(confirmedState);
    const settlements = computeSettlements(balances);

    const nameById = new Map(state.people.map((p) => [p.id, p.name]));

    // Per-person paid and share totals
    const totalPaid = new Map<string, number>(
        state.people.map((p) => [p.id, 0]),
    );
    const totalShare = new Map<string, number>(
        state.people.map((p) => [p.id, 0]),
    );
    for (const tx of confirmedState.transactions) {
        if (tx.paidBy !== null) {
            totalPaid.set(
                tx.paidBy,
                (totalPaid.get(tx.paidBy) ?? 0) + tx.amount,
            );
        }
        for (const split of tx.splits) {
            const share =
                split.mode === "percent"
                    ? (split.value / 100) * tx.amount
                    : split.value;
            totalShare.set(
                split.personId,
                (totalShare.get(split.personId) ?? 0) + share,
            );
        }
    }

    const rows = state.people
        .map((p) => ({
            person: p,
            balance: balances.get(p.id) ?? 0,
            paid: totalPaid.get(p.id) ?? 0,
            share: totalShare.get(p.id) ?? 0,
        }))
        .sort((a, b) => b.balance - a.balance);

    const chartRows = rows.map((r) => ({
        personId: r.person.id,
        name: r.person.name,
        balance: r.balance,
    }));

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Settlements */}
            <div className="card">
                <h2 className="section-title">to settle up</h2>
                {settlements.length === 0 ? (
                    <p
                        style={{
                            color: "var(--color-success)",
                            fontWeight: 800,
                            fontSize: 15,
                        }}
                    >
                        all settled up!
                    </p>
                ) : (
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 10,
                        }}
                    >
                        {settlements.map((s, i) => (
                            <div
                                key={i}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 12,
                                    padding: "10px 14px",
                                    background: "var(--color-bg)",
                                    border: "2px solid #000",
                                    boxShadow: "3px 3px 0 #000",
                                }}
                            >
                                <span style={{ fontWeight: 800, fontSize: 15 }}>
                                    {nameById.get(s.fromId) ?? s.fromId}
                                </span>
                                <span
                                    style={{
                                        color: "var(--color-text-muted)",
                                        fontSize: 13,
                                    }}
                                >
                                    owes
                                </span>
                                <span style={{ fontWeight: 800, fontSize: 15 }}>
                                    {nameById.get(s.toId) ?? s.toId}
                                </span>
                                <span
                                    style={{
                                        marginLeft: "auto",
                                        fontWeight: 900,
                                        fontSize: 17,
                                        color: "var(--color-danger)",
                                        flexShrink: 0,
                                    }}
                                >
                                    ${s.amount.toFixed(2)}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
                <p
                    style={{
                        marginTop: 12,
                        color: "var(--color-text-muted)",
                        fontSize: "0.8em",
                    }}
                >
                    based on confirmed transactions only
                </p>
            </div>

            {/* Balance chart + table */}
            <div className="card">
                <h2 className="section-title">net balances</h2>
                <div className="summary-layout">
                    <div style={{ flex: "1 1 300px", minWidth: 0 }}>
                        <BalanceBarChart rows={chartRows} />
                    </div>
                    <table
                        className="data-table"
                        style={{
                            flex: "1 1 240px",
                            minWidth: 220,
                            alignSelf: "flex-start",
                        }}
                    >
                        <thead>
                            <tr>
                                <th>person</th>
                                <th style={{ textAlign: "right" }}>paid</th>
                                <th style={{ textAlign: "right" }}>share</th>
                                <th style={{ textAlign: "right" }}>net</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map(({ person, balance, paid, share }) => {
                                const isPos = balance > 0.005;
                                const isNeg = balance < -0.005;
                                return (
                                    <tr key={person.id}>
                                        <td style={{ fontWeight: 700 }}>
                                            {person.name}
                                        </td>
                                        <td style={{ textAlign: "right" }}>
                                            ${paid.toFixed(2)}
                                        </td>
                                        <td style={{ textAlign: "right" }}>
                                            ${share.toFixed(2)}
                                        </td>
                                        <td style={{ textAlign: "right" }}>
                                            <span
                                                style={{
                                                    fontWeight: 800,
                                                    color: isPos
                                                        ? "var(--color-success)"
                                                        : isNeg
                                                          ? "var(--color-danger)"
                                                          : undefined,
                                                }}
                                            >
                                                {isPos ? "+" : ""}
                                                {balance.toFixed(2)}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
