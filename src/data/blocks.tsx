import { type ReactElement } from "react";

// Initialize variables and their colors from this file's variable definitions
import { useVariableStore, initializeVariableColors } from "@/stores";
import { getDefaultValues, variableDefinitions } from "./variables";
useVariableStore.getState().initialize(getDefaultValues());
initializeVariableColors(variableDefinitions);

/**
 * ------------------------------------------------------------------
 * COORDINATE GEOMETRY — lesson content
 * ------------------------------------------------------------------
 * Opening → Part 1 (distance, midpoint) → Part 2 (straight lines)
 * → Part 3 (circles) → closing.
 *
 * Each section lives in its own file under ./sections and exports a
 * FLAT array of Layout > Block elements.
 */

import { introductionBlocks } from "./sections/introduction";
import { distanceBlocks } from "./sections/distance";
import { midpointBlocks } from "./sections/midpoint";
import { straightLinesBlocks } from "./sections/straightLines";
import { circlesBlocks } from "./sections/circles";
import { conclusionBlocks } from "./sections/conclusion";

export const blocks: ReactElement[] = [
    ...introductionBlocks,
    ...distanceBlocks,
    ...midpointBlocks,
    ...straightLinesBlocks,
    ...circlesBlocks,
    ...conclusionBlocks,
];
