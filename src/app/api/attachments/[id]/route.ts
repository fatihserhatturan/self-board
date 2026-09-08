import { getDb } from "@/lib/db/client";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;
  const db = getDb();
  const row = db.prepare("SELECT mime_type, data FROM attachments WHERE id = ?").get(id) as
    | { mime_type: string; data: Uint8Array }
    | undefined;

  if (!row) return new Response("Not found", { status: 404 });

  return new Response(Buffer.from(row.data), {
    headers: {
      "Content-Type": row.mime_type,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
