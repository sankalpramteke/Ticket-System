import { NextResponse } from 'next/server'
import { getEventBus } from '@/lib/events'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const bus = getEventBus()
  // Declare cancel handle before constructing the stream; start() runs immediately
  let streamCancel = null
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder()

      function send(event, data) {
        const payload = `event: ${event}\n` +
                        `data: ${JSON.stringify(data)}\n\n`
        controller.enqueue(encoder.encode(payload))
      }

      const onTicket = (data) => send('tickets:update', data)
      const onUsers = (data) => send('users:update', data)

      bus.on('tickets:update', onTicket)
      bus.on('users:update', onUsers)

      // keep-alive ping every 25s (some proxies close idle)
      const ping = setInterval(() => {
        controller.enqueue(encoder.encode(`event: ping\n` + `data: {}\n\n`))
      }, 25000)

      // cleanup on close/cancel
      const close = () => {
        clearInterval(ping)
        bus.off('tickets:update', onTicket)
        bus.off('users:update', onUsers)
      }

      // expose cancel
      streamCancel = close
    },
    cancel() {
      if (typeof streamCancel === 'function') streamCancel()
    }
  })

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  })
}
