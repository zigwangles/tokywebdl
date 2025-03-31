import { NextRequest, NextResponse } from 'next/server';

interface Chapter {
  name: string;
  chapter_link_dropbox: string;
  isDirectUrl?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const { chapter, isDirectUrl = false } = await request.json() as { 
      chapter: Chapter; 
      isDirectUrl?: boolean;
    };
    
    if (!chapter || !chapter.chapter_link_dropbox || !chapter.name) {
      return NextResponse.json({ error: 'Invalid chapter data' }, { status: 400 });
    }
    
    if (isDirectUrl) {
      // For direct URLs, return the URL as is
      return NextResponse.json({ 
        success: true, 
        message: `Ready to download ${chapter.name}`, 
        name: chapter.name,
        downloadUrl: chapter.chapter_link_dropbox
      });
    }
    
    // For tokybook URLs, try different base URLs
    const baseUrls = [
      'https://files01.tokybook.com/audio/',
      'https://files02.tokybook.com/audio/'
    ];
    
    let downloaded = false;
    let error = '';
    let downloadUrl = '';
    
    // Try each base URL to get metadata
    for (const baseUrl of baseUrls) {
      const url = baseUrl + chapter.chapter_link_dropbox;
      
      try {
        const response = await fetch(url, { method: 'HEAD' });
        
        if (!response.ok) {
          error = `Failed to access ${baseUrl}: ${response.status} ${response.statusText}`;
          continue;
        }
        
        // If the HEAD request succeeds, we assume the download URL is valid
        downloadUrl = url;
        downloaded = true;
        break;
      } catch (err) {
        const e = err as Error;
        error = `Error accessing ${baseUrl}: ${e.message}`;
      }
    }
    
    if (!downloaded) {
      return NextResponse.json({ error: error || 'Failed to access chapter' }, { status: 500 });
    }
    
    // Return the direct download URL for the client to handle
    return NextResponse.json({ 
      success: true, 
      message: `Ready to download ${chapter.name}`, 
      name: chapter.name,
      downloadUrl: downloadUrl
    });
  } catch (error) {
    console.error('Download API error:', error);
    return NextResponse.json({ error: 'Failed to process download request' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');
  
  if (!url) {
    return NextResponse.json({ error: 'No URL provided' }, { status: 400 });
  }
  
  return NextResponse.json({ 
    downloadUrl: url 
  });
} 
