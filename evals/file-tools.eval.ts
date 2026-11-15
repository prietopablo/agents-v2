import { toolSelectionScore } from "./evaluators.ts";

import type { EvalData, EvalTarget } from "./types.ts";
import type { SingleTurnDatasetEntry } from "./types.ts";
import dataSet from "./data/file-tools.json" with { type: "json" };
import { singleTurnExecutorWithMocks } from "./executors.ts";
import { evaluate } from "@lmnr-ai/lmnr";

const executor = async (data: EvalData) => {
  return singleTurnExecutorWithMocks(data);
};

evaluate({
  data: dataSet as SingleTurnDatasetEntry[],
  executor,
  evaluators: {
    selectionScore: (output, target?: EvalTarget) => {
      if (!target) return 0;
      if (target.category === "secondary") return 1;

      return toolSelectionScore(output, target);
    },
  },
  groupName: "file-tools-selection",
});
