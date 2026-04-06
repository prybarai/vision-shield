import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const schema = z.object({
  address: z.string().min(5),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { address } = schema.parse(body);
    const key = process.env.GOOGLE_MAPS_SERVER_KEY!;

    // First check if Street View imagery exists for this address
    const metaUrl = `https://maps.googleapis.com/maps/api/streetview/metadata?location=${encodeURIComponent(address)}&key=${key}`;
    const metaRes = await fetch(metaUrl);
    const meta = await metaRes.json() as { status: string; location?: { lat: number; lng: number } };

    if (meta.status !== 'OK') {
      return NextResponse.json({
        available: false,
        message: 'No Street View imagery found for this address. Please upload a photo instead.',
      });
    }

    // Build the Street View Static API URL — 640x480, front-facing
    const { lat, lng } = meta.location!;
    const imageUrl = `https://maps.googleapis.com/maps/api/streetview?size=640x480&location=${lat},${lng}&fov=90&heading=0&pitch=0&key=${key}`;

    // Fetch the image to confirm it loads and get its content
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) {
      return NextResponse.json({ available: false, message: 'Could not retrieve Street View image.' });
    }

    return NextResponse.json({
      available: true,
      image_url: imageUrl,
      location: { lat, lng },
    });
  } catch (error) {
    console.error('street-view error:', error);
    return NextResponse.json({ available: false, message: 'Failed to fetch Street View.' }, { status: 500 });
  }
}
