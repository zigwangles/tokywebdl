"use client"

import * as React from "react"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert"
import { Download, AlertTriangle } from "lucide-react"
import { ThemeToggle } from "../components/ThemeToggle"
import { ThemeProvider } from "next-themes"

interface Chapter {
  name: string;
  chapter_link_dropbox: string;
  size?: string;
  duration?: string;
  speed?: string;
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

  // Update URL and check security
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setUrl(newUrl);
    setShowWarning(newUrl.length > 0 && !newUrl.startsWith('https://'));
  };

  const handleLoadUrl = async () => {
    if (!url) {
      setError("Please enter a valid Tokybook URL")
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      // For demo purposes, simulate loading with sample data
      setTimeout(() => {
        const sampleChapters: Chapter[] = [
          {
            name: "File 1.mp3", 
            chapter_link_dropbox: "https://example.com/file1.mp3",
            size: "10 MB",
            duration: "2:30",
            speed: "1.2 MB/s"
          },
          {
            name: "File 2.mp3", 
            chapter_link_dropbox: "https://example.com/file2.mp3",
            size: "15 MB",
            duration: "3:45",
            speed: "1.5 MB/s"
          }
        ];
        
        setChapters(sampleChapters);
        
        // Initialize download status for each chapter
        const initialStatus: Record<string, DownloadStatus> = {}
        sampleChapters.forEach((chapter: Chapter) => {
          initialStatus[chapter.name] = { status: 'idle', progress: 0 }
        })
        setDownloadStatus(initialStatus)
        setLoading(false);
      }, 1000);
      
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
    
    // Simulate download
    setTimeout(() => {
      setDownloadStatus((prev: Record<string, DownloadStatus>) => ({
        ...prev,
        [chapter.name]: { 
          status: 'completed', 
          progress: 100,
          url: chapter.chapter_link_dropbox
        }
      }))
    }, 2000);
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
      <main className="container mx-auto p-4 bg-black text-white min-h-screen">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Tokydl</h1>
          <ThemeToggle />
        </div>
        
        <Card className="max-w-2xl mx-auto bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle>Import Tokybook URL</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-2">
              <Input 
                placeholder="Enter tokybook.com URL" 
                value={url}
                onChange={handleUrlChange}
                disabled={loading}
                className="bg-gray-800 border-gray-700"
              />
              <Button onClick={handleLoadUrl} disabled={loading} className="bg-gray-700 hover:bg-gray-600">
                {loading ? 'Loading...' : 'Load'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {showWarning && (
          <Card className="mt-6 max-w-2xl mx-auto bg-gray-900 border-gray-800">
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-yellow-400">Warning</h3>
                  <p className="text-sm text-gray-300 mt-1">
                    The website you're trying to access doesn't support a secure connection. Proceed with caution.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {chapters.length > 0 && (
          <Card className="mt-6 max-w-2xl mx-auto bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle>Available Files</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {chapters.map((chapter: Chapter) => (
                  <div key={chapter.name} className="border-b border-gray-800 pb-4">
                    <div className="flex justify-between items-center gap-4">
                      <div>
                        <p className="font-medium">{chapter.name}</p>
                        <p className="text-sm text-gray-400">Size: {chapter.size}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-300">Time: {chapter.duration}</p>
                        <p className="text-sm text-gray-400">Speed: {chapter.speed}</p>
                      </div>
                      <Button 
                        onClick={() => handleDownload(chapter)}
                        className="bg-gray-700 hover:bg-gray-600"
                        disabled={downloadStatus[chapter.name]?.status === 'downloading'}
                      >
                        <Download className="h-4 w-4" />
                        <span className="ml-2">Download</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter className="border-t border-gray-800 pt-4">
              <Button 
                onClick={handleDownloadAll} 
                className="w-full flex justify-center items-center bg-gray-800 hover:bg-gray-700 py-6"
              >
                <Download className="mr-2 h-5 w-5" />
                <span>Download All Files</span>
              </Button>
            </CardFooter>
          </Card>
        )}
      </main>
    </ThemeProvider>
  )
}

