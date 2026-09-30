export type ItemType = "homework" | "exam";

export type SchoolItem = {
  id: string;
  type: ItemType;
  title: string;
  subject?: string;
  date: string;       // YYYY-MM-DD
  time?: string;
  details?: string;
  sourceId?: string;
};

export type StoredItem = SchoolItem & {
  completed: boolean;
};
