"use client";

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { LoadingButton } from './ui/loading-button';

declare const pdfjsLib: any;

const PdfForm = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [pdfText, setPdfText] = useState<any>(null);
  const [disabled, setDisabled] = useState<boolean>(true); // New state for disabling submit button

  function onFileChange(event: any) {
    const file = event.target.files[0];
    const fileReader = new FileReader();
    fileReader.onload = onLoadFile;
    fileReader.readAsArrayBuffer(file);
    setDisabled(false); // Enable the submit button when a file is uploaded
  }
  
  function onLoadFile(event: any) {
    const typedarray = new Uint8Array(event.target.result);
    pdfjsLib.getDocument({ data: typedarray }).promise.then((pdf: any) => {
      let text = "";
      const totalPages = pdf.numPages;
      let promises: Promise<any>[] = [];
      
      for (let i = 1; i <= totalPages; i++) {
        promises.push(
          pdf.getPage(i).then((page: any) => {
            return page.getTextContent().then((content: any) => {
              content.items.forEach((item: any) => {
                text += item.str + " ";
              });
            });
          })
        );
      }
      Promise.all(promises).then(() => {
        setPdfText(text);
      });
    });
  }
  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true)
      setDisabled(true)
      const response = await fetch('https://us-west2-podify-420416.cloudfunctions.net/fromPDF/create', {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: pdfText })
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const blob = await response.blob();
      const audioUrl = URL.createObjectURL(blob);
      setAudioUrl(audioUrl);
      setLoading(false);
      setDisabled(false)
    } catch (error) {
      console.error("Error fetching content:", error);
      setLoading(false);
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
          <h1 className="text-3xl font-bold pt-3 p-1">Convert any PDF into a podcast</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Upload a PDF, and we&apos;ll convert it into a Podcast for you.
          </p>
        </div>
        <div className="space-y-2">
        <form onSubmit={handleSubmit}>
          <div className="space-y-2 pl-3 pr-3 pt-2">
            <Input
              className="block w-full text-sm text-gray-900 border hover:border-gray-400 transition-all cursor-pointer hover:bg-gray-100 border-gray-300 border-dashed rounded-lg bg-gray-50 dark:text-gray-400 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400"
              type='file'
              id='file'
              name='file'
              accept='.pdf'
              onChange={onFileChange}
            />
           </div>
            <div className='p-3'>
              <LoadingButton className="w-full" loading={loading} disabled={disabled}>Submit</LoadingButton>
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
}

export default PdfForm;
