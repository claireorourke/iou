import React from "react";
import * as Papa from "papaparse";
import type { CsvImportSession } from "../../types.js";

interface Props {
    onParsed: (session: CsvImportSession) => void;
}

export function CsvUploader({ onParsed }: Props): React.JSX.Element {
    const [error, setError] = React.useState<string | null>(null);

    function handleFile(file: File): void {
        setError(null);
        Papa.parse<string[]>(file, {
            skipEmptyLines: true,
            complete(results) {
                const allRows = results.data;
                if (allRows.length === 0) {
                    setError("The CSV file is empty.");
                    return;
                }
                const firstRow = allRows[0] ?? [];
                // Heuristic: if first row looks like headers (no numbers), use it
                const looksLikeHeader = firstRow.every(
                    (cell) => isNaN(parseFloat(cell.replace(/[^0-9.\-]/g, ""))) || cell.trim() === ""
                );
                let headers: string[];
                let rawRows: string[][];
                if (looksLikeHeader && allRows.length > 1) {
                    headers = firstRow;
                    rawRows = allRows.slice(1);
                } else {
                    headers = firstRow.map((_, i) => `Column ${i + 1}`);
                    rawRows = allRows;
                }
                onParsed({
                    rawRows,
                    headers,
                    mapping: { nameCol: null, datetimeCol: null, amountCol: null, payerCol: null },
                    mappingConfirmed: false,
                    preview: [],
                });
            },
            error(err) {
                setError(`Parse error: ${err.message}`);
            },
        });
    }

    function handleChange(e: React.ChangeEvent<HTMLInputElement>): void {
        const file = e.target.files?.[0];
        if (file !== undefined) handleFile(file);
        e.target.value = "";
    }

    function handleDrop(e: React.DragEvent<HTMLDivElement>): void {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file !== undefined) handleFile(file);
    }

    function handleDragOver(e: React.DragEvent<HTMLDivElement>): void {
        e.preventDefault();
    }

    return (
        <div className="import-section">
            <div className="upload-area" onDrop={handleDrop} onDragOver={handleDragOver}>
                <p>Drag and drop a CSV file here, or</p>
                <p style={{ marginTop: 12 }}>
                    <label>
                        <span className="btn btn-primary" style={{ cursor: "pointer" }}>
                            Choose File
                        </span>
                        <input type="file" accept=".csv,text/csv" onChange={handleChange} />
                    </label>
                </p>
            </div>
            {error !== null && <p className="error-msg">{error}</p>}
        </div>
    );
}
