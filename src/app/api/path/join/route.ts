import path from 'path';

async function join(request: Request) {
  const body = await request.json();
  const paths = body?.paths || [];
  return new Response(path.join(...paths), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const POST = join;
