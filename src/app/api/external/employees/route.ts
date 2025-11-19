import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '10';
    const search = searchParams.get('search') || '';

    const apiKey = process.env.EXTERNAL_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { success: false, message: 'EXTERNAL_API_KEY is not configured' },
        { status: 500 }
      );
    }

    // Build query parameters
    const params = new URLSearchParams({
      page,
      limit,
    });
    if (search) {
      params.append('search', search);
    }

    const externalApiUrl = `https://api.apsecuritas.in/api/external/employees?${params.toString()}`;

    const response = await fetch(externalApiUrl, {
      method: 'GET',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('External API error:', errorText);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch employees from external API', error: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error fetching external employees:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}

