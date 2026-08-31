import { pdfRenderer } from './pdfRenderer.js';
import { docxRenderer } from './docxRenderer.js';
import { markdownRenderer } from './markdownRenderer.js';
import { txtRenderer } from './txtRenderer.js';
import { REPORT_FORMATS } from '../../../constants/contentTypes.js';

export const documentRenderer = {
  /**
   * Dispatches structured report to appropriate format renderer.
   *
   * @param {object} structuredReport
   * @param {string} format - 'PDF' | 'DOCX' | 'MARKDOWN' | 'TXT'
   * @returns {Promise<{ buffer: Buffer, mimeType: string, extension: string, isBinary: boolean, textContent?: string }>}
   */
  async renderDocument(structuredReport, format = 'PDF') {
    const fmt = (format || 'PDF').toUpperCase();

    switch (fmt) {
      case REPORT_FORMATS.PDF: {
        const buffer = await pdfRenderer.render(structuredReport);
        return {
          buffer,
          mimeType: 'application/pdf',
          extension: 'pdf',
          isBinary: true
        };
      }

      case REPORT_FORMATS.DOCX: {
        const buffer = await docxRenderer.render(structuredReport);
        return {
          buffer,
          mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          extension: 'docx',
          isBinary: true
        };
      }

      case REPORT_FORMATS.MARKDOWN: {
        const textContent = markdownRenderer.render(structuredReport);
        const buffer = Buffer.from(textContent, 'utf-8');
        return {
          buffer,
          textContent,
          mimeType: 'text/markdown',
          extension: 'md',
          isBinary: false
        };
      }

      case REPORT_FORMATS.TXT: {
        const textContent = txtRenderer.render(structuredReport);
        const buffer = Buffer.from(textContent, 'utf-8');
        return {
          buffer,
          textContent,
          mimeType: 'text/plain',
          extension: 'txt',
          isBinary: false
        };
      }

      default:
        throw new Error(`Unsupported document format: ${format}`);
    }
  }
};
