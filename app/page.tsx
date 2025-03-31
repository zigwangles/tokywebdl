"use client"

import * as React from "react"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Card, CardContent } from "../components/ui/card"
import { AlertTriangle, Download } from "lucide-react"
import { ThemeToggle } from "../components/ThemeToggle"
import { ThemeProvider } from "next-themes"

interface Chapter {
  name: string;
  chapter_link_dropbox: string;
  size?: string;
  duration?: string;
  speed?: string;
  isDirectUrl?: boolean;
}

interface DownloadStatus {
  status: 'idle' | 'downloading' | 'completed' | 'error';
  progress: number;
  url?: string;
  error?: string;
}

export default function Home() {
  const [url, setUrl] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [chapters, setChapters] = React.useState<Chapter[]>([])
  const [downloadStatus, setDownloadStatus] = React.useState<Record<string, DownloadStatus>>({})
  const [showWarning, setShowWarning] = React.useState(false)

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setUrl(newUrl);
    setShowWarning(newUrl.length > 0 && !newUrl.startsWith('https://'));
  };

  const handleLoadUrl = async () => {
    if (!url) {
      setError("Please enter a valid URL or list of URLs")
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      // Check if the input is a list of URLs (one per line)
      const urls = url.split('\n').map(u => u.trim()).filter(u => u);
      
      if (urls.length === 0) {
        setError("No valid URLs found");
        setLoading(false);
        return;
      }

      // If it's a single URL and it's from tokybook.com, use the extract API
      if (urls.length === 1 && urls[0].includes('tokybook.com')) {
        const response = await fetch('/api/tokybook/extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: urls[0] })
        });
        
        if (!response.ok) {
          throw new Error('Failed to extract chapters');
        }
        
        const data = await response.json();
        setChapters(data.chapters);
      } else {
        // Handle direct file URLs
        const chapters: Chapter[] = urls.map((url, index) => ({
          name: `File ${index + 1}.mp3`,
          chapter_link_dropbox: url,
          isDirectUrl: true
        }));
        setChapters(chapters);
      }
      
      // Initialize download status for all chapters
      const initialStatus: Record<string, DownloadStatus> = {}
      chapters.forEach((chapter: Chapter) => {
        initialStatus[chapter.name] = { status: 'idle', progress: 0 }
      })
      setDownloadStatus(initialStatus)
      setLoading(false);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
      setLoading(false)
    }
  }
  
  const handleDownload = async (chapter: Chapter) => {
    setDownloadStatus((prev: Record<string, DownloadStatus>) => ({
      ...prev,
      [chapter.name]: { ...prev[chapter.name], status: 'downloading', progress: 0 }
    }))
    
    try {
      if (chapter.isDirectUrl) {
        // For direct URLs, create a download link
        const link = document.createElement('a');
        link.href = chapter.chapter_link_dropbox;
        link.download = chapter.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // For tokybook URLs, use the download API
        const response = await fetch('/api/tokybook/download', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chapter })
        });
        
        if (!response.ok) {
          throw new Error('Failed to initiate download');
        }
        
        const data = await response.json();
        if (data.downloadUrl) {
          const link = document.createElement('a');
          link.href = data.downloadUrl;
          link.download = chapter.name;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      }
      
      setDownloadStatus((prev: Record<string, DownloadStatus>) => ({
        ...prev,
        [chapter.name]: { 
          status: 'completed', 
          progress: 100,
          url: chapter.chapter_link_dropbox
        }
      }))
    } catch (error) {
      setDownloadStatus((prev: Record<string, DownloadStatus>) => ({
        ...prev,
        [chapter.name]: { 
          status: 'error', 
          progress: 0,
          error: error instanceof Error ? error.message : 'Download failed'
        }
      }))
    }
  }
  
  const handleDownloadAll = async () => {
    for (const chapter of chapters) {
      if (downloadStatus[chapter.name]?.status !== 'completed') {
        await handleDownload(chapter)
      }
    }
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <main className="min-h-screen bg-[#121212]">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold text-white">Tokydl</h1>
            <ThemeToggle />
          </div>
          
          <Card className="bg-[#1E1E1E] border-0 rounded-xl mb-6">
            <CardContent className="p-6">
              <h2 className="text-xl text-white mb-4">Import Tokybook URL</h2>
              <div className="flex space-x-2">
                <Input 
                  placeholder="Enter tokybook.com URL or paste multiple file URLs (one per line)" 
                  value={url}
                  onChange={handleUrlChange}
                  disabled={loading}
                  className="bg-[#121212] border-0 text-white placeholder:text-gray-400"
                />
                <Button 
                  onClick={handleLoadUrl} 
                  disabled={loading}
                  className="bg-white text-black hover:bg-gray-200 px-6"
                >
                  {loading ? 'Loading...' : 'Load'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {showWarning && (
            <div className="mb-6 p-4 bg-[#1E1E1E] rounded-xl">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-white" />
                <div>
                  <h3 className="text-white font-medium">Warning</h3>
                  <p className="text-gray-400">
                    The website you're trying to access doesn't support a secure connection. Proceed with caution.
                  </p>
                </div>
              </div>
            </div>
          )}

          {chapters.length > 0 && (
            <Card className="bg-[#1E1E1E] border-0 rounded-xl">
              <CardContent className="p-6">
                <h2 className="text-xl text-white mb-6">Available Files</h2>
                <div className="space-y-6">
                  {chapters.map((chapter: Chapter) => (
                    <div key={chapter.name} className="flex justify-between items-center">
                      <div>
                        <p className="text-white font-medium">{chapter.name}</p>
                        <p className="text-gray-400">Size: {chapter.size}</p>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-white">Time: {chapter.duration}</p>
                          <p className="text-gray-400">Speed: {chapter.speed}</p>
                        </div>
                        <Button 
                          onClick={() => handleDownload(chapter)}
                          disabled={downloadStatus[chapter.name]?.status === 'downloading'}
                          className="bg-white text-black hover:bg-gray-200"
                        >
                          <Download className="h-4 w-4" />
                          <span className="ml-2">Download</span>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 pt-6 border-t border-[#2E2E2E]">
                  <Button 
                    onClick={handleDownloadAll} 
                    className="w-full bg-white text-black hover:bg-gray-200 py-6"
                  >
                    <Download className="mr-2 h-5 w-5" />
                    Download All Files
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </ThemeProvider>
  )
}

