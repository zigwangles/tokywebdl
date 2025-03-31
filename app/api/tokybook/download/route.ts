import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';

interface Chapter {
  name: string;
  chapter_link_dropbox: string;
  isDirectUrl?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const { chapters, bookName } = await request.json() as { 
      chapters: Chapter[];
      bookName: string;
    };
    
    if (!chapters || !Array.isArray(chapters) || chapters.length === 0) {
      return NextResponse.json({ error: 'Invalid chapters data' }, { status: 400 });
    }

    const zip = new JSZip();
    
    // Create a folder with the book name
    const bookFolder = zip.folder(bookName);
    if (!bookFolder) {
      throw new Error('Failed to create zip folder');
    }

    // Download and add each chapter to the zip
    for (const chapter of chapters) {
      try {
        const response = await fetch(chapter.chapter_link_dropbox);
        if (!response.ok) {
          throw new Error(`Failed to download ${chapter.name}`);
        }
        
        const buffer = await response.arrayBuffer();
        bookFolder.file(chapter.name, buffer);
      } catch (error) {
        console.error(`Error downloading ${chapter.name}:`, error);
        // Continue with other chapters even if one fails
      }
    }

    // Generate the zip file
    const zipContent = await zip.generateAsync({ type: 'blob' });
    
    // Return the zip file
    return new Response(zipContent, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${bookName}.zip"`,
      },
    });
  } catch (error) {
    console.error('Download All API error:', error);
    return NextResponse.json({ error: 'Failed to process download request' }, { status: 500 });
  }
} 
