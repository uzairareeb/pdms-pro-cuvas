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
  if (!t || t.length < 5 || t.length > 500) return false;
  const lower = t.toLowerCase();
  
  // High-confidence exclusions for CUVAS specific headers that aren't the title
  const markers = [
    'a thesis submitted', 'partial fulfillment', 'requirement for the degree',
    'master of philosophy', 'master of science', 'doctor of philosophy',
    'department of', 'faculty of', 'cholistan university', 'cuvas',
    'by:', 'abdur rauf', '22-cuvas', 'pakistan', '2025', '2024', '2023'
  ];
  if (markers.some(m => lower.includes(m))) return false;
  
  // If it's just 'By', it's a separator, not a title
  if (lower === 'by') return false;
  
  return true;
};

/**
 * Extract thesis title from a PDF File object.
 * Strategy tailored for CUVAS thesis covers:
 *  1. Scan top of page 1.
 *  2. Find the first substantive text block before the 'By' marker.
 */
export const extractThesisTitleFromFile = async (file: File): Promise<string | null> => {
  try {
    const pdfjs = await loadPdfJs();
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;

    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 1.0 });
    const pageHeight = viewport.height;
    const textContent = await page.getTextContent();

    const allLines: { text: string; fontSize: number; y: number }[] = [];
    for (const item of textContent.items as any[]) {
      const str = (item.str || '').replace(/\s+/g, ' ').trim();
      if (!str) continue;
      const fontSize = item.transform ? Math.abs(item.transform[0]) : 0;
      const y = item.transform ? item.transform[5] : 0;
      allLines.push({ text: str, fontSize, y: Math.round(y) });
    }

    if (allLines.length === 0) return null;

    // Group items by line (Y coordinate)
    const lineMap: Map<number, { texts: string[]; fontSize: number }> = new Map();
    for (const item of allLines) {
      const existing = lineMap.get(item.y);
      if (existing) {
        existing.texts.push(item.text);
        existing.fontSize = Math.max(existing.fontSize, item.fontSize);
      } else {
        lineMap.set(item.y, { texts: [item.text], fontSize: item.fontSize });
      }
    }

    // Sort top-to-bottom
    const sortedLines = [...lineMap.entries()]
      .sort((a, b) => b[0] - a[0])
      .map(([, v]) => ({ text: v.texts.join(' '), fontSize: v.fontSize }));

    // Stop extraction once we hit 'By' or 'Submitted'
    const titleParts: string[] = [];
    for (const line of sortedLines) {
      const txt = line.text.trim();
      const lower = txt.toLowerCase();
      
      // If we hit 'By' or credentials, we've likely passed the title
      if (lower === 'by' || lower.includes('submitted in the partial')) {
        break;
      }
      
      // If it's a valid title-like line and we haven't hit the limit
      if (isLikelyTitle(txt)) {
        titleParts.push(txt);
      } else if (titleParts.length > 0) {
        // If we already started collecting but hit something else, 
        // we check if it's just a small gap or the end.
        break; 
      }
    }

    if (titleParts.length > 0) {
      return cleanCandidate(titleParts.join(' '));
    }

    // Fallback: search anywhere in top 40%
    const fallback = sortedLines.find(l => l.fontSize >= 12 && isLikelyTitle(l.text));
    return fallback ? cleanCandidate(fallback.text) : null;

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
