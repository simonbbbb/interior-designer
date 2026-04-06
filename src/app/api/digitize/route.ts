/**
 * POST /api/digitize
 * Proxies the floorplan image to the Python digitizer service.
 * Returns structured wall/door/window coordinates.
 */
import { NextRequest, NextResponse } from 'next/server';

const DIGITIZER_URL =
  process.env.NEXT_PUBLIC_DIGITIZER_API_URL || 'http://localhost:8000';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { image, pixels_per_foot } = body;

    if (!image) {
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 },
      );
    }

    const response = await fetch(DIGITIZER_URL + '/digitize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image, pixels_per_foot }),
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { error },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (err) {
    // If digitizer service is unavailable, return fallback
    console.error('[Digitizer] Proxy failed:', err);
    return NextResponse.json(
      {
        error: 'Digitizer service unavailable. Switching to manual tracing mode.',
        fallback: true,
        walls: [],
        doors: [],
        windows: [],
        metadata: {
          imageWidth: 0,
          imageHeight: 0,
          processingTimeMs: 0,
          wallCount: 0,
          avgConfidence: 0,
        },
      },
      { status: 200 },
    );
  }
}
