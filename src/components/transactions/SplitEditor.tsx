import React from "react";
import type {
    Person,
    PersonId,
    SplitEntry,
    SplitMode,
    Transaction,
} from "../../types.js";
import { equalAmountSplits, equalSplits, validateSplits } from "../../utils.js";

interface Props {
    transaction: Transaction;
    people: Person[];
    onSave: (splits: SplitEntry[], paidBy: PersonId | null) => void;
    onCancel?: () => void;
}

function initDraft(transaction: Transaction, people: Person[]): SplitEntry[] {
    if (transaction.splits.length > 0) {
        const mode = transaction.splits[0]?.mode ?? "percent";
        return people.map((p) => {
            const existing = transaction.splits.find(
                (s) => s.personId === p.id,
            );
            return existing ?? { personId: p.id, mode, value: 0 };
        });
    }
    return equalSplits(people);
}

export function SplitEditor({
    transaction,
    people,
    onSave,
    onCancel,
}: Props): React.JSX.Element {
    const [draft, setDraft] = React.useState<SplitEntry[]>(() =>
        initDraft(transaction, people),
    );
    const [paidBy, setPaidBy] = React.useState<PersonId | null>(
        transaction.paidBy ?? null,
    );

    const mode: SplitMode = draft[0]?.mode ?? "percent";
    const error = validateSplits(draft, transaction.amount);

    const assignedTotal = draft.reduce((acc, s) => acc + s.value, 0);
    const remaining =
        mode === "percent"
            ? 100 - assignedTotal
            : transaction.amount - assignedTotal;
    const remainingOk =
        mode === "percent"
            ? Math.abs(remaining) <= 0.01
            : Math.abs(remaining) <= 0.01;

    function handleValueChange(personId: string, raw: string): void {
        const value = parseFloat(raw);
        setDraft((prev) =>
            prev.map((s) =>
                s.personId === personId
                    ? { ...s, value: isNaN(value) ? 0 : value }
                    : s,
            ),
        );
    }

    function handleSliderChange(personId: string, raw: string): void {
        const newVal = parseFloat(raw);
        if (isNaN(newVal)) return;
        const target = mode === "percent" ? 100 : transaction.amount;
        const clamped = Math.min(Math.max(0, newVal), target);
        const remainder = target - clamped;

        setDraft((prev) => {
            const others = prev.filter((s) => s.personId !== personId);
            if (others.length === 0) {
                return prev.map((s) =>
                    s.personId === personId ? { ...s, value: clamped } : s,
                );
            }
            const othersTotal = others.reduce((acc, s) => acc + s.value, 0);
            const rawValues =
                othersTotal === 0
                    ? others.map(() => remainder / others.length)
                    : others.map((s) => (s.value / othersTotal) * remainder);

            // Round to 2dp, fix last to absorb rounding error
            const rounded = rawValues.map((v) => Math.round(v * 100) / 100);
            const roundedSum = rounded.reduce((a, b) => a + b, 0);
            const diff = Math.round((remainder - roundedSum) * 100) / 100;
            rounded[rounded.length - 1] = Math.max(
                0,
                Math.round((rounded[rounded.length - 1]! + diff) * 100) / 100,
            );

            return prev.map((s) => {
                if (s.personId === personId) return { ...s, value: clamped };
                const idx = others.findIndex((o) => o.personId === s.personId);
                return { ...s, value: rounded[idx] ?? 0 };
            });
        });
    }

    function handleSplitEqually(): void {
        if (mode === "percent") {
            setDraft(equalSplits(people));
        } else {
            setDraft(equalAmountSplits(people, transaction.amount));
        }
    }

    function handleModeSwitch(newMode: SplitMode): void {
        if (newMode === mode) return;
        if (newMode === "percent") {
            setDraft(equalSplits(people));
        } else {
            setDraft(equalAmountSplits(people, transaction.amount));
        }
    }

    return (
        <div className="split-editor">
            <div className="split-editor__payer">
                <span className="payer-label">paid by</span>
                <div className="payer-pills" role="group" aria-label="paid by">
                    {people.map((p) => (
                        <button
                            key={p.id}
                            className={`payer-pill${paidBy === p.id ? " payer-pill--active" : ""}`}
                            onClick={() => setPaidBy(p.id)}
                        >
                            {p.name}
                        </button>
                    ))}
                    <button
                        className={`payer-pill${paidBy === null ? " payer-pill--active" : ""}`}
                        onClick={() => setPaidBy(null)}
                    >
                        unset
                    </button>
                </div>
            </div>

            <div className="split-editor__toolbar">
                <div className="split-editor__mode-toggle">
                    <button
                        className={mode === "percent" ? "active" : ""}
                        onClick={() => handleModeSwitch("percent")}
                    >
                        %
                    </button>
                    <button
                        className={mode === "amount" ? "active" : ""}
                        onClick={() => handleModeSwitch("amount")}
                    >
                        $
                    </button>
                </div>
                <button
                    className="btn btn-secondary"
                    onClick={handleSplitEqually}
                >
                    split equally
                </button>
            </div>

            <div className="split-editor__rows">
                {people.map((person) => {
                    const entry = draft.find((s) => s.personId === person.id);
                    const val = entry?.value ?? 0;
                    const sliderMax =
                        mode === "percent" ? 100 : transaction.amount;
                    return (
                        <div key={person.id} className="split-editor__row">
                            <span className="split-editor__person">
                                {person.name}
                            </span>
                            <input
                                type="range"
                                className="split-editor__slider"
                                min={0}
                                max={sliderMax}
                                step={mode === "percent" ? 0.1 : 0.01}
                                value={val}
                                onChange={(e) =>
                                    handleSliderChange(
                                        person.id,
                                        e.target.value,
                                    )
                                }
                            />
                            <input
                                type="number"
                                className="split-editor__input"
                                min={0}
                                max={sliderMax}
                                step={0.01}
                                value={val}
                                onChange={(e) =>
                                    handleValueChange(person.id, e.target.value)
                                }
                            />
                            <span className="split-editor__unit">
                                {mode === "percent" ? "%" : "$"}
                            </span>
                            {mode === "percent" && (
                                <span className="split-editor__calc">
                                    = $
                                    {((val / 100) * transaction.amount).toFixed(
                                        2,
                                    )}
                                </span>
                            )}
                        </div>
                    );
                })}
            </div>

            <div
                className={`split-editor__remaining ${remainingOk ? "split-editor__remaining--ok" : "split-editor__remaining--warn"}`}
            >
                {mode === "percent"
                    ? `remaining: ${remaining.toFixed(2)}%`
                    : `remaining: $${remaining.toFixed(2)}`}
            </div>

            {error !== null && (
                <p className="error-msg" style={{ marginBottom: 10 }}>
                    {error}
                </p>
            )}

            <div className="split-editor__footer">
                <button
                    className="btn btn-primary"
                    onClick={() => onSave(draft, paidBy)}
                    disabled={error !== null}
                >
                    save
                </button>
                {onCancel !== undefined && (
                    <button className="btn btn-secondary" onClick={onCancel}>
                        cancel
                    </button>
                )}
            </div>
        </div>
    );
}
