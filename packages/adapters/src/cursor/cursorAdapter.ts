import { StubAdapter } from "../stubAdapter";

export class CursorAdapter extends StubAdapter {
  readonly id = "cursor";
  readonly name = "Cursor";
  readonly source = "cursor" as const;
}
