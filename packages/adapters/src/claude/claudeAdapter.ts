import { StubAdapter } from "../stubAdapter";

export class ClaudeAdapter extends StubAdapter {
  readonly id = "claude";
  readonly name = "Claude Code";
  readonly source = "claude" as const;
}
