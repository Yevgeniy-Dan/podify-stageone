"use client"

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { LoadingButton } from './ui/loading-button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"

const InputForm: React.FC = () => {
  const [url, setUrl] = useState<string>('');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true)
      const response = await fetch('https://us-west2-tiktok-savesound.cloudfunctions.net/podify/create', {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url })
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const blob = await response.blob();
      const audioUrl = URL.createObjectURL(blob);
      setAudioUrl(audioUrl);
      setLoading(false)
    } catch (error) {
      console.error("Error fetching content:", error);
    }
  };

  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  return (
    <>
    <div className="flex flex-col items-center space-y-4 m-10">
      <Card className="w-full max-w-2xl space-y-4 text-center">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold pt-3 p-1">Convert any article into a podcast</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Enter the URL of a news article and we'll generate a podcast for you.
          </p>
        </div>
        <div className="space-y-2">
        <form onSubmit={handleSubmit}>
          <div className="space-y-2 pl-3 pr-3 pt-2">
            <Label className="sr-only" htmlFor="url">
              Enter the URL of a news article
            </Label>
              <Input
                className="2-full"
                id="url" value={url}
                placeholder="Enter the URL of a article"
                required
                type="url" 
                onChange={(e) => setUrl(e.target.value)} 
                />
           </div>
            <div className='p-3'>
              <LoadingButton className="w-full" loading={loading} >Submit</LoadingButton>
            </div>
          </form>
        </div>
      </Card>
      {audioUrl &&
      <Card className="w-full">
          <CardHeader className="flex items-center gap-2">
            <CardTitle>Podcast Name</CardTitle>
            <CardDescription>Podcast Artist</CardDescription>
          </CardHeader>
          <CardContent className="grid items-center gap-4">
            <audio className="w-full" controls src={audioUrl}>
            </audio>
          </CardContent>
        </Card>
        }
    </div>
  </>
  );
};

export default InputForm;