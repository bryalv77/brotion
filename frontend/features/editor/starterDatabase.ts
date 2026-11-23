import { addProperty, addRow, createDatabase } from "@/lib/data/databases";

/** New database with Name + Description columns and 4 empty rows. */
export async function createStarterDatabase(pageId: string): Promise<string> {
  const db = await createDatabase(pageId, { title: "Untitled" });
  await addProperty(db.id, { name: "Description", type: "text" });
  for (let i = 0; i < 4; i++) await addRow(db.id);
  return db.id;
}
