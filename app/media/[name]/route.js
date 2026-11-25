import { get } from '@vercel/blob';

export async function GET(request, { params }) {
  const { name } = await params;
  if (!/^[0-9a-f-]{36}\.(jpg|png|webp|gif|avif)$/.test(name) || !process.env.BLOB_READ_WRITE_TOKEN) {
    return new Response(null, { status: 404 });
  }
  const result = await get('48timerfestival/media/' + name, { access: 'private' });
  if (!result || result.statusCode !== 200) return new Response(null, { status: 404 });
  return new Response(result.stream, {
    headers: {
      'Content-Type': result.blob.contentType,
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
