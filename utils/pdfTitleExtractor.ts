/**
 * Client-side PDF title extraction using pdfjs-dist.
 * Tries PDF metadata first, then falls back to first-page text heuristic.
 * Returns null if extraction fails.
 */

let pdfjsLib: any = null;

const loadPdfJs = async () => {
  if (pdfjsLib) return pdfjsLib;
  pdfjsLib = await import('pdfjs-dist');
  // Use a CDN worker to avoid bundling issues in Vite
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
  return pdfjsLib;
};

/**
 * Clean a raw text string into a candidate thesis title.
 * Removes page markers, URLs, single-char lines, etc.
 */
const cleanCandidate = (text: string): string => {
  return text
    .replace(/\r?\n+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
};

const isLikelyTitle = (line: string): boolean => {
  const t = line.trim();
  if (!t || t.length < 5 || t.length > 300) return false;
  if (/^(page|www\.|http|©|abstract|chapter|section|\d+\.)/i.test(t)) return false;
  if (/^\d+$/.test(t)) return false;
  return true;
};

/**
 * Extract thesis title from a PDF File object.
 * Strategy:
 *  1. Read PDF metadata `info.Title`
 *  2. If empty, scan first page text items for the largest-font or first substantive line
 */
export const extractThesisTitleFromFile = async (file: File): Promise<string | null> => {
  try {
    const pdfjs = await loadPdfJs();
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;

    // ── Strategy 1: PDF metadata title ───────────────────────────────────
    const metadata = await pdf.getMetadata().catch(() => null);
    const metaTitle = (metadata?.info as any)?.Title?.trim();
    if (metaTitle && metaTitle.length > 5 && metaTitle.length < 300) {
      return metaTitle;
    }

    // ── Strategy 2: First-page text heuristic ────────────────────────────
    const page = await pdf.getPage(1);
    const textContent = await page.getTextContent();

    // Collect items with their font sizes
    const items: { text: string; fontSize: number; y: number }[] = [];
    for (const item of textContent.items as any[]) {
      const str = (item.str || '').trim();
      if (!str) continue;
      const fontSize = item.transform ? Math.abs(item.transform[0]) : 0;
      const y = item.transform ? item.transform[5] : 0;
      items.push({ text: str, fontSize, y: Math.round(y) });
    }

    if (items.length === 0) return null;

    // Group items by Y position (same line) then sort top-to-bottom (PDF coords: larger Y = higher)
    const lineMap: Map<number, { texts: string[]; fontSize: number }> = new Map();
    for (const item of items) {
      const existing = lineMap.get(item.y);
      if (existing) {
        existing.texts.push(item.text);
        existing.fontSize = Math.max(existing.fontSize, item.fontSize);
      } else {
        lineMap.set(item.y, { texts: [item.text], fontSize: item.fontSize });
      }
    }

    // Sort lines by Y descending (top of page first in PDF coords)
    const sortedLines = [...lineMap.entries()]
      .sort((a, b) => b[0] - a[0])
      .map(([, v]) => ({ text: v.texts.join(' '), fontSize: v.fontSize }));

    // Find the line with the largest font size that looks like a title
    const maxFont = Math.max(...sortedLines.map(l => l.fontSize));
    const largeLines = sortedLines.filter(l => l.fontSize >= maxFont * 0.85 && isLikelyTitle(l.text));

    if (largeLines.length > 0) {
      // Merge consecutive large-font lines as one title (multi-line titles)
      const titleParts: string[] = [largeLines[0].text];
      for (let i = 1; i < largeLines.length && i < 4; i++) {
        if (largeLines[i].fontSize >= maxFont * 0.85) {
          titleParts.push(largeLines[i].text);
        }
      }
      return cleanCandidate(titleParts.join(' '));
    }

    // Fallback: first non-trivial line
    const firstMeaningful = sortedLines.find(l => isLikelyTitle(l.text));
    return firstMeaningful ? cleanCandidate(firstMeaningful.text) : null;

  } catch (err) {
    console.warn('PDF title extraction failed:', err);
    return null;
  }
};

/**
 * Normalize a title for comparison (duplicate detection).
 * Lowercases, trims, collapses whitespace, removes common punctuation.
 */
export const normalizeTitle = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};
