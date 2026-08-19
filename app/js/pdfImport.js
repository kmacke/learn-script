/**
 * Extract reading-order text from a PDF ArrayBuffer using pdf.js from a CDN.
 */
export async function extractPdfText(arrayBuffer) {
  const pdfjs = await loadPdfJs();
  const task = pdfjs.getDocument({ data: arrayBuffer });
  const pdf = await task.promise;
  const pages = [];
  for (let n = 1; n <= pdf.numPages; n += 1) {
    const page = await pdf.getPage(n);
    const content = await page.getTextContent();
    pages.push(itemsToText(content.items));
  }
  return pages.join("\n\n");
}

function itemsToText(items) {
  const rows = [];
  let lastY = null;
  let buf = [];
  for (const item of items) {
    const y = item.transform ? item.transform[5] : 0;
    const str = item.str || "";
    if (lastY != null && Math.abs(y - lastY) > 4) {
      rows.push(buf.join(" ").replace(/\s+/g, " ").trim());
      buf = [];
    }
    buf.push(str);
    lastY = y;
  }
  if (buf.length) rows.push(buf.join(" ").replace(/\s+/g, " ").trim());
  return rows.filter(Boolean).join("\n");
}

let pdfJsPromise = null;
function loadPdfJs() {
  if (pdfJsPromise) return pdfJsPromise;
  pdfJsPromise = import("https://cdn.jsdelivr.net/npm/pdfjs-dist@4.8.69/build/pdf.min.mjs")
    .then((mod) => {
      const pdfjs = mod.default || mod;
      pdfjs.GlobalWorkerOptions.workerSrc =
        "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.8.69/build/pdf.worker.min.mjs";
      return pdfjs;
    })
    .catch((err) => {
      pdfJsPromise = null;
      throw err;
    });
  return pdfJsPromise;
}
