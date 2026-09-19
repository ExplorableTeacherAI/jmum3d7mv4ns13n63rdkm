/**
 * Section 3 — Exactly Halfway (midpoint)
 *
 * Prediction-first: the student commits a meeting marker to the grid BEFORE
 * any midpoint coordinates are shown. Two ropes report the distance to each
 * house, so a marker placed by subtracting coordinates lands visibly off the
 * road and the student sees it fail.
 */

import React, { useRef, useState, type ReactElement } from "react";
import { StackLayout } from "@/components/layouts";
import { Block } from "@/components/templates";
import {
    EditableH3,
    EditableParagraph,
    InlineClozeInput,
    InlineFeedback,
    InlineLinkedHighlight,
    InlineTooltip,
    InteractionHintSequence,
} from "@/components/atoms";
import { Figure, FormulaBlock } from "@/components/molecules";
import { useVar, useSetVar } from "@/stores";
import { clamp } from "@/lib/motion";
import {
    getVariableInfo,
    clozePropsFromDefinition,
    linkedHighlightPropsFromDefinition,
    scrubVarsFromDefinitions,
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
    SUCCESS,
    makeGrid,
    svgPointFromEvent,
    useHighlight,
} from "./coordinateGrid";

// ── Model ────────────────────────────────────────────────────────────────────

const HOME: [number, number] = [-4, 1];
const DEFAULT_FRIEND: [number, number] = [6, 7];
const DEFAULT_MARKER: [number, number] = [-1, 7]; // deliberately not halfway

const GRID = makeGrid({ xMin: -6, xMax: 8, yMin: -3, yMax: 9 });
const SHADOW_ID = "midpoint-handle-shadow";

const snapHalf = (value: number) => Math.round(value * 2) / 2;
const formatLength = (value: number) => value.toFixed(1);
const formatCoord = (value: number) => value.toFixed(1);
const signedTerm = (value: number) => (value < 0 ? `(${value})` : `${value}`);

// ── Drawing ──────────────────────────────────────────────────────────────────

