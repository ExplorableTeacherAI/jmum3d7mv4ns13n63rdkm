/**
 * Section 5 — Circles
 *
 * Inversion-flavoured figure: the student manipulates the picture (centre and
 * rim) and the ALGEBRA is the thing that responds. Because the equation is
 * rebuilt live from the model, the sign flip inside each bracket and the
 * difference between r and r-squared are watched rather than recited.
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
    makeGrid,
    svgPointFromEvent,
    useHighlight,
} from "./coordinateGrid";

// ── Model ────────────────────────────────────────────────────────────────────

const DEFAULT_CENTRE: [number, number] = [1, -2];
const DEFAULT_RADIUS = 4;
const CENTRE_LIMIT = 3;
const MIN_RADIUS = 1;
const MAX_RADIUS = 5;

const GRID = makeGrid({ xMin: -8, xMax: 8, yMin: -8, yMax: 8 });
const SHADOW_ID = "circle-handle-shadow";

/** Plain-text bracket, e.g. (x − 1) or (y + 2), with the sign flipped. */
const bracketText = (letter: string, value: number) =>
    value === 0 ? `${letter}²` : `(${letter} ${value > 0 ? "−" : "+"} ${Math.abs(value)})²`;

/** LaTeX version of the same bracket. */
const bracketLatex = (letter: string, value: number) =>
    value === 0 ? `${letter}^2` : `(${letter} ${value > 0 ? "-" : "+"} ${Math.abs(value)})^2`;

// ── Drawing ──────────────────────────────────────────────────────────────────

function CircleDrawing() {
    const setVar = useSetVar();
    const centreX = useVar<number>("circleCentreX", DEFAULT_CENTRE[0]);
    const centreY = useVar<number>("circleCentreY", DEFAULT_CENTRE[1]);
    const radius = useVar<number>("circleRadius", DEFAULT_RADIUS);
    const { opacity, weight, isActive, hoverProps } = useHighlight("circleHighlight");

    // Where the rim handle sits on the circle is a view detail, not a lesson
    // quantity, so it stays local.
    const [rimAngle, setRimAngle] = useState(-0.5);
    const [draggingCentre, setDraggingCentre] = useState(false);
    const [draggingRim, setDraggingRim] = useState(false);
    const draggingCentreRef = useRef(false);
    const draggingRimRef = useRef(false);
    const svgRef = useRef<SVGSVGElement>(null);

    const moveCentre = (event: React.PointerEvent<SVGCircleElement>) => {
        if (!draggingCentreRef.current) return;
        const point = svgPointFromEvent(event, svgRef.current, GRID.width, GRID.height);
        setVar("circleCentreX", clamp(Math.round(GRID.fromX(point.x)), -CENTRE_LIMIT, CENTRE_LIMIT));
        setVar("circleCentreY", clamp(Math.round(GRID.fromY(point.y)), -CENTRE_LIMIT, CENTRE_LIMIT));
    };

    const moveRim = (event: React.PointerEvent<SVGCircleElement>) => {
        if (!draggingRimRef.current) return;
        const point = svgPointFromEvent(event, svgRef.current, GRID.width, GRID.height);
        const dx = GRID.fromX(point.x) - centreX;
        const dy = GRID.fromY(point.y) - centreY;
        if (dx === 0 && dy === 0) return;
        setRimAngle(Math.atan2(dy, dx));
        setVar("circleRadius", clamp(Math.round(Math.hypot(dx, dy)), MIN_RADIUS, MAX_RADIUS));
    };

    const cx = GRID.toX(centreX);
    const cy = GRID.toY(centreY);
    const rimX = GRID.toX(centreX + radius * Math.cos(rimAngle));
    const rimY = GRID.toY(centreY + radius * Math.sin(rimAngle));

    return (
        <svg
            ref={svgRef}
            viewBox={`0 0 ${GRID.width} ${GRID.height}`}
            className="block w-full select-none"
            role="img"
            aria-label="A circle on a grid with a draggable centre and a draggable rim handle"
        >
            <defs>
                <HandleShadow id={SHADOW_ID} />
            </defs>

            {/* Readout strip — above the plot. */}
            <g fontSize="12" style={{ fontVariantNumeric: "tabular-nums", ...EASE_150 }}>
                <text x="24" y="30" fill={ACCENT_TWO} opacity={opacity("centre")}>
                    {`centre (${centreX}, ${centreY})`}
                </text>
                <text x="536" y="30" fill={ACCENT} textAnchor="end" opacity={opacity("radius")}>
                    {`radius = ${radius}`}
                </text>
                <text x="24" y="56" fill={INK}>
                    {`${bracketText("x", centreX)} + ${bracketText("y", centreY)} = ${radius * radius}`}
                </text>
                <text x="536" y="56" fill={ACCENT} textAnchor="end" opacity={opacity("radius")}>
                    {`r² = ${radius * radius}`}
                </text>
            </g>

            <GridBackdrop grid={GRID} labelStep={2} dim={opacity("__structure")} />

            {/* The circle — every point the same distance from the centre. */}
            <g {...hoverProps("radius")} opacity={opacity("radius")} style={EASE_150}>
                <Halo active={isActive("radius")}>
                    <circle
                        cx={cx}
                        cy={cy}
                        r={radius * GRID.unit}
                        fill="none"
                        stroke={ACCENT}
                        strokeWidth={weight("radius", 2.5) + 6}
                    />
                </Halo>
                <circle
                    cx={cx}
                    cy={cy}
                    r={radius * GRID.unit}
                    fill={ACCENT}
                    fillOpacity={isActive("radius") ? 0.12 : 0.06}
                    stroke={ACCENT}
                    strokeWidth={weight("radius", 2.5)}
                />
                {/* The radius spoke — heaviest stroke on the page. */}
                <line
                    x1={cx}
                    y1={cy}
                    x2={rimX}
                    y2={rimY}
                    stroke={ACCENT}
                    strokeWidth={weight("radius", 3.5)}
                    strokeLinecap="round"
                />
                <text
                    x={(cx + rimX) / 2}
                    y={(cy + rimY) / 2 - 10}
                    fill={INK}
                    fontSize="12"
                    textAnchor="middle"
                    style={{ fontVariantNumeric: "tabular-nums" }}
                >
                    {`r = ${radius}`}
                </text>
            </g>

            {/* The centre — the partner quantity, draggable. */}
            <g {...hoverProps("centre")} opacity={opacity("centre")} style={EASE_150}>
                <Halo active={isActive("centre")}>
                    <circle cx={cx} cy={cy} r="15" fill={ACCENT_TWO} />
                </Halo>
                <text
                    x={cx}
                    y={cy + 26}
                    fill={INK}
                    fontSize="12"
                    textAnchor="middle"
                    style={{ fontVariantNumeric: "tabular-nums" }}
                >
                    {`(${centreX}, ${centreY})`}
                </text>
                <DragHandle
                    x={cx}
                    y={cy}
                    color={ACCENT_TWO}
                    radius={8}
                    shadowId={SHADOW_ID}
                    dragging={draggingCentre}
                    onDragMove={moveCentre}
                    onDraggingChange={(value) => {
                        draggingCentreRef.current = value;
                        setDraggingCentre(value);
                    }}
                />
            </g>

            {/* The rim handle — stretches the radius. */}
            <DragHandle
                x={rimX}
                y={rimY}
                radius={9}
                shadowId={SHADOW_ID}
                dragging={draggingRim}
                onDragMove={moveRim}
                onDraggingChange={(value) => {
                    draggingRimRef.current = value;
                    setDraggingRim(value);
                }}
            />
        </svg>
    );
}

