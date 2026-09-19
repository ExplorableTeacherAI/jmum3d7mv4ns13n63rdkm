/**
 * Section 4 — Straight Lines
 *
 * Constructive figure with two ways in: the student can drag the two points
 * the line passes through, or drive m and c straight from the sliders under
 * the grid. Both write the SAME two store variables (lineGradient,
 * lineIntercept), so the staircase, the equation and the sliders can never
 * disagree — the points simply ride the line at their own x anchors.
 */

import React, { useRef, useState, type ReactElement } from "react";
import { StackLayout } from "@/components/layouts";
import { Block } from "@/components/templates";
import {
    EditableH2,
    EditableParagraph,
    InlineClozeInput,
    InlineFeedback,
    InlineFormula,
    InlineLinkedHighlight,
    InlineTooltip,
    InteractionHintSequence,
} from "@/components/atoms";
import { Figure, FigureSlider, FormulaBlock } from "@/components/molecules";
import { useVar, useSetVar } from "@/stores";
import { clamp } from "@/lib/motion";
import {
    getVariableInfo,
    clozePropsFromDefinition,
    linkedHighlightPropsFromDefinition,
    numberPropsFromDefinition,
    scrubVarsFromDefinitions,
} from "../variables";
import {
    ACCENT,
    ACCENT_TWO,
    DragHandle,
    EASE_150,
    GAP_ACROSS,
    GAP_UP,
    GridBackdrop,
    Halo,
    HandleShadow,
    INK,
    makeGrid,
    svgPointFromEvent,
    useHighlight,
} from "./coordinateGrid";

// ── Model ────────────────────────────────────────────────────────────────────

const DEFAULT_GRADIENT = 2;
const DEFAULT_INTERCEPT = 1;
const DEFAULT_FIRST_X = -2;
const DEFAULT_SECOND_X = 2;
const LIMIT = 6; // both m and c live in [-6, 6]

const GRID = makeGrid({ xMin: -6, xMax: 6, yMin: -6, yMax: 6 });
const SHADOW_ID = "line-handle-shadow";

const round6 = (value: number) => Math.round(value * 1e6) / 1e6;

const tidy = (value: number) => {
    const rounded = round6(value);
    return Number.isInteger(rounded) ? `${rounded}` : rounded.toFixed(2);
};

