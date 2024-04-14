import { JSDOM } from 'jsdom';

export default async function extractText(html) {
    const dom = new JSDOM(html);
    const document = dom.window.document;

    const selectors = ['article', 'main', '.article', '.post-content', '#main-content', 'div[role="main"]'];
    let articleElement = null;

    for (let selector of selectors) {
        articleElement = document.querySelector(selector);
        if (articleElement) break;
    }

    if (!articleElement) {
        articleElement = document.body;
    }

    articleElement.querySelectorAll('script, style, nav, header, footer, .footer, .header, aside').forEach(e => e.remove());

    let textContent = articleElement.textContent || '';

    textContent = textContent.replace(/\s+/g, ' ').trim();

    return textContent;
}