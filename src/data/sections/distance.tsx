/**
 * Section 2 — How Far Apart? (distance between two points)
 *
 * Bespoke figure: a fixed depot, a draggable drop-off, and the right-angled
 * triangle that appears between them. The readout keeps the sum of squares
 * and the square root on screen at the same time, and a ring of equal hops
 * shows what that final number actually means on the grid.
 */

import React, { useRef, useState, type ReactElement } from "react";
import { StackLayout } from "@/components/layouts";
import { Block } from "@/components/templates";
import {
    EditableH2,
    EditableH3,
    EditableParagraph,
    InlineClozeInput,
    InlineFeedback,
    InlineLinkedHighlight,
    InlineScrubbleNumber,
    InlineTooltip,
    InteractionHintSequence,
} from "@/components/atoms";
import { Figure } from "@/components/molecules";
import { FormulaBlock } from "@/components/molecules";
import { useVar, useSetVar } from "@/stores";
import { clamp } from "@/lib/motion";
import {
    getVariableInfo,
    clozePropsFromDefinition,
    linkedHighlightPropsFromDefinition,
    numberPropsFromDefinition,
} from "../variables";
import {
    ACCENT,
    DragHandle,
    EASE_150,
    GAP_ACROSS,
    GAP_UP,
    GridBackdrop,
    Halo,
    HandleShadow,
    INK,
    INK_STRUCTURE,
    makeGrid,
    svgPointFromEvent,
    useHighlight,
} from "./coordinateGrid";

// ── Model ────────────────────────────────────────────────────────────────────

const DEPOT: [number, number] = [2, 1];
const DEFAULT_DROP: [number, number] = [10, 7];

const GRID = makeGrid({ xMin: -1, xMax: 11, yMin: -1, yMax: 9 });
const SHADOW_ID = "distance-handle-shadow";

const formatHop = (value: number) => value.toFixed(2);

// ── Drawing ──────────────────────────────────────────────────────────────────

