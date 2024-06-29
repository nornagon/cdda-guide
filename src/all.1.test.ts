/**
 * @vitest-environment jsdom
 */

import { makeRenderTests } from "./testRender";

const chunkNum = /all\.(\d+)\.test\.ts$/.exec(__filename)?.[1];
if (!chunkNum) throw new Error("No chunk index found");
const chunkIdx = parseInt(chunkNum, 10) - 1;
const numChunks = 2;

makeRenderTests(chunkIdx, numChunks);
