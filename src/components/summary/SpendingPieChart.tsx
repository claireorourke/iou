import React from "react";
import type { PersonId } from "../../types.js";

export interface PieSlice {
    personId: PersonId;
    name: string;
    amount: number;
    color: string;
}

interface Props {
    slices: PieSlice[];
    size?: number;
}

const TWO_PI = 2 * Math.PI;

function polarToCartesian(cx: number, cy: number, r: number, angle: number): [number, number] {
    // angle 0 = top (subtract π/2 to start at top)
    return [cx + r * Math.cos(angle - Math.PI / 2), cy + r * Math.sin(angle - Math.PI / 2)];
}

export function SpendingPieChart({ slices, size = 200 }: Props): React.JSX.Element {
    const total = slices.reduce((acc, s) => acc + s.amount, 0);

    if (total === 0 || slices.length === 0) {
        return <p className="info-msg">no confirmed spending to chart.</p>;
    }

    const cx = size / 2;
    const cy = size / 2;
    const r = size / 2 - 4;

    let paths: React.JSX.Element[];

    if (slices.length === 1) {
        const slice = slices[0]!;
        paths = [<circle key={slice.personId} cx={cx} cy={cy} r={r} fill={slice.color} />];
    } else {
        let cumulative = 0;
        paths = slices.map((slice) => {
            const proportion = slice.amount / total;
            const startAngle = TWO_PI * cumulative;
            const endAngle = TWO_PI * (cumulative + proportion);
            cumulative += proportion;

            const [x1, y1] = polarToCartesian(cx, cy, r, startAngle);
            const [x2, y2] = polarToCartesian(cx, cy, r, endAngle);
            const largeArc = proportion > 0.5 ? 1 : 0;

            const d = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;

            return (
                <path key={slice.personId} d={d} fill={slice.color}>
                    <title>
                        {slice.name}: ${slice.amount.toFixed(2)} (
                        {((proportion) * 100).toFixed(1)}%)
                    </title>
                </path>
            );
        });
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Spending pie chart">
                {paths}
            </svg>
            <ul className="pie-legend">
                {slices.map((slice) => {
                    const pct = ((slice.amount / total) * 100).toFixed(1);
                    return (
                        <li key={slice.personId} className="pie-legend__item">
                            <span
                                className="pie-legend__swatch"
                                style={{ backgroundColor: slice.color }}
                            />
                            <span>{slice.name}</span>
                            <span style={{ color: "var(--color-text-muted)", marginLeft: "auto" }}>
                                ${slice.amount.toFixed(2)} · {pct}%
                            </span>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