function DistanceDrawing() {
    const setVar = useSetVar();
    const dropX = useVar<number>("distanceDropX", DEFAULT_DROP[0]);
    const dropY = useVar<number>("distanceDropY", DEFAULT_DROP[1]);
    const { opacity, weight, isActive, hoverProps } = useHighlight("distanceHighlight");

    const [dragging, setDragging] = useState(false);
    const draggingRef = useRef(false);
    const svgRef = useRef<SVGSVGElement>(null);

    const across = dropX - DEPOT[0];
    const up = dropY - DEPOT[1];
    const sumOfSquares = across * across + up * up;
    const hop = Math.sqrt(sumOfSquares);

    // Direct 1:1 tracking, snapped to whole grid squares.
    const handleDragMove = (event: React.PointerEvent<SVGCircleElement>) => {
        if (!draggingRef.current) return;
        const point = svgPointFromEvent(event, svgRef.current, GRID.width, GRID.height);
        setVar("distanceDropX", clamp(Math.round(GRID.fromX(point.x)), GRID.xMin, GRID.xMax));
        setVar("distanceDropY", clamp(Math.round(GRID.fromY(point.y)), GRID.yMin, GRID.yMax));
    };

    const ax = GRID.toX(DEPOT[0]);
    const ay = GRID.toY(DEPOT[1]);
    const bx = GRID.toX(dropX);
    const by = GRID.toY(dropY);
    const cornerX = bx;
    const cornerY = ay;

    const labelAbove = dropY <= 7;

    return (
        <svg
            ref={svgRef}
            viewBox={`0 0 ${GRID.width} ${GRID.height}`}
            className="block w-full select-none"
            role="img"
            aria-label="A grid with a fixed depot and a draggable drop-off point joined by a right-angled triangle"
        >
            <defs>
                <HandleShadow id={SHADOW_ID} />
            </defs>

            {/* Readout strip — above the plot, never over it. */}
            <g fontSize="12" style={{ fontVariantNumeric: "tabular-nums", ...EASE_150 }}>
                <text x="24" y="30" fill={GAP_ACROSS} opacity={opacity("across")}>
                    {`across = ${Math.abs(across)}`}
                </text>
                <text x="150" y="30" fill={GAP_UP} opacity={opacity("up")}>
                    {`up = ${Math.abs(up)}`}
                </text>
                <text x="24" y="56" fill={INK}>
                    {`${Math.abs(across)}² + ${Math.abs(up)}² = ${sumOfSquares}`}
                </text>
                <text x="536" y="56" fill={ACCENT} textAnchor="end" opacity={opacity("hop")}>
                    {`hop = √${sumOfSquares} = ${formatHop(hop)}`}
                </text>
            </g>

            <GridBackdrop grid={GRID} labelStep={2} dim={opacity("__structure")} />

            {/* Ring of equal hops — every point on it is the same distance
                from the depot. Part of the hop group. */}
            <g opacity={opacity("hop")} style={EASE_150}>
                <circle
                    cx={ax}
                    cy={ay}
                    r={hop * GRID.unit}
                    fill="none"
                    stroke={ACCENT}
                    strokeWidth="1.5"
                    strokeDasharray="4 5"
                    opacity={0.55}
                />
            </g>

            {/* ACROSS leg */}
            {across !== 0 && (
                <g {...hoverProps("across")} opacity={opacity("across")} style={EASE_150}>
                    <Halo active={isActive("across")}>
                        <line
                            x1={ax}
                            y1={ay}
                            x2={cornerX}
                            y2={cornerY}
                            stroke={GAP_ACROSS}
                            strokeWidth={weight("across", 2) + 6}
                            strokeLinecap="round"
                        />
                    </Halo>
                    <line
                        x1={ax}
                        y1={ay}
                        x2={cornerX}
                        y2={cornerY}
                        stroke={GAP_ACROSS}
                        strokeWidth={weight("across", 2)}
                        strokeLinecap="round"
                    />
                    <text
                        x={(ax + cornerX) / 2}
                        y={up >= 0 ? cornerY + 18 : cornerY - 10}
                        fill={INK}
                        fontSize="12"
                        textAnchor="middle"
                        style={{ fontVariantNumeric: "tabular-nums" }}
                    >
                        {`${Math.abs(across)} across`}
                    </text>
                </g>
            )}

            {/* UP leg */}
            {up !== 0 && (
                <g {...hoverProps("up")} opacity={opacity("up")} style={EASE_150}>
                    <Halo active={isActive("up")}>
                        <line
                            x1={cornerX}
                            y1={cornerY}
                            x2={bx}
                            y2={by}
                            stroke={GAP_UP}
                            strokeWidth={weight("up", 2) + 6}
                            strokeLinecap="round"
                        />
                    </Halo>
                    <line
                        x1={cornerX}
                        y1={cornerY}
                        x2={bx}
                        y2={by}
                        stroke={GAP_UP}
                        strokeWidth={weight("up", 2)}
                        strokeLinecap="round"
                    />
                    <text
                        x={across >= 0 ? cornerX + 10 : cornerX - 10}
                        y={(cornerY + by) / 2 + 4}
                        fill={INK}
                        fontSize="12"
                        textAnchor={across >= 0 ? "start" : "end"}
                        style={{ fontVariantNumeric: "tabular-nums" }}
                    >
                        {`${Math.abs(up)} up`}
                    </text>
                </g>
            )}

            {/* THE HOP — one accent hue, heaviest stroke on the page. */}
            <g {...hoverProps("hop")} opacity={opacity("hop")} style={EASE_150}>
                <Halo active={isActive("hop")}>
                    <line
                        x1={ax}
                        y1={ay}
                        x2={bx}
                        y2={by}
                        stroke={ACCENT}
                        strokeWidth={weight("hop", 3.5) + 6}
                        strokeLinecap="round"
                    />
                </Halo>
                <line
                    x1={ax}
                    y1={ay}
                    x2={bx}
                    y2={by}
                    stroke={ACCENT}
                    strokeWidth={weight("hop", 3.5)}
                    strokeLinecap="round"
                />
            </g>

            {/* Depot — fixed, ink, deliberately not grabbable-looking. */}
            <g opacity={opacity("__structure")} style={EASE_150}>
                <circle cx={ax} cy={ay} r="6" fill={INK_STRUCTURE} />
                <text x={ax - 10} y={ay + 20} fill={INK} fontSize="12" textAnchor="end">
                    depot (2, 1)
                </text>
            </g>

            {/* Drop-off — the draggable point. */}
            <text
                x={dropX >= 9 ? bx - 14 : bx + 14}
                y={labelAbove ? by - 12 : by + 24}
                fill={INK}
                fontSize="12"
                textAnchor={dropX >= 9 ? "end" : "start"}
                style={{ fontVariantNumeric: "tabular-nums" }}
            >
                {`(${dropX}, ${dropY})`}
            </text>
            <DragHandle
                x={bx}
                y={by}
                shadowId={SHADOW_ID}
                dragging={dragging}
                onDragMove={handleDragMove}
                onDraggingChange={(value) => {
                    draggingRef.current = value;
                    setDragging(value);
                }}
            />
        </svg>
    );
}

