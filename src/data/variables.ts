/**
 * Variables Configuration — Coordinate Geometry lesson
 * ===================================================
 *
 * Single source of truth for every shared value in the lesson.
 * Sections read/write these with useVar / useSetVar, and inline
 * components pull their props from these definitions.
 */

import { type VarValue } from '@/stores';

/**
 * Variable definition with metadata
 */
export interface VariableDefinition {
    /** Default value */
    defaultValue: VarValue;
    /** Human-readable label */
    label?: string;
    /** Description for AI agents */
    description?: string;
    /** Variable type hint */
    type?: 'number' | 'text' | 'boolean' | 'select' | 'array' | 'object' | 'spotColor' | 'linkedHighlight';
    /** Unit (e.g., 'Hz', '°', 'm/s') - for numbers */
    unit?: string;
    /** Minimum value (for number sliders) */
    min?: number;
    /** Maximum value (for number sliders) */
    max?: number;
    /** Step increment (for number sliders) */
    step?: number;
    /** Display color for InlineScrubbleNumber / InlineSpotColor (e.g. '#D81B60') */
    color?: string;
    /** Options for 'select' type variables */
    options?: string[];
    /** Placeholder text for text inputs */
    placeholder?: string;
    /**
     * Correct answer for cloze input validation.
     * Accepts a single string, pipe-separated alternates (e.g. "first | 1 | 1st"),
     * or an array of accepted answers (e.g. ["first", "1", "1st"]).
     */
    correctAnswer?: string | string[];
    /** Whether cloze matching is case sensitive */
    caseSensitive?: boolean;
    /** Background color for inline components */
    bgColor?: string;
    /** Schema hint for object types (for AI agents) */
    schema?: string;
}

const ACCENT = '#62D0AD';        // Soft Teal — the quantity the student controls
const ACCENT_TWO = '#8E90F5';    // Soft Indigo — its covariation partner
const ANSWER = '#8E90F5';

