import React from "react";
import type { Person, PersonId } from "../../types.js";

interface Props {
    people: Person[];
    onAdd: (name: string) => void;
    onRemove: (id: PersonId) => void;
}

export function PeopleTab({ people, onAdd, onRemove }: Props): React.JSX.Element {
    const [inputValue, setInputValue] = React.useState("");

    function handleAdd(): void {
        const trimmed = inputValue.trim();
        if (trimmed === "") return;
        onAdd(trimmed);
        setInputValue("");
    }

    function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>): void {
        if (e.key === "Enter") handleAdd();
    }

    return (
        <div className="card">
            <h2 className="section-title">People</h2>
            <div className="people-add-row">
                <input
                    type="text"
                    placeholder="Name"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                />
                <button
                    className="btn btn-primary"
                    onClick={handleAdd}
                    disabled={inputValue.trim() === ""}
                >
                    Add Person
                </button>
            </div>
            {people.length === 0 ? (
                <div className="empty-state">
                    <p>No people added yet. Add someone above to get started.</p>
                </div>
            ) : (
                <div className="people-list">
                    {people.map((person) => (
                        <div key={person.id} className="people-item">
                            <span className="people-item__name">{person.name}</span>
                            <button
                                className="btn btn-ghost"
                                onClick={() => onRemove(person.id)}
                                title="Remove"
                            >
                                ✕
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
