/**
 * Section 4 — Straight Lines
 *
 * Constructive figure: the student builds the line by dragging the two points
 * it passes through. The staircase between them (run, then rise) is drawn from
 * the model, so the gradient is read off the grid rather than recited, and the
 * y-intercept marker shows where c comes from.
 */

import React, { useRef, useState, type ReactElement } from "react";
import { StackLayout } from "@/components/layouts";
import { Block } from "@/components/templates";
import {
    EditableH2,
    EditableParagraph,
    InlineClozeInput,
    InlineFeedback,
    InlineLinkedHighlight,
    InteractionHintSequence,
} from "@/components/atoms";
import { Figure, FormulaBlock } from "@/components/molecules";
import { useVar, useSetVar } from "@/stores";
import { clamp } from "@/lib/motion";
import {
    getVariableInfo,
    clozePropsFromDefinition,
    linkedHighlightPropsFromDefinition,
} from "../variables";
import {
    ACCENT,
    ACCENT_TWO,
    DragHandle,
    EASE_150,
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

const DEFAULT_FIRST: [number, number] = [-2, -3];
const DEFAULT_SECOND: [number, number] = [2, 5];

const GRID = makeGrid({ xMin: -6, xMax: 6, yMin: -6, yMax: 6 });
const SHADOW_ID = "line-handle-shadow";

const tidy = (value: number) =>
    Number.isInteger(value) ? `${value}` : value.toFixed(2);

/** Clip y = mx + c to the visible grid rectangle. */
function clipLine(gradient: number, intercept: number): [number, number][] {
    const candidates: [number, number][] = [];
    const yAtXMin = gradient * GRID.xMin + intercept;
    const yAtXMax = gradient * GRID.xMax + intercept;
    if (yAtXMin >= GRID.yMin && yAtXMin <= GRID.yMax) candidates.push([GRID.xMin, yAtXMin]);
    if (yAtXMax >= GRID.yMin && yAtXMax <= GRID.yMax) candidates.push([GRID.xMax, yAtXMax]);
    if (gradient !== 0) {
        const xAtYMin = (GRID.yMin - intercept) / gradient;
        const xAtYMax = (GRID.yMax - intercept) / gradient;
        if (xAtYMin > GRID.xMin && xAtYMin < GRID.xMax) candidates.push([xAtYMin, GRID.yMin]);
        if (xAtYMax > GRID.xMin && xAtYMax < GRID.xMax) candidates.push([xAtYMax, GRID.yMax]);
    }
    return candidates.slice(0, 2);
}

// ── Drawing ──────────────────────────────────────────────────────────────────

function StraightLineDrawing() {
    const setVar = useSetVar();
    const firstX = useVar<number>("lineFirstX", DEFAULT_FIRST[0]);
    const firstY = useVar<number>("lineFirstY", DEFAULT_FIRST[1]);
    const secondX = useVar<number>("lineSecondX", DEFAULT_SECOND[0]);
    const secondY = useVar<number>("lineSecondY", DEFAULT_SECOND[1]);
    const { opacity, weight, isActive, hoverProps } = useHighlight("lineHighlight");

    const [draggingFirst, setDraggingFirst] = useState(false);
    const [draggingSecond, setDraggingSecond] = useState(false);
    const draggingFirstRef = useRef(false);
    const draggingSecondRef = useRef(false);
    const svgRef = useRef<SVGSVGElement>(null);

    const run = secondX - firstX;
    const rise = secondY - firstY;
    const gradient = rise / run;
    const intercept = firstY - gradient * firstX;

    /** Keep the two x values apart so the line never becomes vertical. */
    const separateX = (candidate: number, otherX: number, current: number) => {
        const snapped = clamp(Math.round(candidate), GRID.xMin, GRID.xMax);
        if (snapped !== otherX) return snapped;
        const pushed = current >= otherX ? otherX + 1 : otherX - 1;
        return clamp(pushed, GRID.xMin, GRID.xMax);
    };

    const moveFirst = (event: React.PointerEvent<SVGCircleElement>) => {
        if (!draggingFirstRef.current) return;
        const point = svgPointFromEvent(event, svgRef.current, GRID.width, GRID.height);
        setVar("lineFirstX", separateX(GRID.fromX(point.x), secondX, firstX));
        setVar("lineFirstY", clamp(Math.round(GRID.fromY(point.y)), GRID.yMin, GRID.yMax));
    };

    const moveSecond = (event: React.PointerEvent<SVGCircleElement>) => {
        if (!draggingSecondRef.current) return;
        const point = svgPointFromEvent(event, svgRef.current, GRID.width, GRID.height);
        setVar("lineSecondX", separateX(GRID.fromX(point.x), firstX, secondX));
        setVar("lineSecondY", clamp(Math.round(GRID.fromY(point.y)), GRID.yMin, GRID.yMax));
    };

    const p1x = GRID.toX(firstX);
    const p1y = GRID.toY(firstY);
    const p2x = GRID.toX(secondX);
    const p2y = GRID.toY(secondY);
    const cornerX = p2x;
    const cornerY = p1y;

    const ends = clipLine(gradient, intercept);
    const interceptVisible = intercept >= GRID.yMin && intercept <= GRID.yMax;

    return (
        <svg
            ref={svgRef}
            viewBox={`0 0 ${GRID.width} ${GRID.height}`}
            className="block w-full select-none"
            role="img"
            aria-label="A straight line through two draggable points, with the run and rise staircase between them"
        >
            <defs>
                <HandleShadow id={SHADOW_ID} />
            </defs>

            {/* Readout strip — above the plot. */}
            <g fontSize="12" style={{ fontVariantNumeric: "tabular-nums", ...EASE_150 }}>
                <text x="24" y="30" fill={INK_STRUCTURE} opacity={opacity("run")}>
                    {`run = ${run}`}
                </text>
                <text x="130" y="30" fill={ACCENT} opacity={opacity("rise")}>
                    {`rise = ${rise}`}
                </text>
                <text x="24" y="56" fill={ACCENT_TWO} opacity={opacity("intercept")}>
                    {`y-intercept = ${tidy(intercept)}`}
                </text>
                <text x="536" y="56" fill={ACCENT} textAnchor="end" opacity={opacity("rise")}>
                    {`gradient = ${rise} ÷ ${run} = ${tidy(gradient)}`}
                </text>
            </g>

            <GridBackdrop grid={GRID} labelStep={2} dim={opacity("__structure")} />

            {/* The line itself — one accent hue, heaviest stroke. */}
            {ends.length === 2 && (
                <line
                    x1={GRID.toX(ends[0][0])}
                    y1={GRID.toY(ends[0][1])}
                    x2={GRID.toX(ends[1][0])}
                    y2={GRID.toY(ends[1][1])}
                    stroke={ACCENT}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    opacity={opacity("__line")}
                    style={EASE_150}
                />
            )}

            {/* RUN — the step across. */}
            <g {...hoverProps("run")} opacity={opacity("run")} style={EASE_150}>
                <Halo active={isActive("run")}>
                    <line
                        x1={p1x}
                        y1={p1y}
                        x2={cornerX}
                        y2={cornerY}
                        stroke={INK_STRUCTURE}
                        strokeWidth={weight("run", 2) + 6}
                        strokeLinecap="round"
                    />
                </Halo>
                <line
                    x1={p1x}
                    y1={p1y}
                    x2={cornerX}
                    y2={cornerY}
                    stroke={INK_STRUCTURE}
                    strokeWidth={weight("run", 2)}
                    strokeLinecap="round"
                    strokeDasharray="5 4"
                />
                <text
                    x={(p1x + cornerX) / 2}
                    y={rise >= 0 ? cornerY + 18 : cornerY - 10}
                    fill={INK}
                    fontSize="12"
                    textAnchor="middle"
                    style={{ fontVariantNumeric: "tabular-nums" }}
                >
                    {`run ${run}`}
                </text>
            </g>

            {/* RISE — the step up. */}
            {rise !== 0 && (
                <g {...hoverProps("rise")} opacity={opacity("rise")} style={EASE_150}>
                    <Halo active={isActive("rise")}>
                        <line
                            x1={cornerX}
                            y1={cornerY}
                            x2={p2x}
                            y2={p2y}
                            stroke={ACCENT}
                            strokeWidth={weight("rise", 2.5) + 6}
                            strokeLinecap="round"
                        />
                    </Halo>
                    <line
                        x1={cornerX}
                        y1={cornerY}
                        x2={p2x}
                        y2={p2y}
                        stroke={ACCENT}
                        strokeWidth={weight("rise", 2.5)}
                        strokeLinecap="round"
                        strokeDasharray="5 4"
                    />
                    <text
                        x={run >= 0 ? cornerX + 10 : cornerX - 10}
                        y={(cornerY + p2y) / 2 + 4}
                        fill={INK}
                        fontSize="12"
                        textAnchor={run >= 0 ? "start" : "end"}
                        style={{ fontVariantNumeric: "tabular-nums" }}
                    >
                        {`rise ${rise}`}
                    </text>
                </g>
            )}

            {/* Where the line crosses the y-axis — the partner quantity. */}
            {interceptVisible && (
                <g {...hoverProps("intercept")} opacity={opacity("intercept")} style={EASE_150}>
                    <Halo active={isActive("intercept")}>
                        <circle cx={GRID.toX(0)} cy={GRID.toY(intercept)} r="13" fill={ACCENT_TWO} />
                    </Halo>
                    <circle
                        cx={GRID.toX(0)}
                        cy={GRID.toY(intercept)}
                        r={isActive("intercept") ? 9 : 7}
                        fill={ACCENT_TWO}
                        stroke="#FFFFFF"
                        strokeWidth="1.5"
                        style={{ transition: "r 150ms ease" }}
                    />
                </g>
            )}

            {/* The two draggable points that define the line. */}
            <text
                x={p1x}
                y={firstY >= 5 ? p1y + 26 : p1y - 18}
                fill={INK}
                fontSize="12"
                textAnchor="middle"
                style={{ fontVariantNumeric: "tabular-nums" }}
            >
                {`(${firstX}, ${firstY})`}
            </text>
            <DragHandle
                x={p1x}
                y={p1y}
                shadowId={SHADOW_ID}
                dragging={draggingFirst}
                onDragMove={moveFirst}
                onDraggingChange={(value) => {
                    draggingFirstRef.current = value;
                    setDraggingFirst(value);
                }}
            />

            <text
                x={p2x}
                y={secondY >= 5 ? p2y + 26 : p2y - 18}
                fill={INK}
                fontSize="12"
                textAnchor="middle"
                style={{ fontVariantNumeric: "tabular-nums" }}
            >
                {`(${secondX}, ${secondY})`}
            </text>
            <DragHandle
                x={p2x}
                y={p2y}
                shadowId={SHADOW_ID}
                dragging={draggingSecond}
                onDragMove={moveSecond}
                onDraggingChange={(value) => {
                    draggingSecondRef.current = value;
                    setDraggingSecond(value);
                }}
            />
        </svg>
    );
}

function StraightLineFigure() {
    const setVar = useSetVar();
    return (
        <Figure
            id="straight-line-builder"
            onReset={() => {
                setVar("lineFirstX", DEFAULT_FIRST[0]);
                setVar("lineFirstY", DEFAULT_FIRST[1]);
                setVar("lineSecondX", DEFAULT_SECOND[0]);
                setVar("lineSecondY", DEFAULT_SECOND[1]);
                setVar("lineHighlight", "");
            }}
            caption="Both teal points are yours to move. The dashed staircase counts the run and the rise between them, and the indigo dot marks where the line crosses the y-axis."
        >
            <StraightLineDrawing />
            <InteractionHintSequence
                hintKey="straight-line-point-drag"
                steps={[
                    {
                        gesture: "drag",
                        label: "Drag either teal point to reshape the line",
                        position: { x: "60%", y: "24%" },
                        dragPath: {
                            type: "line",
                            startOffset: { x: 20, y: -16 },
                            endOffset: { x: -22, y: 18 },
                        },
                    },
                ]}
            />
        </Figure>
    );
}

// ── Live formulas ────────────────────────────────────────────────────────────

function GradientFormula() {
    const firstX = useVar<number>("lineFirstX", DEFAULT_FIRST[0]);
    const firstY = useVar<number>("lineFirstY", DEFAULT_FIRST[1]);
    const secondX = useVar<number>("lineSecondX", DEFAULT_SECOND[0]);
    const secondY = useVar<number>("lineSecondY", DEFAULT_SECOND[1]);
    const run = secondX - firstX;
    const rise = secondY - firstY;

    return (
        <FormulaBlock
            latex={
                `m = \\frac{y_2 - y_1}{x_2 - x_1} = \\frac{${rise}}{${run}} ` +
                `= \\clr{gradient}{${tidy(rise / run)}}`
            }
            colorMap={{ gradient: ACCENT }}
        />
    );
}

function LineEquationFormula() {
    const firstX = useVar<number>("lineFirstX", DEFAULT_FIRST[0]);
    const firstY = useVar<number>("lineFirstY", DEFAULT_FIRST[1]);
    const secondX = useVar<number>("lineSecondX", DEFAULT_SECOND[0]);
    const secondY = useVar<number>("lineSecondY", DEFAULT_SECOND[1]);
    const gradient = (secondY - firstY) / (secondX - firstX);
    const intercept = firstY - gradient * firstX;
    const sign = intercept < 0 ? "-" : "+";

    return (
        <FormulaBlock
            latex={
                `y = \\clr{gradient}{${tidy(gradient)}}x ${sign} ` +
                `\\clr{intercept}{${tidy(Math.abs(intercept))}}`
            }
            colorMap={{ gradient: ACCENT, intercept: ACCENT_TWO }}
        />
    );
}

// ── Blocks ───────────────────────────────────────────────────────────────────

export const straightLinesBlocks: ReactElement[] = [
    <StackLayout key="layout-part-two-heading" maxWidth="xl">
        <Block id="part-two-heading" padding="lg">
            <EditableH2 id="h2-part-two-heading" blockId="part-two-heading">
                Part 2 · Straight Lines
            </EditableH2>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-lines-setup" maxWidth="xl">
        <Block id="lines-setup" padding="sm">
            <EditableParagraph id="para-lines-setup" blockId="lines-setup">
                Two points are all a straight line needs. Drag either teal point and the
                staircase between them redraws itself: one step across, which is the{" "}
                <InlineLinkedHighlight
                    varName="lineHighlight"
                    highlightId="run"
                    {...linkedHighlightPropsFromDefinition(getVariableInfo("lineHighlight"))}
                >
                    run
                </InlineLinkedHighlight>
                , and one step up, which is the rise. Their ratio is the gradient, the
                single number that decides how steep the line is.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-lines-figure" maxWidth="xl">
        <Block id="lines-figure" padding="sm" hasVisualization>
            <StraightLineFigure />
        </Block>
    </StackLayout>,

    <StackLayout key="layout-lines-gradient-formula" maxWidth="xl">
        <Block id="lines-gradient-formula" padding="md">
            <GradientFormula />
        </Block>
    </StackLayout>,

    <StackLayout key="layout-lines-insight" maxWidth="xl">
        <Block id="lines-insight" padding="sm">
            <EditableParagraph id="para-lines-insight" blockId="lines-insight">
                Now watch the indigo dot. Lift both points by the same amount and the
                gradient does not budge, yet the height at which the line{" "}
                <InlineLinkedHighlight
                    varName="lineHighlight"
                    highlightId="intercept"
                    {...linkedHighlightPropsFromDefinition(getVariableInfo("lineHighlight"))}
                >
                    crosses the y-axis
                </InlineLinkedHighlight>{" "}
                slides with them. That crossing is c, and steepness plus crossing is the
                entire equation.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-lines-equation-formula" maxWidth="xl">
        <Block id="lines-equation-formula" padding="md">
            <LineEquationFormula />
        </Block>
    </StackLayout>,

    <StackLayout key="layout-lines-question-gradient" maxWidth="xl">
        <Block id="lines-question-gradient" padding="md">
            <EditableParagraph id="para-lines-question-gradient" blockId="lines-question-gradient">
                A cable car climbs in a straight line through (1, 4) and (4, 13), so its
                gradient is{" "}
                <InlineFeedback
                    varName="answerLineGradient"
                    correctValue="3"
                    position="terminal"
                    successMessage="— spot on. The rise is 13 − 4 = 9 and the run is 4 − 1 = 3, so the line climbs 3 for every 1 across"
                    failureMessage="— have another look."
                    hint="Gradient is rise divided by run, in that order"
                    visualizationHint={{
                        blockId: "lines-figure",
                        hintKey: "lines-feedback-hint",
                        label: "Discover it yourself",
                        resetVars: {
                            lineFirstX: -2,
                            lineFirstY: -3,
                            lineSecondX: 2,
                            lineSecondY: 5,
                            lineHighlight: "",
                        },
                        steps: [
                            {
                                gesture: "drag-horizontal",
                                label: "Slide the upper teal point left onto the y-axis — the run shrinks to 2",
                                position: { x: "60%", y: "24%" },
                                completionVar: "lineSecondX",
                                completionValue: 0,
                                completionTolerance: 0.4,
                            },
                            {
                                gesture: "drag-vertical",
                                label: "Now drop it to a rise of 6 and read the gradient in the corner",
                                position: { x: "50%", y: "24%" },
                                completionVar: "lineSecondY",
                                completionValue: 3,
                                completionTolerance: 0.4,
                            },
                        ],
                    }}
                >
                    <InlineClozeInput
                        varName="answerLineGradient"
                        correctAnswer="3"
                        {...clozePropsFromDefinition(getVariableInfo("answerLineGradient"))}
                    />
                </InlineFeedback>.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-lines-question-intercept" maxWidth="xl">
        <Block id="lines-question-intercept" padding="md">
            <EditableParagraph id="para-lines-question-intercept" blockId="lines-question-intercept">
                Follow that same cable car back to the y-axis and its equation turns out
                to be y = 3x +{" "}
                <InlineFeedback
                    varName="answerLineIntercept"
                    correctValue="1"
                    position="terminal"
                    successMessage="— yes. Stepping back from (1, 4) by one across drops you 3 down, landing on (0, 1)"
                    failureMessage="— not quite."
                    hint="Put x = 1 and y = 4 into y = 3x + c and see what c has to be"
                    reviewBlockId="lines-equation-formula"
                    reviewLabel="Look at the equation again"
                >
                    <InlineClozeInput
                        varName="answerLineIntercept"
                        correctAnswer="1"
                        {...clozePropsFromDefinition(getVariableInfo("answerLineIntercept"))}
                    />
                </InlineFeedback>.
            </EditableParagraph>
        </Block>
    </StackLayout>,
];
