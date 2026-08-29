/**
 * Section 1 — Coordinate Geometry (opening)
 * Text only: sets the scene, states where the lesson is going,
 * and leans on the one skill students already have (reading points).
 */

import { type ReactElement } from "react";
import { StackLayout } from "@/components/layouts";
import { Block } from "@/components/templates";
import { EditableH1, EditableParagraph } from "@/components/atoms";

export const introductionBlocks: ReactElement[] = [
    <StackLayout key="layout-intro-title" maxWidth="xl">
        <Block id="intro-title" padding="md">
            <EditableH1 id="h1-intro-title" blockId="intro-title">
                Coordinate Geometry
            </EditableH1>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-intro-hook" maxWidth="xl">
        <Block id="intro-hook" padding="sm">
            <EditableParagraph id="para-intro-hook" blockId="intro-hook">
                Open any food delivery app and you can watch a little scooter icon crawl
                across a map. The app knows exactly how far it still has to travel, where
                the halfway point is, and which streets sit inside its ten-minute circle.
                It works all of that out from nothing but pairs of numbers.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-intro-promise" maxWidth="xl">
        <Block id="intro-promise" padding="sm">
            <EditableParagraph id="para-intro-promise" blockId="intro-promise">
                You can already read a point like (4, 3) off a grid. Over the next few
                pages that single skill turns into four pieces of machinery: the distance
                between two points, the point exactly halfway between them, the equation
                of a straight line, and the equation of a circle. They all grow out of the
                same picture.
            </EditableParagraph>
        </Block>
    </StackLayout>,
];
