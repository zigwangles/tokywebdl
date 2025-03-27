import { NextRequest, NextResponse } from 'next/server';
import json5 from 'json5';

interface Chapter {
  name: string;
  chapter_link_dropbox: string;
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();
    
    if (!url || !url.includes('tokybook.com')) {
      return NextResponse.json({ error: 'Invalid Tokybook URL' }, { status: 400 });
    }
    
    // Fetch the page content
    const response = await fetch(url);
    const text = await response.text();
    
    // Extract chapters data using regex
    const data = text.match(/tracks\s*=\s*(\[[^\]]+\])\s*/);
    
    if (!data || !data[1]) {
      return NextResponse.json({ error: 'Could not extract chapter data' }, { status: 404 });
    }
    
    // Parse the JSON5 data using the json5 library
    let parsedData;
    try {
      parsedData = json5.parse(data[1]);
    } catch (e) {
      console.error('Error parsing JSON:', e);
      return NextResponse.json({ error: 'Failed to parse chapter data' }, { status: 500 });
    }
    
    // Remove the first entry which is not an actual chapter
    if (Array.isArray(parsedData) && parsedData.length > 0) {
      parsedData.shift();
    }
    
    return NextResponse.json({ chapters: parsedData });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
} 