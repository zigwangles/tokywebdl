"use client"

import * as React from "react"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert"
import { Download, AlertTriangle, Pause, Play } from "lucide-react"
import { ThemeToggle } from "../components/ThemeToggle"
import { ThemeProvider } from "next-themes"
import { Progress } from "@/components/ui/progress"

interface Chapter {
  name: string;
  chapter_link_dropbox: string;
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
  const [isPaused, setIsPaused] = React.useState(false)

  const handleLoadUrl = async () => {
    if (!url || !url.includes('tokybook.com')) {
      setError("Please enter a valid Tokybook URL")
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/tokybook/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to extract chapters')
      }
      
      setChapters(data.chapters)
      
      // Initialize download status for each chapter
      const initialStatus: Record<string, DownloadStatus> = {}
      data.chapters.forEach((chapter: Chapter) => {
        initialStatus[chapter.name] = { status: 'idle', progress: 0 }
      })
      setDownloadStatus(initialStatus)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
    } finally {
      setLoading(false)
    }
  }
  
  const handleDownload = async (chapter: Chapter) => {
    setDownloadStatus((prev: Record<string, DownloadStatus>) => ({
      ...prev,
      [chapter.name]: { ...prev[chapter.name], status: 'downloading', progress: 0 }
    }))
    
    try {
      const response = await fetch('/api/tokybook/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chapter, folderName: 'MP3' })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to download chapter')
      }
      
      // Simulating downloading with a direct URL for the client
      if (data.downloadUrl) {
        // In a real app, we'd stream the file to the user
        // Here we just provide a link to download directly
        setDownloadStatus((prev: Record<string, DownloadStatus>) => ({
          ...prev,
          [chapter.name]: { 
            status: 'completed', 
            progress: 100,
            url: data.downloadUrl
          }
        }))
      }
    } catch (err) {
      setDownloadStatus((prev: Record<string, DownloadStatus>) => ({
        ...prev,
        [chapter.name]: { 
          status: 'error', 
          progress: 0,
          error: err instanceof Error ? err.message : 'Download failed'
        }
      }))
    }
  }
  
  const handleDownloadAll = async () => {
    // Toggle pause/resume if already downloading
    if (Object.values(downloadStatus).some((item) => (item as DownloadStatus).status === 'downloading')) {
      setIsPaused(!isPaused)
      return
    }
    
    // Start downloading all chapters one by one
    for (const chapter of chapters) {
      if (isPaused) {
        // Wait for resume
        await new Promise(resolve => {
          const checkPaused = () => {
            if (!isPaused) {
              resolve(true)
            } else {
              setTimeout(checkPaused, 100)
            }
          }
          checkPaused()
        })
      }
      
      if (downloadStatus[chapter.name]?.status !== 'completed') {
        await handleDownload(chapter)
      }
    }
  }
  
  const getDownloadText = () => {
    if (Object.values(downloadStatus).some((item) => (item as DownloadStatus).status === 'downloading')) {
      return isPaused ? 'Resume Downloads' : 'Pause Downloads'
    }
    return 'Download All Files'
  }
  
  const getDownloadIcon = () => {
    if (Object.values(downloadStatus).some((item) => (item as DownloadStatus).status === 'downloading')) {
      return isPaused ? <Play className="mr-2 h-4 w-4" /> : <Pause className="mr-2 h-4 w-4" />
    }
    return <Download className="mr-2 h-4 w-4" />
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <main className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Tokydl</h1>
          <ThemeToggle />
        </div>
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Import Tokybook URL</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-2">
              <Input 
                placeholder="Enter tokybook.com URL" 
                value={url}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUrl(e.target.value)}
                disabled={loading}
              />
              <Button onClick={handleLoadUrl} disabled={loading}>
                {loading ? 'Loading...' : 'Load'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {error && (
          <Alert variant="destructive" className="mt-8 max-w-2xl mx-auto">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {chapters.length > 0 && (
          <Card className="mt-8 max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Available Files ({chapters.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {chapters.map((chapter: Chapter) => (
                  <FileItem 
                    key={chapter.name}
                    name={chapter.name}
                    status={downloadStatus[chapter.name]?.status || 'idle'}
                    progress={downloadStatus[chapter.name]?.progress || 0}
                    url={downloadStatus[chapter.name]?.url}
                    error={downloadStatus[chapter.name]?.error}
                    onDownload={() => handleDownload(chapter)}
                  />
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={handleDownloadAll}>
                {getDownloadIcon()} {getDownloadText()}
              </Button>
            </CardFooter>
          </Card>
        )}
      </main>
    </ThemeProvider>
  )
}

interface FileItemProps {
  key?: string;
  name: string;
  status: 'idle' | 'downloading' | 'completed' | 'error';
  progress: number;
  url?: string;
  error?: string;
  onDownload: () => void;
}

function FileItem({ name, status, progress, url, error, onDownload }: FileItemProps) {
  return (
    <li className="flex flex-col gap-2">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
        <div className="flex-grow">
          <p className="font-medium">{name}</p>
          <p className="text-sm text-muted-foreground">
            Status: {status === 'idle' ? 'Ready' : status.charAt(0).toUpperCase() + status.slice(1)}
            {error && <span className="text-red-500"> - {error}</span>}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {status === 'completed' && url ? (
            <a 
              href={url} 
              download={name + '.mp3'} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center h-9 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground ring-offset-background hover:bg-primary/90"
            >
              <Download className="mr-2 h-4 w-4" /> Download
            </a>
          ) : (
            <Button 
              size="sm" 
              onClick={onDownload} 
              disabled={status === 'downloading'}
            >
              {status === 'downloading' ? 'Downloading...' : 'Download'}
            </Button>
          )}
        </div>
      </div>
      {status === 'downloading' && (
        <Progress value={progress} className="w-full" />
      )}
    </li>
  )
}