/** The x values for which the line still has a y on the visible grid. */
function visibleXWindow(gradient: number, intercept: number): [number, number] {
    if (gradient === 0) return [GRID.xMin, GRID.xMax];
    const a = (GRID.yMin - intercept) / gradient;
    const b = (GRID.yMax - intercept) / gradient;
    return [
        Math.max(GRID.xMin, Math.min(a, b)),
        Math.min(GRID.xMax, Math.max(a, b)),
    ];
}

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
    const gradient = useVar<number>("lineGradient", DEFAULT_GRADIENT);
    const intercept = useVar<number>("lineIntercept", DEFAULT_INTERCEPT);
    const firstAnchor = useVar<number>("lineFirstX", DEFAULT_FIRST_X);
    const secondAnchor = useVar<number>("lineSecondX", DEFAULT_SECOND_X);
    const { opacity, weight, isActive, hoverProps } = useHighlight("lineHighlight");

    const [draggingFirst, setDraggingFirst] = useState(false);
    const [draggingSecond, setDraggingSecond] = useState(false);
    const draggingFirstRef = useRef(false);
    const draggingSecondRef = useRef(false);
    const svgRef = useRef<SVGSVGElement>(null);

    // The points ride the line: their x is theirs, their y always obeys y = mx + c.
    const [windowLo, windowHi] = visibleXWindow(gradient, intercept);
    let firstX = clamp(firstAnchor, windowLo, windowHi);
    let secondX = clamp(secondAnchor, windowLo, windowHi);
    if (Math.abs(secondX - firstX) < 1) {
        if (secondX >= firstX) secondX = Math.min(windowHi, firstX + 1);
        else secondX = Math.max(windowLo, firstX - 1);
        if (Math.abs(secondX - firstX) < 1) firstX = secondX >= firstX ? secondX - 1 : secondX + 1;
    }
    const firstY = round6(gradient * firstX + intercept);
    const secondY = round6(gradient * secondX + intercept);

    const run = round6(secondX - firstX);
    const rise = round6(secondY - firstY);

    /** A drag pivots the line about the OTHER point, then re-anchors this one. */
    const dragPoint = (
        event: React.PointerEvent<SVGCircleElement>,
        active: React.MutableRefObject<boolean>,
        anchorVar: "lineFirstX" | "lineSecondX",
        currentX: number,
        pivotX: number,
        pivotY: number,
    ) => {
        if (!active.current) return;
        const point = svgPointFromEvent(event, svgRef.current, GRID.width, GRID.height);
        let targetX = clamp(Math.round(GRID.fromX(point.x)), GRID.xMin, GRID.xMax);
        const targetY = clamp(Math.round(GRID.fromY(point.y)), GRID.yMin, GRID.yMax);
        // Never let the two x values coincide: a vertical line has no gradient.
        if (targetX === pivotX) {
            targetX = clamp(
                currentX >= pivotX ? pivotX + 1 : pivotX - 1,
                GRID.xMin,
                GRID.xMax,
            );
        }
        const newGradient = clamp(round6((targetY - pivotY) / (targetX - pivotX)), -LIMIT, LIMIT);
        const newIntercept = clamp(round6(pivotY - newGradient * pivotX), -LIMIT, LIMIT);
        setVar("lineGradient", newGradient);
        setVar("lineIntercept", newIntercept);
        setVar(anchorVar, targetX);
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
                <text x="24" y="30" fill={GAP_ACROSS} opacity={opacity("run")}>
                    {`run = ${tidy(run)}`}
                </text>
                <text x="150" y="30" fill={GAP_UP} opacity={opacity("rise")}>
                    {`rise = ${tidy(rise)}`}
                </text>
                <text x="24" y="56" fill={ACCENT_TWO} opacity={opacity("intercept")}>
                    {`c = ${tidy(intercept)}`}
                </text>
                <text x="536" y="56" fill={ACCENT} textAnchor="end" opacity={opacity("rise")}>
                    {`m = ${tidy(rise)} ÷ ${tidy(run)} = ${tidy(gradient)}`}
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
                        stroke={GAP_ACROSS}
                        strokeWidth={weight("run", 2) + 6}
                        strokeLinecap="round"
                    />
                </Halo>
                <line
                    x1={p1x}
                    y1={p1y}
                    x2={cornerX}
                    y2={cornerY}
                    stroke={GAP_ACROSS}
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
                    {`run ${tidy(run)}`}
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
                            stroke={GAP_UP}
                            strokeWidth={weight("rise", 2.5) + 6}
                            strokeLinecap="round"
                        />
                    </Halo>
                    <line
                        x1={cornerX}
                        y1={cornerY}
                        x2={p2x}
                        y2={p2y}
                        stroke={GAP_UP}
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
                        {`rise ${tidy(rise)}`}
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

            {/* The two draggable points that ride the line. */}
            <text
                x={p1x}
                y={firstY >= 5 ? p1y + 26 : p1y - 18}
                fill={INK}
                fontSize="12"
                textAnchor="middle"
                style={{ fontVariantNumeric: "tabular-nums" }}
            >
                {`(${tidy(firstX)}, ${tidy(firstY)})`}
            </text>
            <DragHandle
                x={p1x}
                y={p1y}
                shadowId={SHADOW_ID}
                dragging={draggingFirst}
                onDragMove={(event) =>
                    dragPoint(event, draggingFirstRef, "lineFirstX", firstX, secondX, secondY)
                }
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
                {`(${tidy(secondX)}, ${tidy(secondY)})`}
            </text>
            <DragHandle
                x={p2x}
                y={p2y}
                shadowId={SHADOW_ID}
                dragging={draggingSecond}
                onDragMove={(event) =>
                    dragPoint(event, draggingSecondRef, "lineSecondX", secondX, firstX, firstY)
                }
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
                setVar("lineGradient", DEFAULT_GRADIENT);
                setVar("lineIntercept", DEFAULT_INTERCEPT);
                setVar("lineFirstX", DEFAULT_FIRST_X);
                setVar("lineSecondX", DEFAULT_SECOND_X);
                setVar("lineHighlight", "");
            }}
            caption="Both teal points are yours to move, and the two sliders drive m and c directly. The dashed staircase counts the run and the rise; the indigo dot marks where the line crosses the y-axis."
        >
            <StraightLineDrawing />
            <div className="space-y-3 px-6 pb-5">
                <FigureSlider
                    varName="lineGradient"
                    label="Gradient m"
                    {...numberPropsFromDefinition(getVariableInfo("lineGradient"))}
                    formatValue={(v) => v.toFixed(1)}
                />
                <FigureSlider
                    varName="lineIntercept"
                    label="Intercept c"
                    {...numberPropsFromDefinition(getVariableInfo("lineIntercept"))}
                    formatValue={(v) => v.toFixed(1)}
                />
            </div>
            <InteractionHintSequence
                hintKey="straight-line-point-drag"
                steps={[
                    {
                        gesture: "drag",
                        label: "Drag either teal point to reshape the line",
                        position: { x: "60%", y: "20%" },
                        dragPath: {
                            type: "line",
                            startOffset: { x: 20, y: -16 },
                            endOffset: { x: -22, y: 18 },
                        },
                    },
                    {
                        gesture: "drag-horizontal",
                        label: "Or set m and c straight from the sliders",
                        position: { x: "50%", y: "85%" },
                        dragPath: {
                            type: "line",
                            startOffset: { x: -30, y: 0 },
                            endOffset: { x: 30, y: 0 },
                        },
                    },
                ]}
            />
        </Figure>
    );
}

