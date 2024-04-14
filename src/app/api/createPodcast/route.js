import OpenAI from 'openai';
import puppeteer from 'puppeteer';
import { JSDOM } from 'jsdom'

export async function POST(request) {
    let browser;
    const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });

    const { url } = await request.json();
    try {
        const bdCreds = `${process.env.BRIGHT_DATA_USERNAME}:${process.env.BRIGHT_DATA_PASSWORD}`;
        browser = await puppeteer.connect({
            browserWSEndpoint: `wss://${bdCreds}@zproxy.lum-superproxy.io:9222`,
            ignoreHTTPSErrors: true,
        });

        const page = await browser.newPage();
        page.setDefaultNavigationTimeout(2 * 60 * 1000);

        await page.goto(url, { waitUntil: 'networkidle2' });
        const html = await page.evaluate(() => document.body.innerHTML);

        const processedHtml = getText(html);

        const chatResponse = await openai.chat.completions.create({
            model: "gpt-4-0125-preview",
            messages: [
                {
                    role: 'system',
                    content: `You are an AI assistant whose job is to extract the article's text/body from its raw HTML and 
                    output the script for a podcast. Output only the text from the articles 'body'. Do not output comments,
                    HTML tags, or the title. Everything you output will be sent to a TTS, so numbers must be converted to words.
                    Also, emojies must be removed. All the text you output will be spoken. You need to convert everything to words that
                    can be spoken by a TTS without sounding weird to the listener. The text you output must be the article, all your job is
                    is to extract the body from the HTML of the article, and output the podcast for it without illegal characters, phrases, etc.
                    You should not change anything in the article other than illegal phrases for the tts. So for example '1,000,000' should be
                    outputted as 'one million'. Everything you output will be spoken!`
                },
                { role: 'user', content: `Extract the body text of this article from this html, only return text: ${processedHtml}` }
            ],
            temperature: 1,
        });

        const podcastText = chatResponse.choices[0].message.content;

        return processAudio(podcastText, openai);
    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ error: err.toString() }), {
            status: 500,
            headers: {
                "Content-Type": "application/json",
            },
        });
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

function getText(html) {
    const dom = new JSDOM(html);
    const document = dom.window.document;

    document.querySelectorAll('script, style, link[rel="stylesheet"]').forEach(element => element.remove());

    document.querySelectorAll('[style]').forEach(element => element.removeAttribute('style'));

    let textContent = document.body.textContent || "";

    textContent = textContent.replace(/\s+/g, ' ').trim();

    return textContent;
}

async function processAudio(text, openai) {
    const maxCharacters = 4090;
    let audioChunks = [];
    for (let i = 0; i < text.length; i += maxCharacters) {
        const chunk = text.substring(i, Math.min(text.length, i + maxCharacters));
        const speechResponse = await openai.audio.speech.create({
            model: "tts-1",
            voice: "alloy",
            input: chunk,
        });
        const buffer = Buffer.from(await speechResponse.arrayBuffer());
        audioChunks.push(buffer);
    }

    if (audioChunks.length === 1) {
        return new Response(audioChunks[0], {
            status: 200,
            headers: {
                "Content-Type": "audio/mpeg",
            },
        });
    } else {
        // If more than one chunk, concatenate them. Assume all chunks are of the same file format (MPEG).
        const concatenatedAudio = Buffer.concat(audioChunks);
        return new Response(concatenatedAudio, {
            status: 200,
            headers: {
                "Content-Type": "audio/mpeg",
            },
        });
    }
}