import { getDb } from "@/lib/db/client";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;
  const db = getDb();
  const row = db.prepare("SELECT icon_mime_type, icon_data FROM projects WHERE id = ?").get(id) as
    | { icon_mime_type: string | null; icon_data: Uint8Array | null }
    | undefined;

  if (!row || !row.icon_mime_type || !row.icon_data) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(Buffer.from(row.icon_data), {
    headers: {
      "Content-Type": row.icon_mime_type,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