function DistanceFigure() {
    const setVar = useSetVar();
    return (
        <Figure
            id="distance-hop"
            onReset={() => {
                setVar("distanceDropX", DEFAULT_DROP[0]);
                setVar("distanceDropY", DEFAULT_DROP[1]);
                setVar("distanceHighlight", "");
            }}
            caption="Drag the teal drop-off anywhere on the grid. The two legs are counted off the squares; the teal ring collects every point that is the same hop from the depot."
        >
            <DistanceDrawing />
            <InteractionHintSequence
                hintKey="distance-drop-drag"
                steps={[
                    {
                        gesture: "drag",
                        label: "Drag the teal drop-off point",
                        position: { x: "79%", y: "33%" },
                        dragPath: {
                            type: "line",
                            startOffset: { x: 22, y: -18 },
                            endOffset: { x: -26, y: 22 },
                        },
                    },
                ]}
            />
        </Figure>
    );
}

// ── Live formula ─────────────────────────────────────────────────────────────

function DistanceFormula() {
    const dropX = useVar<number>("distanceDropX", DEFAULT_DROP[0]);
    const dropY = useVar<number>("distanceDropY", DEFAULT_DROP[1]);
    const across = Math.abs(dropX - DEPOT[0]);
    const up = Math.abs(dropY - DEPOT[1]);
    const sum = across * across + up * up;

    return (
        <FormulaBlock
            latex={
                `\\clr{hop}{d} = \\sqrt{\\clr{across}{(x_2 - x_1)^2} + \\clr{up}{(y_2 - y_1)^2}}` +
                ` = \\sqrt{\\clr{across}{${across}^2} + \\clr{up}{${up}^2}}` +
                ` = \\clr{hop}{${formatHop(Math.sqrt(sum))}}`
            }
            colorMap={{ hop: ACCENT, across: GAP_ACROSS, up: GAP_UP }}
        />
    );
}

// ── Blocks ───────────────────────────────────────────────────────────────────