export const variableDefinitions: Record<string, VariableDefinition> = {

    // ═════════════════════════════════════════════════════════
    // PART 1a — Distance between two points
    // ═════════════════════════════════════════════════════════

    distanceDropX: {
        defaultValue: 10,
        type: 'number',
        label: 'Drop-off x',
        description: 'x coordinate of the draggable drop-off point B',
        min: -1,
        max: 11,
        step: 1,
        color: ACCENT,
    },
    distanceDropY: {
        defaultValue: 7,
        type: 'number',
        label: 'Drop-off y',
        description: 'y coordinate of the draggable drop-off point B',
        min: -1,
        max: 9,
        step: 1,
        color: ACCENT,
    },
    distanceHighlight: {
        defaultValue: '',
        type: 'text',
        label: 'Distance figure highlight',
        description: "Which part of the distance figure is highlighted: '' | 'across' | 'up' | 'hop'",
        color: ACCENT,
        bgColor: 'rgba(98, 208, 173, 0.22)',
    },
    answerDistanceNear: {
        defaultValue: '',
        type: 'text',
        label: 'Short hop answer',
        description: 'Student answer for the distance from the depot (2, 1) to (5, 5)',
        placeholder: '???',
        correctAnswer: '5',
        color: ANSWER,
    },
    answerDistanceHop: {
        defaultValue: '',
        type: 'text',
        label: 'Distance answer',
        description: 'Student answer for the distance between (1, 2) and (6, 14)',
        placeholder: '???',
        correctAnswer: '13',
        color: ANSWER,
    },

    // ═════════════════════════════════════════════════════════
    // PART 1b — Midpoint
    // ═════════════════════════════════════════════════════════

    midpointFriendX: {
        defaultValue: 6,
        type: 'number',
        label: "Friend's x",
        description: "x coordinate of the draggable second house B",
        min: -5,
        max: 8,
        step: 1,
        color: ACCENT_TWO,
    },
    midpointFriendY: {
        defaultValue: 7,
        type: 'number',
        label: "Friend's y",
        description: "y coordinate of the draggable second house B",
        min: -2,
        max: 9,
        step: 1,
        color: ACCENT_TWO,
    },
    midpointGuessX: {
        defaultValue: -1,
        type: 'number',
        label: 'Meeting point x',
        description: "x coordinate of the student's draggable meeting marker",
        min: -6,
        max: 8,
        step: 0.5,
        color: ACCENT,
    },
    midpointGuessY: {
        defaultValue: 7,
        type: 'number',
        label: 'Meeting point y',
        description: "y coordinate of the student's draggable meeting marker",
        min: -3,
        max: 9,
        step: 0.5,
        color: ACCENT,
    },
    midpointHighlight: {
        defaultValue: '',
        type: 'text',
        label: 'Midpoint figure highlight',
        description: "Which part of the midpoint figure is highlighted: '' | 'toHome' | 'toFriend' | 'meeting'",
        color: ACCENT,
        bgColor: 'rgba(98, 208, 173, 0.22)',
    },
    answerMidpointX: {
        defaultValue: '',
        type: 'text',
        label: 'Midpoint answer x',
        description: 'Student answer for the x coordinate of the midpoint of (2, -3) and (10, 7)',
        placeholder: '???',
        correctAnswer: '6',
        color: ANSWER,
    },
    answerMidpointY: {
        defaultValue: '',
        type: 'text',
        label: 'Midpoint answer y',
        description: 'Student answer for the y coordinate of the midpoint of (2, -3) and (10, 7)',
        placeholder: '???',
        correctAnswer: '2',
        color: ANSWER,
    },

    // ═════════════════════════════════════════════════════════
    // PART 2 — Straight lines
    // ═════════════════════════════════════════════════════════

    lineFirstX: {
        defaultValue: -2,
        type: 'number',
        label: 'First point x',
        description: 'x coordinate of the first draggable point on the line',
        min: -6,
        max: 6,
        step: 1,
        color: ACCENT,
    },
    lineSecondX: {
        defaultValue: 2,
        type: 'number',
        label: 'Second point x',
        description: 'x coordinate of the second draggable point on the line',
        min: -6,
        max: 6,
        step: 1,
        color: ACCENT,
    },
    lineGradient: {
        defaultValue: 2,
        type: 'number',
        label: 'Gradient m',
        description: 'Steepness of the line: rise divided by run',
        min: -6,
        max: 6,
        step: 0.5,
        color: ACCENT,
    },
    lineIntercept: {
        defaultValue: 1,
        type: 'number',
        label: 'Intercept c',
        description: 'Height at which the line crosses the y-axis',
        min: -6,
        max: 6,
        step: 0.5,
        color: ACCENT_TWO,
    },
    lineHighlight: {
        defaultValue: '',
        type: 'text',
        label: 'Line figure highlight',
        description: "Which part of the line figure is highlighted: '' | 'run' | 'rise' | 'intercept'",
        color: ACCENT,
        bgColor: 'rgba(98, 208, 173, 0.22)',
    },
    answerLineGradient: {
        defaultValue: '',
        type: 'text',
        label: 'Gradient answer',
        description: 'Student answer for the gradient of the line through (1, 4) and (4, 13)',
        placeholder: '???',
        correctAnswer: '3',
        color: ANSWER,
    },
    answerLineIntercept: {
        defaultValue: '',
        type: 'text',
        label: 'Intercept answer',
        description: 'Student answer for the y-intercept of the line through (1, 4) and (4, 13)',
        placeholder: '???',
        correctAnswer: '1',
        color: ANSWER,
    },

    // ═════════════════════════════════════════════════════════
    // PART 3 — Circles
    // ═════════════════════════════════════════════════════════

    circleCentreX: {
        defaultValue: 1,
        type: 'number',
        label: 'Centre x',
        description: 'x coordinate of the draggable circle centre',
        min: -3,
        max: 3,
        step: 1,
        color: ACCENT_TWO,
    },
    circleCentreY: {
        defaultValue: -2,
        type: 'number',
        label: 'Centre y',
        description: 'y coordinate of the draggable circle centre',
        min: -3,
        max: 3,
        step: 1,
        color: ACCENT_TWO,
    },
    circleRadius: {
        defaultValue: 4,
        type: 'number',
        label: 'Radius',
        description: 'Radius of the circle, set by dragging the rim handle',
        min: 1,
        max: 5,
        step: 1,
        color: ACCENT,
    },
    circleTestX: {
        defaultValue: 6,
        type: 'number',
        label: 'Test point x',
        description: 'x coordinate of the draggable test point checked against the circle',
        min: -8,
        max: 8,
        step: 1,
        color: '#64748B',
    },
    circleTestY: {
        defaultValue: 3,
        type: 'number',
        label: 'Test point y',
        description: 'y coordinate of the draggable test point checked against the circle',
        min: -8,
        max: 8,
        step: 1,
        color: '#64748B',
    },
    circleHighlight: {
        defaultValue: '',
        type: 'text',
        label: 'Circle figure highlight',
        description: "Which part of the circle figure is highlighted: '' | 'centre' | 'radius' | 'test'",
        color: ACCENT,
        bgColor: 'rgba(98, 208, 173, 0.22)',
    },
    answerCircleCentreX: {
        defaultValue: '',
        type: 'text',
        label: 'Circle centre answer x',
        description: 'Student answer for the x coordinate of the centre of (x-2)^2 + (y+3)^2 = 25',
        placeholder: '???',
        correctAnswer: '2',
        color: ANSWER,
    },
    answerCircleCentreY: {
        defaultValue: '',
        type: 'text',
        label: 'Circle centre answer y',
        description: 'Student answer for the y coordinate of the centre of (x-2)^2 + (y+3)^2 = 25',
        placeholder: '???',
        correctAnswer: ['-3', '−3'],
        color: ANSWER,
    },
    answerCircleRadius: {
        defaultValue: '',
        type: 'text',
        label: 'Circle radius answer',
        description: 'Student answer for the radius of (x-2)^2 + (y+3)^2 = 25',
        placeholder: '???',
        correctAnswer: '5',
        color: ANSWER,
    },
};

