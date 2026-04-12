import type { AppState, CsvMapping, Person, PersonId, SplitEntry, Transaction, TransactionStatus } from "./types.js";

export function newId(): string {
    return crypto.randomUUID();
}

export function mustGet<T>(arr: readonly T[], i: number, label: string): T {
    const v = arr[i];
    if (v === undefined) throw new Error(`${label}[${i}] is undefined`);
    return v;
}

export function equalSplits(people: Person[]): SplitEntry[] {
    if (people.length === 0) return [];
    const base = Math.floor((100 / people.length) * 100) / 100;
    const entries: SplitEntry[] = people.map((p) => ({
        personId: p.id,
        mode: "percent" as const,
        value: base,
    }));
    const assigned = base * people.length;
    const remainder = Math.round((100 - assigned) * 100) / 100;
    const last = entries[entries.length - 1];
    if (last !== undefined) {
        last.value = Math.round((last.value + remainder) * 100) / 100;
    }
    return entries;
}

export function equalAmountSplits(people: Person[], total: number): SplitEntry[] {
    if (people.length === 0) return [];
    const base = Math.floor((total / people.length) * 100) / 100;
    const entries: SplitEntry[] = people.map((p) => ({
        personId: p.id,
        mode: "amount" as const,
        value: base,
    }));
    const assigned = base * people.length;
    const remainder = Math.round((total - assigned) * 100) / 100;
    const last = entries[entries.length - 1];
    if (last !== undefined) {
        last.value = Math.round((last.value + remainder) * 100) / 100;
    }
    return entries;
}

export function validateSplits(splits: SplitEntry[], totalAmount: number): string | null {
    if (splits.length === 0) return "At least one person must be assigned.";
    const mode = splits[0]?.mode ?? "percent";
    if (mode === "percent") {
        const sum = splits.reduce((acc, s) => acc + s.value, 0);
        if (Math.abs(sum - 100) > 0.01) return `Percentages sum to ${sum.toFixed(2)}%, must be 100%.`;
    } else {
        if (splits.some((s) => s.value < 0)) return "Amounts cannot be negative.";
        const sum = splits.reduce((acc, s) => acc + s.value, 0);
        if (sum > totalAmount + 0.01)
            return `Assigned $${sum.toFixed(2)} exceeds total $${totalAmount.toFixed(2)}.`;
    }
    return null;
}

function parseDate(raw: string): string {
    const trimmed = raw.trim();
    if (trimmed === "") return "";
    // Handle M/D/YY and M/D/YYYY (e.g. 11/30/24 or 1/5/2025)
    const mdy = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
    if (mdy !== null) {
        const m = mdy[1] ?? "1";
        const d = mdy[2] ?? "1";
        const yRaw = mdy[3] ?? "2000";
        const y = yRaw.length === 2 ? `20${yRaw}` : yRaw;
        const iso = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
        const date = new Date(iso);
        if (!isNaN(date.getTime())) return date.toISOString();
    }
    // Fall back to standard parsing
    const parsed = new Date(trimmed);
    return isNaN(parsed.getTime()) ? trimmed : parsed.toISOString();
}

function isFiller(name: string, amount: number): boolean {
    const n = name.trim().toLowerCase();
    if (n === "") return true;
    if (n === "total") return true;
    return false;
}

export function buildPreview(rows: string[][], mapping: CsvMapping, people: Person[]): Transaction[] {
    if (mapping.nameCol === null || mapping.amountCol === null) return [];
    const nameCol = mapping.nameCol;
    const amountCol = mapping.amountCol;
    const datetimeCol = mapping.datetimeCol;
    const payerCol = mapping.payerCol;

    return rows
        .map((row) => {
        const name = row[nameCol] ?? "";
        const amountRaw = row[amountCol] ?? "";
        const amount = parseFloat(amountRaw.replace(/[^0-9.\-]/g, ""));
        const datetime = datetimeCol !== null ? parseDate(row[datetimeCol] ?? "") : "";

        let status: "pending" | "confirmed" = "pending";
        let paidBy: string | null = null;
        if (payerCol !== null) {
            const payerName = (row[payerCol] ?? "").trim().toLowerCase();
            const match = people.find((p) => p.name.toLowerCase() === payerName);
            if (match !== undefined) {
                status = "confirmed";
                paidBy = match.id;
            }
        }

        return {
            id: newId(),
            name,
            datetime,
            amount: isNaN(amount) ? NaN : Math.abs(amount),
            paidBy,
            splits: equalSplits(people),
            status,
        };
    })
    .filter((tx) => !isFiller(tx.name, tx.amount));
}

