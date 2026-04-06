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

    // Step 1: Geocode to get precise lat/lng
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${key}`;
    const geocodeRes = await fetch(geocodeUrl);
    const geocodeData = await geocodeRes.json() as { status: string; results: Array<{ geometry: { location: { lat: number; lng: number } } }> };

    if (geocodeData.status !== 'OK' || !geocodeData.results[0]) {
      return NextResponse.json({ available: false, message: 'Address not found. Please check the address and try again.' });
    }

    const { lat, lng } = geocodeData.results[0].geometry.location;

    // Step 2: Get Street View metadata including links (for heading)
    const metaUrl = `https://maps.googleapis.com/maps/api/streetview/metadata?location=${lat},${lng}&key=${key}`;
    const metaRes = await fetch(metaUrl);
    const meta = await metaRes.json() as StreetViewMetadata;

    // Step 3: Satellite overhead view (always available)
    const satelliteUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=20&size=640x640&maptype=satellite&key=${key}`;

    if (meta.status !== 'OK') {
      // No Street View but we have satellite
      return NextResponse.json({
        available: true,
        image_url: null,
        satellite_url: satelliteUrl,
        location: { lat, lng },
        message: 'No Street View available for this address, but satellite view is shown.',
      });
    }

    // Step 4: Compute heading facing the house from the street
    // Street View links point away from the camera toward neighboring panos
    // We use the first link heading + 180 to face the house
    let heading = 0;
    if (meta.links && meta.links.length > 0) {
      // Average the links to find road direction, then face perpendicular toward property
      heading = (meta.links[0].heading + 180) % 360;
    }

    // Step 5: Build tight Street View URL (FOV 65, slight downward pitch, high-res)
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