/**
 * Get all variable names (for AI agents to discover)
 */
export const getVariableNames = (): string[] => {
    return Object.keys(variableDefinitions);
};

/**
 * Get a variable's default value
 */
export const getDefaultValue = (name: string): VarValue => {
    return variableDefinitions[name]?.defaultValue ?? 0;
};

/**
 * Get a variable's metadata
 */
export const getVariableInfo = (name: string): VariableDefinition | undefined => {
    return variableDefinitions[name];
};

/**
 * Get all default values as a record (for initialization)
 */
export const getDefaultValues = (): Record<string, VarValue> => {
    const defaults: Record<string, VarValue> = {};
    for (const [name, def] of Object.entries(variableDefinitions)) {
        defaults[name] = def.defaultValue;
    }
    return defaults;
};

/**
 * Get number props for InlineScrubbleNumber from a variable definition.
 */
export function numberPropsFromDefinition(def: VariableDefinition | undefined): {
    defaultValue?: number;
    min?: number;
    max?: number;
    step?: number;
    color?: string;
} {
    if (!def || def.type !== 'number') return {};
    return {
        defaultValue: def.defaultValue as number,
        min: def.min,
        max: def.max,
        step: def.step,
        ...(def.color ? { color: def.color } : {}),
    };
}

/**
 * Get cloze choice props for InlineClozeChoice from a variable definition.
 */
export function choicePropsFromDefinition(def: VariableDefinition | undefined): {
    placeholder?: string;
    color?: string;
    bgColor?: string;
} {
    if (!def || def.type !== 'select') return {};
    return {
        ...(def.placeholder ? { placeholder: def.placeholder } : {}),
        ...(def.color ? { color: def.color } : {}),
        ...(def.bgColor ? { bgColor: def.bgColor } : {}),
    };
}

/**
 * Get toggle props for InlineToggle from a variable definition.
 */
export function togglePropsFromDefinition(def: VariableDefinition | undefined): {
    color?: string;
    bgColor?: string;
} {
    if (!def || def.type !== 'select') return {};
    return {
        ...(def.color ? { color: def.color } : {}),
        ...(def.bgColor ? { bgColor: def.bgColor } : {}),
    };
}

export function clozePropsFromDefinition(def: VariableDefinition | undefined): {
    placeholder?: string;
    color?: string;
    bgColor?: string;
    caseSensitive?: boolean;
} {
    if (!def || def.type !== 'text') return {};
    return {
        ...(def.placeholder ? { placeholder: def.placeholder } : {}),
        ...(def.color ? { color: def.color } : {}),
        ...(def.bgColor ? { bgColor: def.bgColor } : {}),
        ...(def.caseSensitive !== undefined ? { caseSensitive: def.caseSensitive } : {}),
    };
}

/**
 * Get spot-color props for InlineSpotColor from a variable definition.
 */
export function spotColorPropsFromDefinition(def: VariableDefinition | undefined): {
    color: string;
} {
    return {
        color: def?.color ?? '#8B5CF6',
    };
}

/**
 * Get linked-highlight props for InlineLinkedHighlight from a variable definition.
 */
export function linkedHighlightPropsFromDefinition(def: VariableDefinition | undefined): {
    color?: string;
    bgColor?: string;
} {
    return {
        ...(def?.color ? { color: def.color } : {}),
        ...(def?.bgColor ? { bgColor: def.bgColor } : {}),
    };
}

/**
 * Build the `variables` prop for FormulaBlock from variable definitions.
 */
export function scrubVarsFromDefinitions(
    varNames: string[],
): Record<string, { min?: number; max?: number; step?: number; color?: string }> {
    const result: Record<string, { min?: number; max?: number; step?: number; color?: string }> = {};
    for (const name of varNames) {
        const def = variableDefinitions[name];
        if (!def) continue;
        result[name] = {
            ...(def.min !== undefined ? { min: def.min } : {}),
            ...(def.max !== undefined ? { max: def.max } : {}),
            ...(def.step !== undefined ? { step: def.step } : {}),
            ...(def.color ? { color: def.color } : {}),
        };
    }
    return result;
}
