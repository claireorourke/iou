import React from "react";
import type { AppState } from "../../types.js";
import { validateAppState } from "../../utils.js";

interface Props {
    state: AppState;
    onLoad: (state: AppState) => void;
}

export function SaveLoadTab({ state, onLoad }: Props): React.JSX.Element {
    const [loadError, setLoadError] = React.useState<string | null>(null);
    const [loadSuccess, setLoadSuccess] = React.useState(false);

    function handleExport(): void {
        const json = JSON.stringify(state, null, 2);
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "iou-state.json";
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    function handleImport(e: React.ChangeEvent<HTMLInputElement>): void {
        const file = e.target.files?.[0];
        if (file === undefined) return;
        e.target.value = "";

        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const text = ev.target?.result;
                if (typeof text !== "string") throw new Error("Could not read file");
                const parsed: unknown = JSON.parse(text);
                const loaded = validateAppState(parsed);
                onLoad(loaded);
                setLoadError(null);
                setLoadSuccess(true);
                setTimeout(() => setLoadSuccess(false), 3000);
            } catch (err) {
                setLoadError(err instanceof Error ? err.message : "Unknown error");
                setLoadSuccess(false);
            }
        };
        reader.readAsText(file);
    }

    const txCount = state.transactions.length;
    const peopleCount = state.people.length;

    return (
        <div className="card">
            <h2 className="section-title">save / load</h2>
            <div className="saveload-section">
                <div className="saveload-block">
                    <h3>export</h3>
                    <p>
                        Download the current state as a JSON file. Current state has {peopleCount}{" "}
                        {peopleCount === 1 ? "person" : "people"} and {txCount}{" "}
                        {txCount === 1 ? "transaction" : "transactions"}.
                    </p>
                    <button className="btn btn-primary" onClick={handleExport}>
                        download iou-state.json
                    </button>
                </div>

                <hr style={{ border: "none", borderTop: "1px solid var(--color-border)" }} />

                <div className="saveload-block">
                    <h3>import</h3>
                    <p>
                        Load a previously saved JSON file. This will replace the current state.
                    </p>
                    <label>
                        <span className="btn btn-secondary" style={{ cursor: "pointer" }}>
                            choose json file
                        </span>
                        <input
                            type="file"
                            accept=".json,application/json"
                            style={{ display: "none" }}
                            onChange={handleImport}
                        />
                    </label>
                    {loadError !== null && (
                        <p className="error-msg" style={{ marginTop: 10 }}>
                            Failed to load: {loadError}
                        </p>
                    )}
                    {loadSuccess && (
                        <p style={{ color: "var(--color-success)", marginTop: 10, fontSize: 13 }}>
                            State loaded successfully.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
