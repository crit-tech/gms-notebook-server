import { promises as fs } from "fs";
import pdf from "pdf-parse-fork";

interface RenderOptions {
  normalizeWhitespace: boolean;
  disableCombineTextItems: boolean;
}

interface PageItem {
  str: string;
  transform: number[];
}

interface PageTextContent {
  items: PageItem[];
}

interface PageData {
  getTextContent: (renderOptions: RenderOptions) => Promise<PageTextContent>;
}

export const pdf2Text = async (localPdf: string): Promise<string[]> => {
  const pdfData = await fs.readFile(localPdf);

  const pageText: string[] = [];

  function renderPage(pageData: PageData): Promise<string> {
    const renderOptions = {
      //replaces all occurrences of whitespace with standard spaces (0x20). The default value is `false`.
      normalizeWhitespace: true,
      //do not attempt to combine same line TextItem's. The default value is `false`.
      disableCombineTextItems: false,
    };

    return pageData.getTextContent(renderOptions).then((textContent) => {
      let lastY,
        text = "";
      for (const item of textContent.items) {
        if (lastY == item.transform[5] || !lastY) {
          text += item.str;
        } else {
          text += "\n" + item.str;
        }
        lastY = item.transform[5];
      }

      pageText.push(text);
      return text;
    });
  }

  await pdf(pdfData, { pagerender: renderPage });

  return pageText;
};

export default pdf2Text;
