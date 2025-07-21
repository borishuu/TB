import { getProgress } from '@/lib/progressStore';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const generationId = searchParams.get('id');

  if (!generationId) {
    return new Response('Missing ID', { status: 400 });
  }

  const stream = new ReadableStream({
    start(controller) {
      const send = (data: string) => controller.enqueue(`data: ${data}\n\n`);

      const interval = setInterval(() => {
        const phase = getProgress(generationId);
        if (phase) send(JSON.stringify({ phase }));

        if (phase === 'done' || phase === 'error') {
          clearInterval(interval);
          controller.close();
        }
      }, 500);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
