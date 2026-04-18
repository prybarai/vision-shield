import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const schema = z.object({
  address: z.string().min(3),
});

interface StreetViewMetadata {
  status: string;
  location?: { lat: number; lng: number };
  links?: Array<{ heading: number; description: string; pano_id: string }>;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { address } = schema.parse(body);
    const key = process.env.GOOGLE_MAPS_SERVER_KEY!;

    // Step 1: Get Street View metadata — Street View API has its own geocoding built in
    // No need for a separate Geocoding API call
    const metaUrl = `https://maps.googleapis.com/maps/api/streetview/metadata?location=${encodeURIComponent(address)}&key=${key}`;
    const metaRes = await fetch(metaUrl);
    const meta = await metaRes.json() as StreetViewMetadata;

    // Step 2: Build satellite URL using the coordinates from metadata (or address directly)
    let satelliteUrl: string;
    let lat: number | undefined;
    let lng: number | undefined;

    if (meta.status === 'OK' && meta.location) {
      lat = meta.location.lat;
      lng = meta.location.lng;
      satelliteUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=20&size=640x640&maptype=satellite&key=${key}`;
    } else {
      // Fallback: use address string for satellite
      satelliteUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${encodeURIComponent(address)}&zoom=19&size=640x640&maptype=satellite&key=${key}`;
    }

    if (meta.status !== 'OK') {
      // No Street View — return satellite only
      return NextResponse.json({
        available: true,
        image_url: null,
        satellite_url: satelliteUrl,
        location: meta.location || null,
        message: 'No Street View available for this address — showing satellite view.',
      });
    }

    // Step 3: Compute heading to face the house from the street
    // Street View metadata links point to neighboring panos along the road
    // Adding 180° flips the direction to face the property
    let heading = 0;
    if (meta.links && meta.links.length > 0) {
      heading = (meta.links[0].heading + 180) % 360;
    }

    // Step 4: Build tight Street View URL
    // FOV 65 (vs 90 default) = tighter crop, less neighbor bleed
    // pitch -5 = slight downward tilt to show more of property
    // size 800x600 = higher resolution
    const streetViewUrl = `https://maps.googleapis.com/maps/api/streetview?size=800x600&location=${lat},${lng}&fov=65&heading=${Math.round(heading)}&pitch=-5&key=${key}`;

    return NextResponse.json({
      available: true,
      image_url: streetViewUrl,
      satellite_url: satelliteUrl,
      location: { lat, lng },
    });
  } catch (error) {
    console.error('street-view error:', error);
    return NextResponse.json({ available: false, message: 'Failed to fetch property images.' }, { status: 500 });
  }
}