function CircleFigure() {
    const setVar = useSetVar();
    return (
        <Figure
            id="circle-equation-builder"
            onReset={() => {
                setVar("circleCentreX", DEFAULT_CENTRE[0]);
                setVar("circleCentreY", DEFAULT_CENTRE[1]);
                setVar("circleRadius", DEFAULT_RADIUS);
                setVar("circleHighlight", "");
            }}
            caption="The teal handle on the rim stretches the radius; the indigo dot carries the whole circle to a new centre. The equation in the corner is rebuilt from scratch every time you move either one."
        >
            <CircleDrawing />
            <InteractionHintSequence
                hintKey="circle-rim-drag"
                steps={[
                    {
                        gesture: "drag",
                        label: "Drag the teal rim handle to stretch the circle",
                        position: { x: "66%", y: "73%" },
                        dragPath: {
                            type: "line",
                            startOffset: { x: -20, y: -12 },
                            endOffset: { x: 22, y: 14 },
                        },
                    },
                    {
                        gesture: "drag",
                        label: "Now drag the indigo centre and watch the brackets change",
                        position: { x: "54%", y: "64%" },
                        dragPath: {
                            type: "line",
                            startOffset: { x: -18, y: 14 },
                            endOffset: { x: 20, y: -16 },
                        },
                    },
                ]}
            />
        </Figure>
    );
}

// ── Live formula ─────────────────────────────────────────────────────────────

function CircleEquationFormula() {
    const centreX = useVar<number>("circleCentreX", DEFAULT_CENTRE[0]);
    const centreY = useVar<number>("circleCentreY", DEFAULT_CENTRE[1]);
    const radius = useVar<number>("circleRadius", DEFAULT_RADIUS);

    return (
        <FormulaBlock
            latex={
                `\\clr{centre}{${bracketLatex("x", centreX)}} + ` +
                `\\clr{centre}{${bracketLatex("y", centreY)}} = ` +
                `\\clr{radius}{${radius}}^2 = ${radius * radius}`
            }
            colorMap={{ centre: ACCENT_TWO, radius: ACCENT }}
        />
    );
}

