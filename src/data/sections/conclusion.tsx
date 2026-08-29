/**
 * Section 6 — Wrapping Up (closing)
 * Text only: keeps the promise the opening made, names the one idea that
 * ran through all four formulas, and points at what comes next.
 */

import { type ReactElement } from "react";
import { StackLayout } from "@/components/layouts";
import { Block } from "@/components/templates";
import { EditableH2, EditableParagraph } from "@/components/atoms";

export const conclusionBlocks: ReactElement[] = [
    <StackLayout key="layout-conclusion-heading" maxWidth="xl">
        <Block id="conclusion-heading" padding="lg">
            <EditableH2 id="h2-conclusion-heading" blockId="conclusion-heading">
                Wrapping Up
            </EditableH2>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-conclusion-thread" maxWidth="xl">
        <Block id="conclusion-thread" padding="sm">
            <EditableParagraph id="para-conclusion-thread" blockId="conclusion-thread">
                Almost everything here grew out of one right-angled triangle. The gap
                across and the gap up gave you the distance when you squared them, the
                gradient when you divided them, and the circle when you insisted that the
                distance never change.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-conclusion-next" maxWidth="xl">
        <Block id="conclusion-next" padding="sm">
            <EditableParagraph id="para-conclusion-next" blockId="conclusion-next">
                The midpoint was the odd one out and the simplest of the lot: average the
                x values, average the y values, and you are standing in the middle of the
                road. Two places quietly swallow marks, so watch for them: the square root
                at the end of a distance, and the flipped sign inside a circle's bracket.
                Next comes what happens when a line and a circle meet, and how many times
                they are allowed to cross.
            </EditableParagraph>
        </Block>
    </StackLayout>,
];