function MidpointDrawing() {
    const setVar = useSetVar();
    const friendX = useVar<number>("midpointFriendX", DEFAULT_FRIEND[0]);
    const friendY = useVar<number>("midpointFriendY", DEFAULT_FRIEND[1]);
    const markerX = useVar<number>("midpointGuessX", DEFAULT_MARKER[0]);
    const markerY = useVar<number>("midpointGuessY", DEFAULT_MARKER[1]);
    const { opacity, weight, isActive, hoverProps } = useHighlight("midpointHighlight");

    const [draggingMarker, setDraggingMarker] = useState(false);
    const [draggingFriend, setDraggingFriend] = useState(false);
    const draggingMarkerRef = useRef(false);
    const draggingFriendRef = useRef(false);
    const svgRef = useRef<SVGSVGElement>(null);

    const trueMidX = (HOME[0] + friendX) / 2;
    const trueMidY = (HOME[1] + friendY) / 2;
    const toHome = Math.hypot(markerX - HOME[0], markerY - HOME[1]);
    const toFriend = Math.hypot(markerX - friendX, markerY - friendY);
    const onMidpoint = Math.abs(markerX - trueMidX) < 0.26 && Math.abs(markerY - trueMidY) < 0.26;
    const equalButOff = !onMidpoint && Math.abs(toHome - toFriend) < 0.3;
    const ropeColor = onMidpoint ? SUCCESS : ACCENT;

    const moveMarker = (event: React.PointerEvent<SVGCircleElement>) => {
        if (!draggingMarkerRef.current) return;
        const point = svgPointFromEvent(event, svgRef.current, GRID.width, GRID.height);
        setVar("midpointGuessX", clamp(snapHalf(GRID.fromX(point.x)), GRID.xMin, GRID.xMax));
        setVar("midpointGuessY", clamp(snapHalf(GRID.fromY(point.y)), GRID.yMin, GRID.yMax));
    };

    const moveFriend = (event: React.PointerEvent<SVGCircleElement>) => {
        if (!draggingFriendRef.current) return;
        const point = svgPointFromEvent(event, svgRef.current, GRID.width, GRID.height);
        setVar("midpointFriendX", clamp(Math.round(GRID.fromX(point.x)), -5, 8));
        setVar("midpointFriendY", clamp(Math.round(GRID.fromY(point.y)), -2, 9));
    };

    const hx = GRID.toX(HOME[0]);
    const hy = GRID.toY(HOME[1]);
    const fx = GRID.toX(friendX);
    const fy = GRID.toY(friendY);
    const mx = GRID.toX(markerX);
    const my = GRID.toY(markerY);

    const status = onMidpoint
        ? "halfway ✓"
        : equalButOff
          ? "equal, but off the road"
          : "not halfway yet";

    return (
        <svg
            ref={svgRef}
            viewBox={`0 0 ${GRID.width} ${GRID.height}`}
            className="block w-full select-none"
            role="img"
            aria-label="Two houses on a grid with a draggable meeting marker between them"
        >
            <defs>
                <HandleShadow id={SHADOW_ID} />
            </defs>

            {/* Readout strip — above the plot. */}
            <g fontSize="12" style={{ fontVariantNumeric: "tabular-nums", ...EASE_150 }}>
                <text x="24" y="30" fill={INK} opacity={opacity("meeting")}>
                    {`marker (${formatCoord(markerX)}, ${formatCoord(markerY)})`}
                </text>
                <text x="536" y="30" fill={onMidpoint ? SUCCESS : INK_STRUCTURE} textAnchor="end">
                    {status}
                </text>
                <text x="24" y="56" fill={ACCENT} opacity={opacity("toHome")}>
                    {`to home = ${formatLength(toHome)}`}
                </text>
                <text x="170" y="56" fill={ACCENT} opacity={opacity("toFriend")}>
                    {`to friend = ${formatLength(toFriend)}`}
                </text>
            </g>

            <GridBackdrop grid={GRID} labelStep={2} dim={opacity("__structure")} />

            {/* The road between the two houses — quiet structure. */}
            <g opacity={opacity("__structure")} style={EASE_150}>
                <line
                    x1={hx}
                    y1={hy}
                    x2={fx}
                    y2={fy}
                    stroke={INK_STRUCTURE}
                    strokeWidth="2"
                    strokeLinecap="round"
                />
            </g>

            {/* Rope to home */}
            <g {...hoverProps("toHome")} opacity={opacity("toHome")} style={EASE_150}>
                <Halo active={isActive("toHome")}>
                    <line
                        x1={mx}
                        y1={my}
                        x2={hx}
                        y2={hy}
                        stroke={ropeColor}
                        strokeWidth={weight("toHome", 2.5) + 6}
                        strokeLinecap="round"
                    />
                </Halo>
                <line
                    x1={mx}
                    y1={my}
                    x2={hx}
                    y2={hy}
                    stroke={ropeColor}
                    strokeWidth={weight("toHome", 2.5)}
                    strokeLinecap="round"
                    strokeDasharray="6 5"
                />
            </g>

            {/* Rope to friend */}
            <g {...hoverProps("toFriend")} opacity={opacity("toFriend")} style={EASE_150}>
                <Halo active={isActive("toFriend")}>
                    <line
                        x1={mx}
                        y1={my}
                        x2={fx}
                        y2={fy}
                        stroke={ropeColor}
                        strokeWidth={weight("toFriend", 2.5) + 6}
                        strokeLinecap="round"
                    />
                </Halo>
                <line
                    x1={mx}
                    y1={my}
                    x2={fx}
                    y2={fy}
                    stroke={ropeColor}
                    strokeWidth={weight("toFriend", 2.5)}
                    strokeLinecap="round"
                    strokeDasharray="6 5"
                />
            </g>

            {/* Home — fixed. */}
            <circle cx={hx} cy={hy} r="6" fill={INK_STRUCTURE} />
            <text x={hx} y={hy + 22} fill={INK} fontSize="12" textAnchor="middle">
                home (-4, 1)
            </text>

            {/* Friend's house — draggable, second hue. */}
            <text
                x={fx}
                y={friendY >= 8 ? fy + 26 : fy - 20}
                fill={INK}
                fontSize="12"
                textAnchor="middle"
                style={{ fontVariantNumeric: "tabular-nums" }}
            >
                {`friend (${friendX}, ${friendY})`}
            </text>
            <DragHandle
                x={fx}
                y={fy}
                color={ACCENT_TWO}
                radius={8}
                shadowId={SHADOW_ID}
                dragging={draggingFriend}
                onDragMove={moveFriend}
                onDraggingChange={(value) => {
                    draggingFriendRef.current = value;
                    setDraggingFriend(value);
                }}
            />

            {/* The meeting marker — the student's committed guess. */}
            <g {...hoverProps("meeting")}>
                <DragHandle
                    x={mx}
                    y={my}
                    color={onMidpoint ? SUCCESS : ACCENT}
                    radius={10}
                    shadowId={SHADOW_ID}
                    dragging={draggingMarker}
                    onDragMove={moveMarker}
                    onDraggingChange={(value) => {
                        draggingMarkerRef.current = value;
                        setDraggingMarker(value);
                    }}
                />
            </g>
        </svg>
    );
}

