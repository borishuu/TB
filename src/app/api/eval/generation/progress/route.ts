import { getProgress } from '@/lib/progressStore';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const generationId = searchParams.get('id');

  if (!generationId) {
    return new Response('Missing ID', { status: 400 });
  }

  const stream = new ReadableStream({
    start(controller) {
      let closed = false;
    
      const send = (data: string) => {
        if (!closed) {
          try {
            controller.enqueue(`data: ${data}\n\n`);
          } catch (err) {
            closed = true;
            clearInterval(interval);
            controller.close();
          }
        }
      };
    
      const interval = setInterval(() => {
        const phase = getProgress(generationId);
        if (phase) send(JSON.stringify({ phase }));
    
        if (phase === 'done' || phase === 'error') {
          clearInterval(interval);
          if (!closed) {
            controller.close();
            closed = true;
          }
        }
      }, 500);
    }    
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
