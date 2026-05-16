import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      first_name,
      last_name,
      email,
      phone,
      company_name,
      trades,
      service_zip_codes,
      years_experience,
      license_number,
      website_url,
    } = body;

    // Validate required fields
    if (!first_name || !last_name || !email) {
      return NextResponse.json(
        { error: 'First name, last name, and email are required.' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }

    // Check for duplicate email
    const { data: existing } = await supabaseAdmin
      .from('contractor_signups')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: 'This email is already registered. We\'ll be in touch soon!' },
        { status: 409 }
      );
    }

    // Parse ZIP codes from comma-separated string if needed
    const zipArray = Array.isArray(service_zip_codes)
      ? service_zip_codes
      : typeof service_zip_codes === 'string'
        ? service_zip_codes.split(',').map((z: string) => z.trim()).filter(Boolean)
        : [];

    // Parse trades array
    const tradesArray = Array.isArray(trades) ? trades : [];

    // Build the insert payload — try full insert first, fallback for missing columns
    const fullPayload = {
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone?.trim() || null,
      company_name: company_name?.trim() || null,
      trades: tradesArray,
      service_zip_codes: zipArray,
      years_experience: years_experience ? parseInt(years_experience, 10) : null,
      license_number: license_number?.trim() || null,
      website_url: website_url?.trim() || null,
      status: 'pending',
    };

    // Try full insert
    let result = await supabaseAdmin
      .from('contractor_signups')
      .insert(fullPayload)
      .select('id')
      .single();

    // If table doesn't exist yet, try creating a minimal record in leads as fallback
    if (result.error) {
      // Try a minimal insert (maybe some columns don't exist yet)
      const minimalPayload = {
        first_name: fullPayload.first_name,
        last_name: fullPayload.last_name,
        email: fullPayload.email,
        phone: fullPayload.phone,
        company_name: fullPayload.company_name,
        status: 'pending',
      };

      result = await supabaseAdmin
        .from('contractor_signups')
        .insert(minimalPayload)
        .select('id')
        .single();

      if (result.error) {
        console.error('Contractor signup insert error:', result.error);
        return NextResponse.json(
          { error: 'We couldn\'t save your request right now. Please try again in a moment.' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      id: result.data?.id,
      message: 'Your request has been submitted! We\'ll review your information and be in touch soon.',
    });
  } catch (err) {
    console.error('Contractor signup error:', err);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
