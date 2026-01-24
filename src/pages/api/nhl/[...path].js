// Serverless proxy for NHL API to avoid CORS issues
// Handles all requests to /api/nhl/*

const NHL_BASE_URL = 'https://api-web.nhle.com/v1';

export async function GET({ params }) {
  const path = params.path;
  const url = `${NHL_BASE_URL}/${path}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      return new Response(JSON.stringify({ error: 'NHL API error' }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60' // Cache for 1 minute
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to fetch from NHL API' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
