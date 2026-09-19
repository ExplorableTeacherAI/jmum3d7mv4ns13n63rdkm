/**
 * Shared drawing kit for the Coordinate Geometry lesson
 * =====================================================
 *
 * Every figure in this lesson is a bespoke SVG drawn on the same squared
 * grid, so the grid maths, the ink palette, the linked-highlight contract
 * and the pointer helper all live here once.
 *
 * Follows FIGURE_DESIGN_LANGUAGE.md: white ground, ink #334155 / #64748B,
 * ONE accent hue per figure, two stroke weights, direct labels, generous
 * interior padding, nothing teleports.
 */

import React from "react";
import { useVar, useSetVar } from "@/stores";
import { type Vec2 } from "@/lib/motion";

// ── Palette ──────────────────────────────────────────────────────────────────

export const INK = "#334155";           // labels
export const INK_STRUCTURE = "#64748B"; // outlines, construction lines
export const INK_QUIET = "#CBD5E1";     // axes, ticks
export const GRID_LINE = "#EDF1F6";     // squared paper
export const ACCENT = "#62D0AD";        // Soft Teal — the manipulable quantity
export const ACCENT_TWO = "#8E90F5";    // Soft Indigo — its partner quantity
export const GAP_ACROSS = "#F7B23B";    // Warm Amber — the horizontal gap (across / run)
export const GAP_UP = "#F8A0CD";        // Soft Rose — the vertical gap (up / rise)
export const SUCCESS = "#22c55e";

export const EASE_150 = {
    transition: "opacity 150ms ease, stroke-width 150ms ease",
} as const;

// ── Grid scale ───────────────────────────────────────────────────────────────

export interface GridOptions {
    xMin: number;
    xMax: number;
    yMin: number;
    yMax: number;
    width?: number;
    height?: number;
    padX?: number;
    padTop?: number;
    padBottom?: number;
}

export interface GridScale {
    xMin: number;
    xMax: number;
    yMin: number;
    yMax: number;
    width: number;
    height: number;
    unit: number;
    toX: (x: number) => number;
    toY: (y: number) => number;
    fromX: (px: number) => number;
    fromY: (py: number) => number;
}

/**
 * Build a square-aspect grid that fits inside the padded plot area.
 * The padded top strip is where readouts live — never over the plot.
 */
export function makeGrid({
    xMin,
    xMax,
    yMin,
    yMax,
    width = 560,
    height = 430,
    padX = 40,
    padTop = 76,
    padBottom = 34,
}: GridOptions): GridScale {
    const availableWidth = width - 2 * padX;
    const availableHeight = height - padTop - padBottom;
    const unit = Math.min(availableWidth / (xMax - xMin), availableHeight / (yMax - yMin));
    const plotWidth = (xMax - xMin) * unit;
    const plotHeight = (yMax - yMin) * unit;

    const originX = padX + (availableWidth - plotWidth) / 2 - xMin * unit;
    const originY = padTop + (availableHeight - plotHeight) / 2 + plotHeight + yMin * unit;

    return {
        xMin,
        xMax,
        yMin,
        yMax,
        width,
        height,
        unit,
        toX: (x: number) => originX + x * unit,
        toY: (y: number) => originY - y * unit,
        fromX: (px: number) => (px - originX) / unit,
        fromY: (py: number) => (originY - py) / unit,
    };
}

const integerRange = (min: number, max: number): number[] => {
    const values: number[] = [];
    for (let v = Math.ceil(min); v <= Math.floor(max); v += 1) values.push(v);
    return values;
};

/**
 * Squared paper plus the two axes and their number labels.
 * Ambient structure: always the quietest ink on the page.
 */
