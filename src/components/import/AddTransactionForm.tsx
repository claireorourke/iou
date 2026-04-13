import React from "react";
import type { Person, Transaction } from "../../types.js";
import { equalSplits, newId } from "../../utils.js";

interface Props {
    people: Person[];
    onAdd: (tx: Transaction) => void;
}

function todayISO(): string {
    return new Date().toISOString().slice(0, 10);
}

export function AddTransactionForm({
    people,
    onAdd,
}: Props): React.JSX.Element {
    const [name, setName] = React.useState("");
    const [amount, setAmount] = React.useState("");
    const [date, setDate] = React.useState(todayISO);
    const [paidBy, setPaidBy] = React.useState<string>("");

    const parsedAmount = parseFloat(amount);
    const isValid =
        name.trim() !== "" &&
        !isNaN(parsedAmount) &&
        parsedAmount > 0 &&
        paidBy !== "";

    function handleSubmit(): void {
        if (!isValid) return;
        const tx: Transaction = {
            id: newId(),
            name: name.trim(),
            amount: parsedAmount,
            datetime: new Date(date).toISOString(),
            paidBy: paidBy === "" ? null : paidBy,
            splits: equalSplits(people),
            status: "pending",
        };
        onAdd(tx);
        setName("");
        setAmount("");
        setDate(todayISO());
        setPaidBy("");
    }

    function handleKeyDown(e: React.KeyboardEvent): void {
        if (e.key === "Enter") handleSubmit();
    }

    return (
        <div className="card">
            <h2 className="section-title">add transaction</h2>
            <div className="add-tx-form">
                <div className="add-tx-form__paidby">
                    <span className="payer-label">paid by</span>
                    <div
                        className="payer-pills"
                        role="group"
                        aria-label="paid by"
                    >
                        {people.map((p) => (
                            <button
                                key={p.id}
                                className={`payer-pill${paidBy === p.id ? " payer-pill--active" : ""}`}
                                onClick={() => setPaidBy(p.id)}
                            >
                                {p.name}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="add-tx-form__name">
                    <input
                        type="text"
                        placeholder="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                </div>
                <div className="add-tx-form__amount">
                    <input
                        type="number"
                        placeholder="amount"
                        min={0}
                        step={0.01}
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                </div>
                <div className="add-tx-form__date">
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                </div>
                <div className="add-tx-form__actions">
                    <button
                        className="btn btn-primary"
                        onClick={handleSubmit}
                        disabled={!isValid}
                    >
                        add
                    </button>
                </div>
            </div>
        </div>
    );
}
