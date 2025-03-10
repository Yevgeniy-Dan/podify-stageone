"use client";

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';

import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { LoadingButton } from './ui/loading-button';

declare const pdfjsLib: any;

const PdfForm = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [pdfText, setPdfText] = useState<any>(null);
  const [pdfTitle, setPdfTitle] = useState<any>(null);
  const [disabled, setDisabled] = useState<boolean>(true);

  function onFileChange(event: any) {
    const file = event.target.files[0];
    setPdfTitle(file.name)
    const fileReader = new FileReader();
    fileReader.onload = onLoadFile;
    fileReader.readAsArrayBuffer(file);
    setDisabled(false); 
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
      const response = await fetch('https://frompdf-rno6goyjqq-wl.a.run.app/create', {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: pdfText, title: pdfTitle })
      });

      if (!response.ok) {
        toast("Internal server error, please try again later.");
        setLoading(false)
        setDisabled(false)
        throw new Error();
      }

      const data = await response.json();
      setAudioUrl(data.audioURL);
      setPdfTitle(data.title); 
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
            Upload a PDF, and we'll convert it into a Podcast for you.
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
            <CardTitle>{pdfTitle}</CardTitle>
            <CardDescription>User Uploaded</CardDescription>
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