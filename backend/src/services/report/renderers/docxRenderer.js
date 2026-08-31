import {
  Document,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  WidthType,
  Packer,
  Footer,
  PageNumber
} from 'docx';

export const docxRenderer = {
  /**
   * Generates an editable Microsoft Word (DOCX) Buffer from structured report data.
   *
   * @param {object} report - Structured report from reportBuilder
   * @returns {Promise<Buffer>}
   */
  async render(report) {
    const meta = report.metadata || {};
    const children = [];

    // ─── 1. Title & Header ──────────────────────────────────────────────
    children.push(
      new Paragraph({
        text: 'WRAPAI INTELLIGENCE REPORT',
        alignment: AlignmentType.LEFT,
        spacing: { after: 100 },
        children: [
          new TextRun({
            text: 'WRAPAI INTELLIGENCE REPORT',
            bold: true,
            size: 16,
            color: '7A7078'
          })
        ]
      }),
      new Paragraph({
        text: report.title || 'Meeting Intelligence Report',
        heading: HeadingLevel.TITLE,
        spacing: { after: 200 },
        children: [
          new TextRun({
            text: report.title || 'Meeting Intelligence Report',
            bold: true,
            size: 36,
            color: '171E19'
          })
        ]
      })
    );

    // ─── 2. Metadata Table ──────────────────────────────────────────────
    const metaRows = [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 25, type: WidthType.PERCENTAGE },
            children: [new Paragraph({ children: [new TextRun({ text: 'Source:', bold: true, size: 18 })] })]
          }),
          new TableCell({
            width: { size: 75, type: WidthType.PERCENTAGE },
            children: [new Paragraph({ text: meta.contentTitle || 'Recording' })]
          })
        ]
      }),
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: 'Date:', bold: true, size: 18 })] })]
          }),
          new TableCell({
            children: [new Paragraph({ text: meta.date ? new Date(meta.date).toLocaleDateString() : 'N/A' })]
          })
        ]
      }),
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: 'Duration:', bold: true, size: 18 })] })]
          }),
          new TableCell({
            children: [new Paragraph({ text: meta.formattedDuration || 'N/A' })]
          })
        ]
      }),
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: 'Participants:', bold: true, size: 18 })] })]
          }),
          new TableCell({
            children: [new Paragraph({ text: meta.participants?.join(', ') || 'Speaker 1' })]
          })
        ]
      })
    ];

    children.push(
      new Table({
        rows: metaRows,
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 1, color: 'D1D8D5' },
          bottom: { style: BorderStyle.SINGLE, size: 1, color: 'D1D8D5' },
          left: { style: BorderStyle.NONE },
          right: { style: BorderStyle.NONE },
          insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: 'E8ECEB' },
          insideVertical: { style: BorderStyle.NONE }
        }
      }),
      new Paragraph({ text: '', spacing: { after: 300 } })
    );

    // ─── 3. Sections ────────────────────────────────────────────────────
    (report.sections || []).forEach((sec) => {
      // Section Heading
      children.push(
        new Paragraph({
          text: sec.title,
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 240, after: 120 },
          children: [
            new TextRun({
              text: sec.title,
              bold: true,
              size: 24,
              color: '171E19'
            })
          ]
        })
      );

      switch (sec.type) {
        case 'paragraph': {
          children.push(
            new Paragraph({
              text: sec.content || '',
              spacing: { after: 160 }
            })
          );
          break;
        }

        case 'topics': {
          (sec.items || []).forEach((t) => {
            children.push(
              new Paragraph({
                bullet: { level: 0 },
                spacing: { after: 80 },
                children: [
                  new TextRun({ text: `${t.title} `, bold: true }),
                  t.timecode ? new TextRun({ text: `[${t.timecode}]`, italics: true, color: '7A7078' }) : new TextRun({ text: '' })
                ]
              })
            );
            if (t.summary) {
              children.push(
                new Paragraph({
                  text: `   ${t.summary}`,
                  spacing: { after: 120 }
                })
              );
            }
          });
          break;
        }

        case 'decisions': {
          (sec.items || []).forEach((d) => {
            const agreed = d.agreedBy?.length ? ` (Consensus: ${d.agreedBy.join(', ')})` : '';
            children.push(
              new Paragraph({
                bullet: { level: 0 },
                spacing: { after: 80 },
                children: [
                  new TextRun({ text: `[Decision] ${d.title} `, bold: true, color: '1B4D3E' }),
                  d.timecode ? new TextRun({ text: `— ${d.timecode}`, color: '7A7078' }) : new TextRun({ text: '' })
                ]
              })
            );
            if (d.description && d.description !== d.title) {
              children.push(
                new Paragraph({
                  text: `   ${d.description}${agreed}`,
                  spacing: { after: 100 }
                })
              );
            }
          });
          break;
        }

        case 'action_items': {
          const actionRows = [
            new TableRow({
              tableHeader: true,
              children: [
                new TableCell({ width: { size: 45, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: 'Task', bold: true })] })] }),
                new TableCell({ width: { size: 25, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: 'Owner', bold: true })] })] }),
                new TableCell({ width: { size: 20, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: 'Deadline', bold: true })] })] }),
                new TableCell({ width: { size: 10, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: 'Status', bold: true })] })] })
              ]
            }),
            ...(sec.items || []).map((a) => new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ text: a.task || '-' })] }),
                new TableCell({ children: [new Paragraph({ text: a.owner || '-' })] }),
                new TableCell({ children: [new Paragraph({ text: a.deadline || '-' })] }),
                new TableCell({ children: [new Paragraph({ text: a.status || '-' })] })
              ]
            }))
          ];

          children.push(
            new Table({
              rows: actionRows,
              width: { size: 100, type: WidthType.PERCENTAGE },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 1, color: 'D1D8D5' },
                bottom: { style: BorderStyle.SINGLE, size: 1, color: 'D1D8D5' },
                left: { style: BorderStyle.SINGLE, size: 1, color: 'D1D8D5' },
                right: { style: BorderStyle.SINGLE, size: 1, color: 'D1D8D5' },
                insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: 'E8ECEB' },
                insideVertical: { style: BorderStyle.SINGLE, size: 1, color: 'E8ECEB' }
              }
            }),
            new Paragraph({ text: '', spacing: { after: 200 } })
          );
          break;
        }

        case 'key_points': {
          (sec.items || []).forEach((kp) => {
            children.push(
              new Paragraph({
                bullet: { level: 0 },
                spacing: { after: 60 },
                children: [
                  new TextRun({ text: kp.text }),
                  kp.timecode ? new TextRun({ text: ` (${kp.timecode})`, italics: true, color: '7A7078' }) : new TextRun({ text: '' })
                ]
              })
            );
          });
          break;
        }

        case 'highlights': {
          (sec.items || []).forEach((hl) => {
            children.push(
              new Paragraph({
                bullet: { level: 0 },
                spacing: { after: 60 },
                children: [
                  new TextRun({ text: `★ ${hl.title} `, bold: true }),
                  hl.timecode ? new TextRun({ text: `[${hl.timecode}]`, italics: true, color: '7A7078' }) : new TextRun({ text: '' })
                ]
              })
            );
          });
          break;
        }

        case 'participants': {
          (sec.items || []).forEach((spk) => {
            children.push(
              new Paragraph({
                bullet: { level: 0 },
                spacing: { after: 60 },
                children: [
                  new TextRun({ text: `${spk.name} `, bold: true }),
                  new TextRun({ text: `— ${spk.speakingTimeFormatted} (${spk.turnCount} turns)`, color: '7A7078' })
                ]
              })
            );
          });
          break;
        }

        default:
          break;
      }
    });

    // ─── 4. Build Document ──────────────────────────────────────────────
    const doc = new Document({
      sections: [
        {
          properties: {},
          footers: {
            default: new Footer({
              children: [
                new Paragraph({
                  alignment: AlignmentType.RIGHT,
                  children: [
                    new TextRun({ text: 'WrapAI Intelligence • Page ' }),
                    new TextRun({ children: [PageNumber.CURRENT] }),
                    new TextRun({ text: ' of ' }),
                    new TextRun({ children: [PageNumber.TOTAL_PAGES] })
                  ]
                })
              ]
            })
          },
          children
        }
      ]
    });

    return Packer.toBuffer(doc);
  }
};
