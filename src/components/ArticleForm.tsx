"use client";

import { Input } from '@/components/ui/input';
import { LoadingButton } from './ui/loading-button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Toaster } from '@/components/ui/sonner'

import Link from 'next/link';
import { toast } from "sonner"
import React, { useState, useEffect } from 'react';

const ArticleForm: React.FC = () => {
  const [url, setUrl] = useState<string>('');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [disabled, setDisabled] = useState<boolean>(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setDisabled(true);
      const response = await fetch('https://fromurl-rno6goyjqq-wl.a.run.app/create', {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url })
      });

      if (!response.ok) {
        toast("Internal server error, please try again later.");
        setLoading(false)
        setDisabled(false)
        throw new Error();
      }

      const blob = await response.blob();
      const audioUrl = URL.createObjectURL(blob);
      setAudioUrl(audioUrl);
      setLoading(false);
      setDisabled(false);
    } catch (error) {
      console.error("Error fetching content:", error);
    }
  };

  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  useEffect(() => {
    // Check if URL is empty or not a valid URL
    setDisabled(!(url.trim()));
  }, [url]);

  return (
    <>
    <Toaster />
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
                  id="url"
                  value={url}
                  placeholder="Enter the URL of an article"
                  required
                  type="url"
                  onChange={(e) => setUrl(e.target.value)}
                />
              </div>
              <div className='p-3'>
                <LoadingButton className="w-full" loading={loading} disabled={disabled} >Submit</LoadingButton>
              </div>
            </form>
            <div className='text-blue-600 underline pb-3'>
              <Link href='/pdf'>
                <p>or upload a PDF</p>
              </Link>
            </div>
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

export default ArticleForm;