export function GridBackdrop({
    grid,
    labelStep = 2,
    dim = 1,
}: {
    grid: GridScale;
    labelStep?: number;
    dim?: number;
}) {
    const xs = integerRange(grid.xMin, grid.xMax);
    const ys = integerRange(grid.yMin, grid.yMax);
    const axisY = grid.toY(0);
    const axisX = grid.toX(0);

    return (
        <g opacity={dim} style={EASE_150}>
            {xs.map((x) => (
                <line
                    key={`gx-${x}`}
                    x1={grid.toX(x)}
                    y1={grid.toY(grid.yMin)}
                    x2={grid.toX(x)}
                    y2={grid.toY(grid.yMax)}
                    stroke={GRID_LINE}
                    strokeWidth="1"
                />
            ))}
            {ys.map((y) => (
                <line
                    key={`gy-${y}`}
                    x1={grid.toX(grid.xMin)}
                    y1={grid.toY(y)}
                    x2={grid.toX(grid.xMax)}
                    y2={grid.toY(y)}
                    stroke={GRID_LINE}
                    strokeWidth="1"
                />
            ))}

            {/* Axes */}
            <line
                x1={grid.toX(grid.xMin)}
                y1={axisY}
                x2={grid.toX(grid.xMax)}
                y2={axisY}
                stroke={INK_QUIET}
                strokeWidth="1.5"
                strokeLinecap="round"
            />
            <line
                x1={axisX}
                y1={grid.toY(grid.yMin)}
                x2={axisX}
                y2={grid.toY(grid.yMax)}
                stroke={INK_QUIET}
                strokeWidth="1.5"
                strokeLinecap="round"
            />

            {/* Number labels — kept off the axis line itself */}
            <g fontSize="11" fill="#94A3B8" style={{ fontVariantNumeric: "tabular-nums" }}>
                {xs
                    .filter((x) => x !== 0 && x % labelStep === 0)
                    .map((x) => (
                        <text key={`lx-${x}`} x={grid.toX(x)} y={axisY + 16} textAnchor="middle">
                            {x}
                        </text>
                    ))}
                {ys
                    .filter((y) => y !== 0 && y % labelStep === 0)
                    .map((y) => (
                        <text key={`ly-${y}`} x={axisX - 8} y={grid.toY(y) + 4} textAnchor="end">
                            {y}
                        </text>
                    ))}
                <text x={axisX - 8} y={axisY + 16} textAnchor="end">
                    0
                </text>
                <text x={grid.toX(grid.xMax)} y={axisY - 8} textAnchor="end" fill="#94A3B8">
                    x
                </text>
                <text x={axisX + 8} y={grid.toY(grid.yMax) + 4} fill="#94A3B8">
                    y
                </text>
            </g>
        </g>
    );
}

// ── Linked-highlight contract ────────────────────────────────────────────────
// The target pops (stroke >= 1.5x plus a ~28% halo) while EVERY other element
// recedes to ~35%, both eased over 150ms.

export function useHighlight(varName: string) {
    const highlight = useVar<string>(varName, "");
    const setVar = useSetVar();
    return {
        highlight,
        opacity: (id: string) => (highlight && highlight !== id ? 0.35 : 1),
        weight: (id: string, resting: number) => (highlight === id ? resting * 1.6 : resting),
        isActive: (id: string) => highlight === id,
        hoverProps: (id: string) => ({
            onPointerEnter: () => setVar(varName, id),
            onPointerLeave: () => setVar(varName, ""),
        }),
    };
}

/** The soft halo half of the "pop": a wider stroke of the same hue underneath. */
export const Halo = ({ active, children }: { active: boolean; children: React.ReactNode }) =>
    active ? <g opacity={0.28}>{children}</g> : null;

// ── Pointer helper ───────────────────────────────────────────────────────────

export const svgPointFromEvent = (
    event: React.PointerEvent,
    svg: SVGSVGElement | null,
    width: number,
    height: number,
): Vec2 => {
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    return {
        x: ((event.clientX - rect.left) / rect.width) * width,
        y: ((event.clientY - rect.top) / rect.height) * height,
    };
};

// ── Draggable handle ─────────────────────────────────────────────────────────

export interface DragHandleProps {
    x: number;
    y: number;
    color?: string;
    radius?: number;
    shadowId: string;
    scale?: number;
    onDragMove: (event: React.PointerEvent<SVGCircleElement>) => void;
    onDraggingChange: (dragging: boolean) => void;
    onHoverChange?: (hovered: boolean) => void;
    dragging?: boolean;
}

/**
 * Accent dot with a soft shadow (draggables only) and an oversized
 * transparent hit area for comfortable touch dragging.
 */
export function DragHandle({
    x,
    y,
    color = ACCENT,
    radius = 9,
    shadowId,
    scale = 1,
    onDragMove,
    onDraggingChange,
    onHoverChange,
    dragging = false,
}: DragHandleProps) {
    return (
        <g>
            <g transform={`translate(${x} ${y}) scale(${scale})`}>
                <circle r={radius} fill={color} filter={`url(#${shadowId})`} />
                <circle r={radius} fill="none" stroke="#FFFFFF" strokeWidth="1.5" />
            </g>
            <circle
                cx={x}
                cy={y}
                r="24"
                fill="transparent"
                style={{ cursor: dragging ? "grabbing" : "grab", touchAction: "none" }}
                onPointerDown={(event) => {
                    event.currentTarget.setPointerCapture(event.pointerId);
                    onDraggingChange(true);
                }}
                onPointerMove={onDragMove}
                onPointerUp={() => onDraggingChange(false)}
                onPointerCancel={() => onDraggingChange(false)}
                onPointerEnter={() => onHoverChange?.(true)}
                onPointerLeave={() => onHoverChange?.(false)}
            />
        </g>
    );
}

/** Shared soft-shadow filter definition for draggable handles. */
export const HandleShadow = ({ id }: { id: string }) => (
    <filter id={id} x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#0F172A" floodOpacity="0.25" />
    </filter>
);