function MidpointFigure() {
    const setVar = useSetVar();
    return (
        <Figure
            id="midpoint-meeting"
            onReset={() => {
                setVar("midpointFriendX", DEFAULT_FRIEND[0]);
                setVar("midpointFriendY", DEFAULT_FRIEND[1]);
                setVar("midpointGuessX", DEFAULT_MARKER[0]);
                setVar("midpointGuessY", DEFAULT_MARKER[1]);
                setVar("midpointHighlight", "");
            }}
            caption="The big teal marker is your guess at the meeting spot. The two dashed ropes measure it against each house, and both turn green the moment it is genuinely halfway."
        >
            <MidpointDrawing />
            <InteractionHintSequence
                hintKey="midpoint-marker-drag"
                steps={[
                    {
                        gesture: "drag",
                        label: "Drag the teal marker to where you think halfway is",
                        position: { x: "41%", y: "30%" },
                        dragPath: {
                            type: "line",
                            startOffset: { x: -18, y: -14 },
                            endOffset: { x: 24, y: 20 },
                        },
                    },
                ]}
            />
        </Figure>
    );
}

// ── Live formula ─────────────────────────────────────────────────────────────

// The friend's coordinates are scrubbable inside the formula; negatives keep
// their brackets so (-4) + (-3) never reads as a subtraction.
const FRIEND_SCRUB_DEFS = scrubVarsFromDefinitions(["midpointFriendX", "midpointFriendY"]);
const FRIEND_SCRUB_VARS = {
    midpointFriendX: { ...FRIEND_SCRUB_DEFS.midpointFriendX, formatValue: signedTerm },
    midpointFriendY: { ...FRIEND_SCRUB_DEFS.midpointFriendY, formatValue: signedTerm },
};

function MidpointFormula() {
    const friendX = useVar<number>("midpointFriendX", DEFAULT_FRIEND[0]);
    const friendY = useVar<number>("midpointFriendY", DEFAULT_FRIEND[1]);
    const midX = (HOME[0] + friendX) / 2;
    const midY = (HOME[1] + friendY) / 2;

    return (
        <FormulaBlock
            latex={
                `\\clr{mid}{M} = \\left( \\frac{\\clr{home}{x_1} + \\clr{friend}{x_2}}{2},\\ ` +
                `\\frac{\\clr{home}{y_1} + \\clr{friend}{y_2}}{2} \\right)` +
                ` = \\left( \\frac{\\clr{home}{${signedTerm(HOME[0])}} + \\scrub{midpointFriendX}}{2},\\ ` +
                `\\frac{\\clr{home}{${signedTerm(HOME[1])}} + \\scrub{midpointFriendY}}{2} \\right)` +
                ` = \\clr{mid}{(${midX},\\ ${midY})}`
            }
            colorMap={{ mid: ACCENT, home: INK_STRUCTURE, friend: ACCENT_TWO }}
            variables={FRIEND_SCRUB_VARS}
        />
    );
}

// ── Blocks ───────────────────────────────────────────────────────────────────

