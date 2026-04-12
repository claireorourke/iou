import React from "react";
import type { CsvImportSession, CsvMapping } from "../../types.js";

interface Props {
    session: CsvImportSession;
    onMappingChange: (mapping: CsvMapping) => void;
    onConfirm: () => void;
    onBack: () => void;
}

const UNSET = "";

export function ColumnMapper({
    session,
    onMappingChange,
    onConfirm,
    onBack,
}: Props): React.JSX.Element {
    const { headers, rawRows, mapping } = session;

    function colVal(col: number | null): string {
        return col === null ? UNSET : String(col);
    }

    function parseCol(val: string): number | null {
        if (val === UNSET) return null;
        const n = parseInt(val, 10);
        return isNaN(n) ? null : n;
    }

    function update(field: keyof CsvMapping, val: string): void {
        onMappingChange({ ...mapping, [field]: parseCol(val) });
    }

    const previewRows = rawRows.slice(0, 3);

    return (
        <div className="import-section">
            <h3 className="section-title">map columns</h3>
            <p className="info-msg" style={{ marginBottom: 16 }}>
                Select which CSV column corresponds to each field. Name and
                Amount are required.
            </p>

            <div className="column-mapper card">
                <div className="column-mapper__row">
                    <span className="column-mapper__label">
                        transaction name *
                    </span>
                    <select
                        className="column-mapper__select"
                        value={colVal(mapping.nameCol)}
                        onChange={(e) => update("nameCol", e.target.value)}
                    >
                        <option value={UNSET}>— not mapped —</option>
                        {headers.map((h, i) => (
                            <option key={i} value={i}>
                                {h || `Column ${i + 1}`}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="column-mapper__row">
                    <span className="column-mapper__label">amount *</span>
                    <select
                        className="column-mapper__select"
                        value={colVal(mapping.amountCol)}
                        onChange={(e) => update("amountCol", e.target.value)}
                    >
                        <option value={UNSET}>— not mapped —</option>
                        {headers.map((h, i) => (
                            <option key={i} value={i}>
                                {h || `Column ${i + 1}`}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="column-mapper__row">
                    <span className="column-mapper__label">date / time</span>
                    <select
                        className="column-mapper__select"
                        value={colVal(mapping.datetimeCol)}
                        onChange={(e) => update("datetimeCol", e.target.value)}
                    >
                        <option value={UNSET}>— not mapped —</option>
                        {headers.map((h, i) => (
                            <option key={i} value={i}>
                                {h || `Column ${i + 1}`}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="column-mapper__row">
                    <span className="column-mapper__label">
                        Paid by
                        <span className="column-mapper__hint">
                            Matched rows import as confirmed
                        </span>
                    </span>
                    <select
                        className="column-mapper__select"
                        value={colVal(mapping.payerCol)}
                        onChange={(e) => update("payerCol", e.target.value)}
                    >
                        <option value={UNSET}>— not mapped —</option>
                        {headers.map((h, i) => (
                            <option key={i} value={i}>
                                {h || `Column ${i + 1}`}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {previewRows.length > 0 && (
                <div className="raw-preview">
                    <p style={{ marginBottom: 6, fontWeight: 600 }}>
                        Data preview (first {previewRows.length} rows)
                    </p>
                    <table>
                        <thead>
                            <tr>
                                {headers.map((h, i) => (
                                    <th key={i}>{h || `Col ${i + 1}`}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {previewRows.map((row, ri) => (
                                <tr key={ri}>
                                    {headers.map((_, ci) => (
                                        <td key={ci}>{row[ci] ?? ""}</td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <button className="btn btn-secondary" onClick={onBack}>
                    ← back
                </button>
                <button
                    className="btn btn-primary"
                    onClick={onConfirm}
                    disabled={
                        mapping.nameCol === null || mapping.amountCol === null
                    }
                >
                    continue →
                </button>
            </div>
        </div>
    );
}