export function computeBalances(state: AppState): Map<PersonId, number> {
    const balances = new Map<PersonId, number>();
    for (const person of state.people) {
        balances.set(person.id, 0);
    }
    for (const tx of state.transactions) {
        if (tx.status !== "confirmed") continue;
        // Debit each person their share of the cost
        for (const split of tx.splits) {
            const share =
                split.mode === "percent" ? (split.value / 100) * tx.amount : split.value;
            const current = balances.get(split.personId) ?? 0;
            balances.set(split.personId, current - share);
        }
        // Credit the payer the full amount they fronted
        if (tx.paidBy !== null) {
            const current = balances.get(tx.paidBy) ?? 0;
            balances.set(tx.paidBy, current + tx.amount);
        }
    }
    return balances;
}

export function validateAppState(parsed: unknown): AppState {
    if (typeof parsed !== "object" || parsed === null) throw new Error("Not an object");
    const obj = parsed as Record<string, unknown>;
    if (!Array.isArray(obj["people"])) throw new Error("Missing people array");
    if (!Array.isArray(obj["transactions"])) throw new Error("Missing transactions array");

    const people: Person[] = (obj["people"] as unknown[]).map((p, i) => {
        if (typeof p !== "object" || p === null) throw new Error(`people[${i}] is not an object`);
        const person = p as Record<string, unknown>;
        if (typeof person["id"] !== "string") throw new Error(`people[${i}].id is not a string`);
        if (typeof person["name"] !== "string") throw new Error(`people[${i}].name is not a string`);
        return { id: person["id"], name: person["name"] };
    });

    const transactions: Transaction[] = (obj["transactions"] as unknown[]).map((t, i) => {
        if (typeof t !== "object" || t === null)
            throw new Error(`transactions[${i}] is not an object`);
        const tx = t as Record<string, unknown>;
        if (typeof tx["id"] !== "string") throw new Error(`transactions[${i}].id is not a string`);
        if (typeof tx["name"] !== "string")
            throw new Error(`transactions[${i}].name is not a string`);
        if (typeof tx["amount"] !== "number")
            throw new Error(`transactions[${i}].amount is not a number`);
        if (typeof tx["datetime"] !== "string")
            throw new Error(`transactions[${i}].datetime is not a string`);
        if (!Array.isArray(tx["splits"])) throw new Error(`transactions[${i}].splits is not an array`);

        const splits: SplitEntry[] = (tx["splits"] as unknown[]).map((s, j) => {
            if (typeof s !== "object" || s === null)
                throw new Error(`transactions[${i}].splits[${j}] is not an object`);
            const split = s as Record<string, unknown>;
            if (typeof split["personId"] !== "string")
                throw new Error(`transactions[${i}].splits[${j}].personId is not a string`);
            if (split["mode"] !== "percent" && split["mode"] !== "amount")
                throw new Error(`transactions[${i}].splits[${j}].mode is invalid`);
            if (typeof split["value"] !== "number")
                throw new Error(`transactions[${i}].splits[${j}].value is not a number`);
            return {
                personId: split["personId"],
                mode: split["mode"],
                value: split["value"],
            };
        });

        const rawStatus = tx["status"];
        const status: TransactionStatus =
            rawStatus === "pending" || rawStatus === "confirmed" ? rawStatus : "confirmed";

        const rawPaidBy = tx["paidBy"];
        const paidBy: string | null =
            typeof rawPaidBy === "string" ? rawPaidBy : null;

        return {
            id: tx["id"],
            name: tx["name"],
            amount: tx["amount"],
            datetime: tx["datetime"],
            paidBy,
            splits,
            status,
        };
    });

    return { people, transactions };
}