// ── Live formulas ────────────────────────────────────────────────────────────

function GradientFormula() {
    const gradient = useVar<number>("lineGradient", DEFAULT_GRADIENT);
    const intercept = useVar<number>("lineIntercept", DEFAULT_INTERCEPT);
    const firstAnchor = useVar<number>("lineFirstX", DEFAULT_FIRST_X);
    const secondAnchor = useVar<number>("lineSecondX", DEFAULT_SECOND_X);
    const [windowLo, windowHi] = visibleXWindow(gradient, intercept);
    const firstX = clamp(firstAnchor, windowLo, windowHi);
    const secondX = clamp(secondAnchor, windowLo, windowHi);
    const run = round6(secondX - firstX);
    const rise = round6(gradient * secondX - gradient * firstX);

    return (
        <FormulaBlock
            latex={
                `\\clr{gradient}{m} = \\frac{\\clr{rise}{y_2 - y_1}}{\\clr{run}{x_2 - x_1}} ` +
                `= \\frac{\\clr{rise}{${tidy(rise)}}}{\\clr{run}{${tidy(run)}}} ` +
                `= \\clr{gradient}{${tidy(gradient)}}`
            }
            colorMap={{ gradient: ACCENT, rise: GAP_UP, run: GAP_ACROSS }}
        />
    );
}

// m and c are scrubbable inside the equation. The sign of c is drawn by the
// equation itself, so the scrubbable number shows its size only.
const LINE_SCRUB_DEFS = scrubVarsFromDefinitions(["lineGradient", "lineIntercept"]);
const LINE_SCRUB_VARS = {
    lineGradient: { ...LINE_SCRUB_DEFS.lineGradient, formatValue: tidy },
    lineIntercept: {
        ...LINE_SCRUB_DEFS.lineIntercept,
        formatValue: (value: number) => tidy(Math.abs(value)),
    },
};

