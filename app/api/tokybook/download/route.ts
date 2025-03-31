import { NextRequest, NextResponse } from 'next/server';

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

    // Create a ReadableStream to handle the downloads
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send the book name as a header
          controller.enqueue(new TextEncoder().encode(bookName + '\n'));
          
          // Download and send each chapter
          for (const chapter of chapters) {
            try {
              const response = await fetch(chapter.chapter_link_dropbox);
              if (!response.ok) {
                throw new Error(`Failed to download ${chapter.name}`);
              }
              
              // Send the chapter name
              controller.enqueue(new TextEncoder().encode(chapter.name + '\n'));
              
              // Stream the audio data
              const reader = response.body?.getReader();
              if (!reader) throw new Error('No reader available');
              
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                controller.enqueue(value);
              }
              
              // Send a delimiter between chapters
              controller.enqueue(new TextEncoder().encode('\n'));
            } catch (error) {
              console.error(`Error downloading ${chapter.name}:`, error);
              controller.enqueue(new TextEncoder().encode(`ERROR: ${chapter.name}\n`));
            }
          }
          
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      }
    });

    // Return the stream with appropriate headers
    return new Response(stream, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${bookName}.txt"`,
      },
    });
  } catch (error) {
    console.error('Download All API error:', error);
    return NextResponse.json({ error: 'Failed to process download request' }, { status: 500 });
  }
} 