// ── Blocks ───────────────────────────────────────────────────────────────────

export const circlesBlocks: ReactElement[] = [
    <StackLayout key="layout-part-three-heading" maxWidth="xl">
        <Block id="part-three-heading" padding="lg">
            <EditableH2 id="h2-part-three-heading" blockId="part-three-heading">
                Part 3 · Circles
            </EditableH2>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-circles-setup" maxWidth="xl">
        <Block id="circles-setup" padding="sm">
            <EditableParagraph id="para-circles-setup" blockId="circles-setup">
                A circle is really a promise: every point on it sits the same distance
                from the centre. Drag the teal rim handle to stretch that{" "}
                <InlineLinkedHighlight
                    varName="circleHighlight"
                    highlightId="radius"
                    {...linkedHighlightPropsFromDefinition(getVariableInfo("circleHighlight"))}
                >
                    distance
                </InlineLinkedHighlight>{" "}
                wider, then drag the indigo centre to carry the whole circle somewhere
                else. The equation rewrites itself as you move.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-circles-figure" maxWidth="xl">
        <Block id="circles-figure" padding="sm" hasVisualization>
            <CircleFigure />
        </Block>
    </StackLayout>,

    <StackLayout key="layout-circles-formula" maxWidth="xl">
        <Block id="circles-formula" padding="md">
            <CircleEquationFormula />
        </Block>
    </StackLayout>,

    <StackLayout key="layout-circles-insight" maxWidth="xl">
        <Block id="circles-insight" padding="sm">
            <EditableParagraph id="para-circles-insight" blockId="circles-insight">
                Two details are worth catching. The number inside each bracket carries the
                opposite sign to the coordinate it came from, because the bracket measures
                how far x has travelled from the{" "}
                <InlineLinkedHighlight
                    varName="circleHighlight"
                    highlightId="centre"
                    {...linkedHighlightPropsFromDefinition(getVariableInfo("circleHighlight"))}
                >
                    centre
                </InlineLinkedHighlight>
                . And the number on the right is r², never r, so a circle ending in 25 has
                a radius of 5.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-circles-question" maxWidth="xl">
        <Block id="circles-question" padding="md">
            <EditableParagraph id="para-circles-question" blockId="circles-question">
                A roundabout is described by (x − 2)² + (y + 3)² = 25. Its centre sits at
                x ={" "}
                <InlineFeedback
                    varName="answerCircleCentreX"
                    correctValue="2"
                    position="mid"
                    hint="Read the bracket backwards: (x − 2) means the centre has moved to the right"
                >
                    <InlineClozeInput
                        varName="answerCircleCentreX"
                        correctAnswer="2"
                        {...clozePropsFromDefinition(getVariableInfo("answerCircleCentreX"))}
                    />
                </InlineFeedback>{" "}
                and y ={" "}
                <InlineFeedback
                    varName="answerCircleCentreY"
                    correctValue={["-3", "−3"]}
                    position="mid"
                    hint="A plus inside the bracket means a negative coordinate"
                    visualizationHint={{
                        blockId: "circles-figure",
                        hintKey: "circles-feedback-hint",
                        label: "Discover it yourself",
                        resetVars: {
                            circleCentreX: 1,
                            circleCentreY: -2,
                            circleRadius: 4,
                            circleHighlight: "",
                        },
                        steps: [
                            {
                                gesture: "drag-vertical",
                                label: "Drag the indigo centre down to y = −3 and watch the y bracket",
                                position: { x: "54%", y: "64%" },
                                completionVar: "circleCentreY",
                                completionValue: -3,
                                completionTolerance: 0.4,
                            },
                            {
                                gesture: "drag-horizontal",
                                label: "Now slide it right to x = 2 — the equation should match the question",
                                position: { x: "54%", y: "64%" },
                                completionVar: "circleCentreX",
                                completionValue: 2,
                                completionTolerance: 0.4,
                            },
                        ],
                    }}
                >
                    <InlineClozeInput
                        varName="answerCircleCentreY"
                        correctAnswer={["-3", "−3"]}
                        {...clozePropsFromDefinition(getVariableInfo("answerCircleCentreY"))}
                    />
                </InlineFeedback>
                , and its radius measures{" "}
                <InlineFeedback
                    varName="answerCircleRadius"
                    correctValue="5"
                    position="terminal"
                    successMessage="— exactly. The 25 on the right is r², so the radius itself is √25 = 5"
                    failureMessage="— careful with that last number."
                    hint="25 is the square of the radius, not the radius"
                    reviewBlockId="circles-formula"
                    reviewLabel="Look at the circle equation again"
                >
                    <InlineClozeInput
                        varName="answerCircleRadius"
                        correctAnswer="5"
                        {...clozePropsFromDefinition(getVariableInfo("answerCircleRadius"))}
                    />
                </InlineFeedback>
                {" "}units.
            </EditableParagraph>
        </Block>
    </StackLayout>,
];
