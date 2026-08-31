import PDFDocument from 'pdfkit';

/**
 * Brand Color Palette
 */
const COLORS = {
  NAVY: '#171e19',
  CHARCOAL: '#302b2f',
  SAGE: '#b7c6c2',
  LIGHT_BG: '#f4f6f5',
  WHITE: '#ffffff',
  TAUPE: '#7a7078',
  EMERALD: '#1b4d3e',
  BORDER: '#d1d8d5'
};

export const pdfRenderer = {
  /**
   * Generates a PDF Buffer from the structured report data.
   *
   * @param {object} report - Structured report from reportBuilder
   * @returns {Promise<Buffer>}
   */
  async render(report) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margins: { top: 50, bottom: 50, left: 50, right: 50 },
          bufferPages: true,
          info: {
            Title: report.title || 'WrapAI Intelligence Report',
            Author: 'WrapAI Platform',
            Subject: report.metadata?.contentTitle || 'Meeting Report',
            Creator: 'WrapAI Document Engine'
          }
        });

        const buffers = [];
        doc.on('data', (chunk) => buffers.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', (err) => reject(err));

        const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
        const leftMargin = doc.page.margins.left;

        // ─── 1. Header Banner ─────────────────────────────────────────────
        doc
          .rect(leftMargin, 50, pageWidth, 4)
          .fill(COLORS.NAVY);

        doc.moveDown(0.8);

        doc
          .font('Helvetica-Bold')
          .fontSize(9)
          .fillColor(COLORS.TAUPE)
          .text('WRAPAI INTELLIGENCE REPORT', leftMargin, 60, { characterSpacing: 1.5 });

        doc
          .font('Helvetica-Bold')
          .fontSize(20)
          .fillColor(COLORS.NAVY)
          .text(report.title || 'Executive Meeting Report', { width: pageWidth });

        doc.moveDown(0.3);

        // ─── 2. Metadata Box ──────────────────────────────────────────────
        const meta = report.metadata || {};
        const metaY = doc.y;
        doc
          .rect(leftMargin, metaY, pageWidth, 42)
          .fillAndStroke(COLORS.LIGHT_BG, COLORS.BORDER);

        const colWidth = pageWidth / 4;
        const metaItems = [
          { label: 'SOURCE', value: meta.contentTitle ? (meta.contentTitle.slice(0, 20) + (meta.contentTitle.length > 20 ? '...' : '')) : 'Recording' },
          { label: 'DATE', value: meta.date ? new Date(meta.date).toLocaleDateString() : 'N/A' },
          { label: 'DURATION', value: meta.formattedDuration || 'N/A' },
          { label: 'PARTICIPANTS', value: String(meta.participantCount || 1) }
        ];

        metaItems.forEach((item, idx) => {
          const colX = leftMargin + idx * colWidth + 8;
          doc
            .font('Helvetica-Bold')
            .fontSize(7)
            .fillColor(COLORS.TAUPE)
            .text(item.label, colX, metaY + 8, { width: colWidth - 10 });
          doc
            .font('Helvetica')
            .fontSize(9)
            .fillColor(COLORS.CHARCOAL)
            .text(item.value, colX, metaY + 20, { width: colWidth - 10 });
        });

        doc.y = metaY + 54;

        // ─── 3. Render Sections ───────────────────────────────────────────
        (report.sections || []).forEach((sec) => {
          // Check for page break space
          if (doc.y > 680) doc.addPage();

          doc.moveDown(0.6);

          // Section Title
          doc
            .font('Helvetica-Bold')
            .fontSize(12)
            .fillColor(COLORS.NAVY)
            .text(sec.title.toUpperCase(), leftMargin, doc.y, { characterSpacing: 0.5 });

          const lineY = doc.y + 2;
          doc
            .moveTo(leftMargin, lineY)
            .lineTo(leftMargin + pageWidth, lineY)
            .strokeColor(COLORS.BORDER)
            .lineWidth(1)
            .stroke();

          doc.moveDown(0.6);

          // Section Content based on type
          switch (sec.type) {
            case 'paragraph': {
              doc
                .font('Helvetica')
                .fontSize(9.5)
                .fillColor(COLORS.CHARCOAL)
                .text(sec.content || '', {
                  width: pageWidth,
                  lineGap: 3,
                  align: 'justify'
                });
              break;
            }

            case 'topics': {
              (sec.items || []).forEach((t) => {
                if (doc.y > 700) doc.addPage();
                doc
                  .font('Helvetica-Bold')
                  .fontSize(9.5)
                  .fillColor(COLORS.NAVY)
                  .text(`• ${t.title} `, { continued: Boolean(t.timecode) });
                if (t.timecode) {
                  doc
                    .font('Helvetica-Oblique')
                    .fontSize(8)
                    .fillColor(COLORS.TAUPE)
                    .text(`[${t.timecode}]`);
                }
                if (t.summary) {
                  doc
                    .font('Helvetica')
                    .fontSize(8.5)
                    .fillColor(COLORS.CHARCOAL)
                    .text(`   ${t.summary}`, { width: pageWidth - 15, lineGap: 2 });
                }
                doc.moveDown(0.3);
              });
              break;
            }

            case 'decisions': {
              (sec.items || []).forEach((d) => {
                if (doc.y > 700) doc.addPage();
                const agreed = d.agreedBy?.length ? ` (Agreed by: ${d.agreedBy.join(', ')})` : '';
                doc
                  .font('Helvetica-Bold')
                  .fontSize(9.5)
                  .fillColor(COLORS.EMERALD)
                  .text(`[✓] ${d.title}`, { continued: Boolean(d.timecode) });
                if (d.timecode) {
                  doc
                    .font('Helvetica')
                    .fontSize(8)
                    .fillColor(COLORS.TAUPE)
                    .text(` — ${d.timecode}`);
                }
                if (d.description && d.description !== d.title) {
                  doc
                    .font('Helvetica')
                    .fontSize(8.5)
                    .fillColor(COLORS.CHARCOAL)
                    .text(`    ${d.description}${agreed}`, { width: pageWidth - 20, lineGap: 2 });
                }
                doc.moveDown(0.3);
              });
              break;
            }

            case 'action_items': {
              const tableY = doc.y;
              const rowHeight = 18;
              const colW = [pageWidth * 0.45, pageWidth * 0.22, pageWidth * 0.18, pageWidth * 0.15];

              // Table Header
              doc
                .rect(leftMargin, tableY, pageWidth, rowHeight)
                .fill(COLORS.LIGHT_BG);

              const headers = ['TASK', 'OWNER', 'DEADLINE', 'STATUS'];
              let curX = leftMargin;
              headers.forEach((h, i) => {
                doc
                  .font('Helvetica-Bold')
                  .fontSize(7.5)
                  .fillColor(COLORS.NAVY)
                  .text(h, curX + 4, tableY + 5, { width: colW[i] - 8 });
                curX += colW[i];
              });

              let curY = tableY + rowHeight;
              (sec.items || []).forEach((a) => {
                if (curY > 710) {
                  doc.addPage();
                  curY = 60;
                }
                doc
                  .rect(leftMargin, curY, pageWidth, rowHeight)
                  .strokeColor(COLORS.BORDER)
                  .stroke();

                let rx = leftMargin;
                const vals = [a.task, a.owner, a.deadline, a.status];
                vals.forEach((v, i) => {
                  doc
                    .font(i === 0 ? 'Helvetica-Bold' : 'Helvetica')
                    .fontSize(7.5)
                    .fillColor(COLORS.CHARCOAL)
                    .text(v ? String(v).slice(0, 35) : '-', rx + 4, curY + 5, { width: colW[i] - 8 });
                  rx += colW[i];
                });
                curY += rowHeight;
              });
              doc.y = curY + 6;
              break;
            }

            case 'key_points': {
              (sec.items || []).forEach((kp) => {
                if (doc.y > 700) doc.addPage();
                doc
                  .font('Helvetica-Bold')
                  .fontSize(9)
                  .fillColor(COLORS.NAVY)
                  .text(`• `, { continued: true })
                  .font('Helvetica')
                  .fillColor(COLORS.CHARCOAL)
                  .text(kp.text, { continued: Boolean(kp.timecode) });
                if (kp.timecode) {
                  doc
                    .font('Helvetica-Oblique')
                    .fontSize(7.5)
                    .fillColor(COLORS.TAUPE)
                    .text(` (${kp.timecode})`);
                }
                doc.moveDown(0.2);
              });
              break;
            }

            case 'highlights': {
              (sec.items || []).forEach((hl) => {
                if (doc.y > 700) doc.addPage();
                doc
                  .font('Helvetica-Bold')
                  .fontSize(9)
                  .fillColor(COLORS.NAVY)
                  .text(`★ ${hl.title}`, { continued: Boolean(hl.timecode) });
                if (hl.timecode) {
                  doc
                    .font('Helvetica-Oblique')
                    .fontSize(8)
                    .fillColor(COLORS.TAUPE)
                    .text(` [${hl.timecode}]`);
                }
                if (hl.description) {
                  doc
                    .font('Helvetica')
                    .fontSize(8.5)
                    .fillColor(COLORS.CHARCOAL)
                    .text(`   ${hl.description}`, { width: pageWidth - 15, lineGap: 1.5 });
                }
                doc.moveDown(0.2);
              });
              break;
            }

            case 'participants': {
              (sec.items || []).forEach((spk) => {
                if (doc.y > 700) doc.addPage();
                doc
                  .font('Helvetica-Bold')
                  .fontSize(8.5)
                  .fillColor(COLORS.NAVY)
                  .text(`• ${spk.name}`, { continued: true })
                  .font('Helvetica')
                  .fillColor(COLORS.TAUPE)
                  .text(` — ${spk.speakingTimeFormatted} (${spk.turnCount} turns)`);
                doc.moveDown(0.15);
              });
              break;
            }

            case 'questions': {
              (sec.items || []).forEach((q) => {
                if (doc.y > 700) doc.addPage();
                doc
                  .font('Helvetica-Bold')
                  .fontSize(8.5)
                  .fillColor(COLORS.NAVY)
                  .text(`Q: ${q.question}`, { continued: Boolean(q.timecode) });
                if (q.timecode) {
                  doc
                    .font('Helvetica-Oblique')
                    .fontSize(7.5)
                    .fillColor(COLORS.TAUPE)
                    .text(` (${q.timecode})`);
                }
                doc.moveDown(0.2);
              });
              break;
            }

            default:
              break;
          }
        });

        // ─── 4. Footer & Page Numbers ─────────────────────────────────────
        const range = doc.bufferedPageRange();
        for (let i = range.start; i < range.start + range.count; i++) {
          doc.switchToPage(i);
          const footerY = doc.page.height - 35;

          doc
            .moveTo(leftMargin, footerY - 5)
            .lineTo(leftMargin + pageWidth, footerY - 5)
            .strokeColor(COLORS.BORDER)
            .lineWidth(0.5)
            .stroke();

          doc
            .font('Helvetica')
            .fontSize(7)
            .fillColor(COLORS.TAUPE)
            .text('WrapAI Intelligence Platform • From Content to Clarity', leftMargin, footerY, { width: pageWidth / 2, align: 'left' });

          doc
            .font('Helvetica')
            .fontSize(7)
            .fillColor(COLORS.TAUPE)
            .text(`Page ${i + 1} of ${range.count}`, leftMargin + pageWidth / 2, footerY, { width: pageWidth / 2, align: 'right' });
        }

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }
};
