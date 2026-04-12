import React from "react";
import type { CsvImportSession, Person, Transaction } from "../../types.js";
import { buildPreview } from "../../utils.js";
import { CsvUploader } from "./CsvUploader.js";
import { ColumnMapper } from "./ColumnMapper.js";
import { ImportPreview } from "./ImportPreview.js";

interface Props {
    people: Person[];
    csvSession: CsvImportSession | null;
    onSessionChange: (session: CsvImportSession | null) => void;
    onCommit: (transactions: Transaction[]) => void;
}

export function ImportTab({ people, csvSession, onSessionChange, onCommit }: Props): React.JSX.Element {
    if (people.length === 0) {
        return (
            <div className="card">
                <div className="empty-state">
                    <p>add people on the people tab before importing transactions.</p>
                </div>
            </div>
        );
    }

    if (csvSession === null) {
        return (
            <div className="card">
                <h2 className="section-title">import csv</h2>
                <CsvUploader
                    onParsed={(session) => onSessionChange(session)}
                />
            </div>
        );
    }

    if (!csvSession.mappingConfirmed) {
        return (
            <div className="card">
                <ColumnMapper
                    session={csvSession}
                    onMappingChange={(mapping) => {
                        onSessionChange({ ...csvSession, mapping });
                    }}
                    onConfirm={() => {
                        const preview = buildPreview(csvSession.rawRows, csvSession.mapping, people);
                        onSessionChange({ ...csvSession, mappingConfirmed: true, preview });
                    }}
                    onBack={() => onSessionChange(null)}
                />
            </div>
        );
    }

    return (
        <div className="card">
            <ImportPreview
                transactions={csvSession.preview}
                people={people}
                onConfirm={() => {
                    const valid = csvSession.preview.filter((tx) => !isNaN(tx.amount));
                    onCommit(valid);
                }}
                onBack={() => {
                    onSessionChange({ ...csvSession, mappingConfirmed: false, preview: [] });
                }}
            />
        </div>
    );
}