export const distanceBlocks: ReactElement[] = [
    <StackLayout key="layout-part-one-heading" maxWidth="xl">
        <Block id="part-one-heading" padding="lg">
            <EditableH2 id="h2-part-one-heading" blockId="part-one-heading">
                Part 1 · Distance and Midpoint
            </EditableH2>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-distance-heading" maxWidth="xl">
        <Block id="distance-heading" padding="md">
            <EditableH3 id="h3-distance-heading" blockId="distance-heading">
                How Far Apart?
            </EditableH3>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-distance-setup" maxWidth="xl">
        <Block id="distance-setup" padding="sm">
            <EditableParagraph id="para-distance-setup" blockId="distance-setup">
                The scooter cannot fly, but the app still wants the straight-line hop from
                the depot to your door. Drag the teal drop-off point to{" "}
                <InlineScrubbleNumber
                    varName="distanceDropX"
                    {...numberPropsFromDefinition(getVariableInfo("distanceDropX"))}
                />
                {" "}across and{" "}
                <InlineScrubbleNumber
                    varName="distanceDropY"
                    {...numberPropsFromDefinition(getVariableInfo("distanceDropY"))}
                />
                {" "}up, and a{" "}
                <InlineTooltip
                    id="tooltip-distance-right-angled-triangle"
                    tooltip="A triangle with one 90° corner. Pythagoras' theorem says the squares of its two short legs add up to the square of the sloping side."
                >
                    right-angled triangle
                </InlineTooltip>{" "}
                snaps into place beneath it. The{" "}
                <InlineLinkedHighlight
                    varName="distanceHighlight"
                    highlightId="hop"
                    {...linkedHighlightPropsFromDefinition(getVariableInfo("distanceHighlight"))}
                >
                    hop itself
                </InlineLinkedHighlight>{" "}
                is the sloping side.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-distance-figure" maxWidth="xl">
        <Block id="distance-figure" padding="sm" hasVisualization>
            <DistanceFigure />
        </Block>
    </StackLayout>,

    <StackLayout key="layout-distance-formula" maxWidth="xl">
        <Block id="distance-formula" padding="md">
            <DistanceFormula />
        </Block>
    </StackLayout>,

    <StackLayout key="layout-distance-insight" maxWidth="xl">
        <Block id="distance-insight" padding="sm">
            <EditableParagraph id="para-distance-insight" blockId="distance-insight">
                Square each leg and add them, and you get the number on the left of the
                readout. That total is not the distance yet, and this is where marks
                disappear: 100 squares would send the scooter clean off the map, so the
                square root pulls it back to a believable 10.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-distance-question-near" maxWidth="xl">
        <Block id="distance-question-near" padding="md">
            <EditableParagraph id="para-distance-question-near" blockId="distance-question-near">
                A second scooter leaves the depot at (2, 1) and stops at (5, 5). The
                straight-line distance it covered is{" "}
                <InlineFeedback
                    varName="answerDistanceNear"
                    correctValue="5"
                    position="terminal"
                    successMessage="— exactly. 3² + 4² = 25, and the square root brings that back down to 5"
                    failureMessage="— careful."
                    hint="25 is the sum of the squares, not the distance. One step is still missing"
                    visualizationHint={{
                        blockId: "distance-figure",
                        hintKey: "distance-feedback-hint",
                        label: "Discover it yourself",
                        resetVars: { distanceDropX: 10, distanceDropY: 7, distanceHighlight: "" },
                        steps: [
                            {
                                gesture: "drag",
                                label: "Drag the drop-off left until the legs read across = 3",
                                position: { x: "79%", y: "33%" },
                                completionVar: "distanceDropX",
                                completionValue: 5,
                                completionTolerance: 0.4,
                            },
                            {
                                gesture: "drag-vertical",
                                label: "Now pull it down to 4 up — then read the last line of the readout",
                                position: { x: "50%", y: "33%" },
                                completionVar: "distanceDropY",
                                completionValue: 5,
                                completionTolerance: 0.4,
                            },
                        ],
                    }}
                >
                    <InlineClozeInput
                        varName="answerDistanceNear"
                        correctAnswer="5"
                        {...clozePropsFromDefinition(getVariableInfo("answerDistanceNear"))}
                    />
                </InlineFeedback>.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-distance-question-far" maxWidth="xl">
        <Block id="distance-question-far" padding="md">
            <EditableParagraph id="para-distance-question-far" blockId="distance-question-far">
                Now one that runs off the edge of this grid: a courier travels from (1, 2)
                to (6, 14), so the distance is{" "}
                <InlineFeedback
                    varName="answerDistanceHop"
                    correctValue="13"
                    position="terminal"
                    successMessage="— nicely done. The legs are 5 and 12, giving 25 + 144 = 169, and √169 = 13"
                    failureMessage="— not yet."
                    hint="Count the across gap and the up gap first: 6 − 1 and 14 − 2"
                    reviewBlockId="distance-formula"
                    reviewLabel="Look at the formula again"
                >
                    <InlineClozeInput
                        varName="answerDistanceHop"
                        correctAnswer="13"
                        {...clozePropsFromDefinition(getVariableInfo("answerDistanceHop"))}
                    />
                </InlineFeedback>.
            </EditableParagraph>
        </Block>
    </StackLayout>,
];