export const midpointBlocks: ReactElement[] = [
    <StackLayout key="layout-midpoint-heading" maxWidth="xl">
        <Block id="midpoint-heading" padding="md">
            <EditableH3 id="h3-midpoint-heading" blockId="midpoint-heading">
                Exactly Halfway
            </EditableH3>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-midpoint-setup" maxWidth="xl">
        <Block id="midpoint-setup" padding="sm">
            <EditableParagraph id="para-midpoint-setup" blockId="midpoint-setup">
                You and a friend want to meet in the middle. Drop the teal marker where
                you think halfway is. The ropes say whether the{" "}
                <InlineLinkedHighlight
                    varName="midpointHighlight"
                    highlightId="toHome"
                    {...linkedHighlightPropsFromDefinition(getVariableInfo("midpointHighlight"))}
                >
                    walk from home
                </InlineLinkedHighlight>{" "}
                matches the{" "}
                <InlineLinkedHighlight
                    id="link-midpoint-to-friend"
                    varName="midpointHighlight"
                    highlightId="toFriend"
                    {...linkedHighlightPropsFromDefinition(getVariableInfo("midpointHighlight"))}
                >
                    walk from theirs
                </InlineLinkedHighlight>
                .
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-midpoint-figure" maxWidth="xl">
        <Block id="midpoint-figure" padding="sm" hasVisualization>
            <MidpointFigure />
        </Block>
    </StackLayout>,

    <StackLayout key="layout-midpoint-insight" maxWidth="xl">
        <Block id="midpoint-insight" padding="sm">
            <EditableParagraph id="para-midpoint-insight" blockId="midpoint-insight">
                Your x lands between their two x values, and your y between their two y
                values. A midpoint is an{" "}
                <InlineTooltip
                    id="tooltip-midpoint-average"
                    tooltip="Add the two values together, then divide by 2. The result always lands exactly between them."
                >
                    average
                </InlineTooltip>
                . Subtracting gives you the gap, and a gap
                is not a place.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-midpoint-formula" maxWidth="xl">
        <Block id="midpoint-formula" padding="md">
            <MidpointFormula />
        </Block>
    </StackLayout>,

    <StackLayout key="layout-midpoint-question" maxWidth="xl">
        <Block id="midpoint-question" padding="md">
            <EditableParagraph id="para-midpoint-question" blockId="midpoint-question">
                Two lockers sit at (2, −3) and (10, 7). Halfway between them, the x
                coordinate is{" "}
                <InlineFeedback
                    varName="answerMidpointX"
                    correctValue="6"
                    position="mid"
                    hint="Add the two x values and share the total between two"
                    visualizationHint={{
                        blockId: "midpoint-figure",
                        hintKey: "midpoint-feedback-hint",
                        label: "Discover it yourself",
                        resetVars: {
                            midpointFriendX: 6,
                            midpointFriendY: 7,
                            midpointGuessX: -1,
                            midpointGuessY: 7,
                            midpointHighlight: "",
                        },
                        steps: [
                            {
                                gesture: "drag-horizontal",
                                label: "Slide the marker across until it sits above the middle of the road",
                                position: { x: "41%", y: "30%" },
                                completionVar: "midpointGuessX",
                                completionValue: 1,
                                completionTolerance: 0.3,
                            },
                            {
                                gesture: "drag-vertical",
                                label: "Now drop it onto the road — then compare its x with -4 and 6",
                                position: { x: "50%", y: "36%" },
                                completionVar: "midpointGuessY",
                                completionValue: 4,
                                completionTolerance: 0.3,
                            },
                        ],
                    }}
                >
                    <InlineClozeInput
                        varName="answerMidpointX"
                        correctAnswer="6"
                        {...clozePropsFromDefinition(getVariableInfo("answerMidpointX"))}
                    />
                </InlineFeedback>{" "}
                and the y coordinate is{" "}
                <InlineFeedback
                    varName="answerMidpointY"
                    correctValue="2"
                    position="terminal"
                    successMessage="— that is it. (−3 + 7) ÷ 2 = 2, so the lockers meet at (6, 2)"
                    failureMessage="— close, but check the method."
                    hint="10 would be the gap between −3 and 7. Halfway asks for their average instead"
                    reviewBlockId="midpoint-formula"
                    reviewLabel="Look at the midpoint formula again"
                >
                    <InlineClozeInput
                        varName="answerMidpointY"
                        correctAnswer="2"
                        {...clozePropsFromDefinition(getVariableInfo("answerMidpointY"))}
                    />
                </InlineFeedback>.
            </EditableParagraph>
        </Block>
    </StackLayout>,
];