function LineEquationFormula() {
    const intercept = useVar<number>("lineIntercept", DEFAULT_INTERCEPT);
    const sign = intercept < 0 ? "-" : "+";

    return (
        <FormulaBlock
            latex={`y = \\scrub{lineGradient}x ${sign} \\scrub{lineIntercept}`}
            variables={LINE_SCRUB_VARS}
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
                    color={GAP_ACROSS}
                    bgColor="rgba(247, 178, 59, 0.22)"
                >
                    run
                </InlineLinkedHighlight>
                , and one step up, which is the{" "}
                <InlineLinkedHighlight
                    id="link-lines-rise"
                    varName="lineHighlight"
                    highlightId="rise"
                    {...linkedHighlightPropsFromDefinition(getVariableInfo("lineHighlight"))}
                    color={GAP_UP}
                    bgColor="rgba(248, 160, 205, 0.22)"
                >
                    rise
                </InlineLinkedHighlight>
                . Their ratio is the{" "}
                <InlineTooltip
                    id="tooltip-lines-gradient"
                    tooltip="How steep a line is: rise divided by run. A negative gradient means the line falls as you move right."
                >
                    gradient
                </InlineTooltip>
                , the single number that decides how steep the line is.
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
                Now watch the indigo dot. Push the{" "}
                <InlineFormula
                    id="formula-lines-insight-c"
                    latex="\clr{intercept}{c}"
                    colorMap={{ intercept: ACCENT_TWO }}
                />{" "}
                slider on its own and the whole line slides up or down without ever
                changing its steepness, while the{" "}
                <InlineFormula
                    id="formula-lines-insight-m"
                    latex="\clr{gradient}{m}"
                    colorMap={{ gradient: ACCENT }}
                />{" "}
                slider pivots it about that same{" "}
                <InlineLinkedHighlight
                    varName="lineHighlight"
                    highlightId="intercept"
                    {...linkedHighlightPropsFromDefinition(getVariableInfo("lineHighlight"))}
                    color={ACCENT_TWO}
                    bgColor="rgba(142, 144, 245, 0.22)"
                >
                    crossing point
                </InlineLinkedHighlight>
                . Steepness plus crossing is the entire equation.
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
                            lineGradient: 2,
                            lineIntercept: 1,
                            lineFirstX: -2,
                            lineSecondX: 2,
                            lineHighlight: "",
                        },
                        steps: [
                            {
                                gesture: "drag-horizontal",
                                label: "Push the m slider up to 3 — the staircase climbs 3 for every 1 across",
                                position: { x: "50%", y: "85%" },
                                completionVar: "lineGradient",
                                completionValue: 3,
                                completionTolerance: 0.2,
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
                to be{" "}
                <InlineFormula
                    id="formula-lines-question-equation"
                    latex="y = \clr{gradient}{3}x +"
                    colorMap={{ gradient: ACCENT }}
                />{" "}
                <InlineFeedback
                    varName="answerLineIntercept"
                    correctValue="1"
                    position="terminal"
                    successMessage="— yes. Stepping back from (1, 4) by one across drops you 3 down, landing on (0, 1)"
                    failureMessage="— not quite."
                    hint="Put x = 1 and y = 4 into y = 3x + c and see what c has to be"
                    visualizationHint={{
                        blockId: "lines-figure",
                        hintKey: "lines-intercept-feedback-hint",
                        label: "Discover it yourself",
                        resetVars: {
                            lineGradient: 2,
                            lineIntercept: 1,
                            lineFirstX: -2,
                            lineSecondX: 2,
                            lineHighlight: "",
                        },
                        steps: [
                            {
                                gesture: "drag-horizontal",
                                label: "Set the m slider to 3 so the line matches the cable car",
                                position: { x: "50%", y: "82%" },
                                completionVar: "lineGradient",
                                completionValue: 3,
                                completionTolerance: 0.2,
                            },
                            {
                                gesture: "drag-horizontal",
                                label: "Now slide c until the line runs through (1, 4) — read the indigo dot",
                                position: { x: "50%", y: "90%" },
                                completionVar: "lineIntercept",
                                completionValue: 1,
                                completionTolerance: 0.2,
                            },
                        ],
                    }}
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
