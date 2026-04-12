import React from "react";
import type { PersonId } from "../../types.js";

export interface BalanceRow {
    personId: PersonId;
    name: string;
    balance: number;
}

interface Props {
    rows: BalanceRow[];
}

const ROW_H = 38;
const PAD_Y = 10;
const NAME_W = 120;
const BAR_HALF = 140; // max bar extent each side of zero
const LABEL_GAP = 6;
const LABEL_W = 54; // reserved for amount text
const TOTAL_W = NAME_W + 1 + BAR_HALF * 2 + LABEL_W * 2; // 1 = zero line

const COLOR_POS = "#00897b";
const COLOR_NEG = "#ff5722";
const COLOR_ZERO = "#cccccc";

export function BalanceBarChart({ rows }: Props): React.JSX.Element {
    if (rows.length === 0) return <p className="info-msg">no data.</p>;

    const maxAbs = Math.max(...rows.map((r) => Math.abs(r.balance)), 0.01);
    const totalH = rows.length * ROW_H + PAD_Y * 2;

    // x coordinate of the zero line
    const zeroX = NAME_W + LABEL_W + BAR_HALF;

    return (
        <svg
            viewBox={`0 0 ${TOTAL_W} ${totalH}`}
            width="100%"
            style={{ display: "block", fontFamily: "inherit", maxWidth: TOTAL_W }}
            role="img"
            aria-label="Balance bar chart"
        >
            {/* zero line */}
            <line
                x1={zeroX}
                y1={PAD_Y - 4}
                x2={zeroX}
                y2={totalH - PAD_Y + 4}
                stroke="#000"
                strokeWidth={2}
            />

            {rows.map((row, i) => {
                const cy = PAD_Y + i * ROW_H + ROW_H / 2;
                const barH = ROW_H - 14;
                const barTop = cy - barH / 2;

                const frac = Math.abs(row.balance) / maxAbs;
                const barW = Math.round(frac * BAR_HALF);
                const isPos = row.balance > 0.005;
                const isNeg = row.balance < -0.005;
                const color = isPos ? COLOR_POS : isNeg ? COLOR_NEG : COLOR_ZERO;

                const barX = isPos ? zeroX : zeroX - barW;

                const amtText =
                    isPos
                        ? `+$${row.balance.toFixed(2)}`
                        : isNeg
                          ? `-$${Math.abs(row.balance).toFixed(2)}`
                          : "$0.00";

                const labelX = isNeg
                    ? zeroX - barW - LABEL_GAP
                    : zeroX + barW + LABEL_GAP;
                const labelAnchor = isNeg ? "end" : "start";

                return (
                    <g key={row.personId}>
                        {/* person name */}
                        <text
                            x={NAME_W - 10}
                            y={cy + 5}
                            textAnchor="end"
                            fontSize={13}
                            fontWeight={700}
                            fill="#000"
                        >
                            {row.name}
                        </text>

                        {/* bar */}
                        {barW > 0 && (
                            <rect
                                x={barX}
                                y={barTop}
                                width={barW}
                                height={barH}
                                fill={color}
                                stroke="#000"
                                strokeWidth={2}
                            />
                        )}

                        {/* amount label */}
                        <text
                            x={labelX}
                            y={cy + 5}
                            textAnchor={labelAnchor}
                            fontSize={12}
                            fontWeight={800}
                            fill={color === COLOR_ZERO ? "#888" : color}
                        >
                            {amtText}
                        </text>
                    </g>
                );
            })}

            {/* axis labels */}
            <text
                x={zeroX - BAR_HALF / 2}
                y={totalH - 1}
                textAnchor="middle"
                fontSize={10}
                fill="#888"
                fontWeight={700}
            >
                owes
            </text>
            <text
                x={zeroX + BAR_HALF / 2}
                y={totalH - 1}
                textAnchor="middle"
                fontSize={10}
                fill="#888"
                fontWeight={700}
            >
                gets back
            </text>
        </svg>
    );
}
