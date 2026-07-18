import { StubAdapter } from "../stubAdapter";

export class CodexAdapter extends StubAdapter {
  readonly id = "codex";
  readonly name = "Codex CLI";
  readonly source = "codex" as const;
}
