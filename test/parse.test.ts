import { describe, expect, it } from "vitest";
import { parse, tokenize, dump } from "../src/compiler/parse";

describe("template parse", () => {
  it("tokenize", () => {
    const template = "<div><p>Vue</p><p>Template</p></div>";

    const tokens = tokenize(template);

    const ast = parse(template);
    dump(ast);
  });
});
