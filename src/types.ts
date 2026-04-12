export type PersonId = string;
export type TransactionId = string;
export type SplitMode = "percent" | "amount";

export interface Person {
    id: PersonId;
    name: string;
}

export interface SplitEntry {
    personId: PersonId;
    mode: SplitMode;
    value: number;
}

export type TransactionStatus = "pending" | "confirmed";

export interface Transaction {
    id: TransactionId;
    name: string;
    datetime: string;
    amount: number;
    paidBy: PersonId | null;
    splits: SplitEntry[];
    status: TransactionStatus;
}

export interface AppState {
    people: Person[];
    transactions: Transaction[];
}

export interface CsvMapping {
    nameCol: number | null;
    datetimeCol: number | null;
    amountCol: number | null;
    payerCol: number | null;
}

export interface CsvImportSession {
    rawRows: string[][];
    headers: string[];
    mapping: CsvMapping;
    mappingConfirmed: boolean;
    preview: Transaction[];
}
