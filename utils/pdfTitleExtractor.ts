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
  // Exclude common university headers/metadata that aren't the thesis title
  const lower = t.toLowerCase();
  const exclusions = [
    'university', 'directorate', 'postgraduate', 'management', 'system',
    'department', 'faculty', 'institute', 'submitted', 'requirement',
    'degree', 'phil', 'phd', 'session', 'semester', 'roll no', 'reg no',
    'supervisor', 'by:', 'author', 'page', 'www.', 'http', '©'
  ];
  if (exclusions.some(exc => lower.includes(exc))) return false;
  if (/^\d+$/.test(t)) return false;
  return true;
};

/**
 * Extract thesis title from a PDF File object.
 * Strategy:
 *  1. Read PDF metadata `info.Title`
 *  2. Search top 40% of page 1 for the most prominent text block
 */
export const extractThesisTitleFromFile = async (file: File): Promise<string | null> => {
  try {
    const pdfjs = await loadPdfJs();
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;

    // Try metadata first
    const metadata = await pdf.getMetadata().catch(() => null);
    const metaTitle = (metadata?.info as any)?.Title?.trim();
    if (metaTitle && metaTitle.length > 10 && metaTitle.length < 300 && !metaTitle.includes('Microsoft Word')) {
      return metaTitle;
    }

    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 1.0 });
    const pageHeight = viewport.height;
    const textContent = await page.getTextContent();

    const items: { text: string; fontSize: number; y: number }[] = [];
    for (const item of textContent.items as any[]) {
      const str = (item.str || '').replace(/\s+/g, ' ').trim();
      if (!str) continue;
      const fontSize = item.transform ? Math.abs(item.transform[0]) : 0;
      const y = item.transform ? item.transform[5] : 0;
      // Focus on the top 40% of the page
      if (y > pageHeight * 0.6) {
        items.push({ text: str, fontSize, y: Math.round(y) });
      }
    }

    if (items.length === 0) return null;

    // Group by line (Y coordinate)
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

    // Sort top-to-bottom
    const sortedLines = [...lineMap.entries()]
      .sort((a, b) => b[0] - a[0])
      .map(([, v]) => ({ text: v.texts.join(' '), fontSize: v.fontSize }));

    // Find the most prominent (largest font) among likely titles
    const candidates = sortedLines.filter(l => isLikelyTitle(l.text));
    if (candidates.length === 0) return null;

    const maxFont = Math.max(...candidates.map(l => l.fontSize));
    const prominentLines = sortedLines.filter(l => l.fontSize >= maxFont * 0.8 && isLikelyTitle(l.text));

    if (prominentLines.length > 0) {
      // Merge consecutive prominent lines (they likely form the multi-line title)
      const titleParts: string[] = [];
      const firstLineIndex = sortedLines.indexOf(prominentLines[0]);
      
      for (let i = firstLineIndex; i < Math.min(firstLineIndex + 5, sortedLines.length); i++) {
        const line = sortedLines[i];
        if (line.fontSize >= maxFont * 0.7 && isLikelyTitle(line.text)) {
          titleParts.push(line.text);
        } else if (titleParts.length > 0) {
          break; // Stop once we hit a non-prominent line after starting
        }
      }
      return cleanCandidate(titleParts.join(' '));
    }

    return candidates[0] ? cleanCandidate(candidates[0].text) : null;

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
