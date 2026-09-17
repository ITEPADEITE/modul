/**
 * DocxExport — Converts markdown content to Word (.docx) documents
 * Uses docx.js library (loaded via CDN) and FileSaver.js
 */
const DocxExport = (() => {

  /* ── Markdown Parser ─────────────────────────────── */

  /**
   * Parse inline markdown formatting: **bold**, *italic*, ***bolditalic***
   * Returns array of TextRun objects
   */
  function parseInlineFormatting(text, baseStyle = {}) {
    const { TextRun } = window.docx;
    const runs = [];
    const regex = /(\*{3}(.+?)\*{3}|\*{2}(.+?)\*{2}|\*(.+?)\*)/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        const beforeText = text.slice(lastIndex, match.index);
        if (beforeText) {
          runs.push(new TextRun({ text: beforeText, size: 24, font: 'Calibri', ...baseStyle }));
        }
      }

      if (match[2]) {
        runs.push(new TextRun({ text: match[2], bold: true, italics: true, size: 24, font: 'Calibri', ...baseStyle }));
      } else if (match[3]) {
        runs.push(new TextRun({ text: match[3], bold: true, size: 24, font: 'Calibri', ...baseStyle }));
      } else if (match[4]) {
        runs.push(new TextRun({ text: match[4], italics: true, size: 24, font: 'Calibri', ...baseStyle }));
      }

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      runs.push(new TextRun({ text: text.slice(lastIndex), size: 24, font: 'Calibri', ...baseStyle }));
    }

    if (runs.length === 0 && text) {
      runs.push(new TextRun({ text, size: 24, font: 'Calibri', ...baseStyle }));
    }

    return runs;
  }

  /**
   * Parse markdown content into docx elements
   */
  function parseMarkdownToElements(markdown) {
    const { Paragraph, TextRun, HeadingLevel, BorderStyle, convertInchesToTwip } = window.docx;
    const lines = markdown.split('\n');
    const elements = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];
      const trimmed = line.trim();

      if (!trimmed) { i++; continue; }

      // Horizontal rule
      if (/^[-*_]{3,}$/.test(trimmed)) {
        elements.push(new Paragraph({
          spacing: { before: 120, after: 120 },
          border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' } }
        }));
        i++; continue;
      }

      // Headings
      const headingMatch = trimmed.match(/^(#{1,4})\s+(.+)$/);
      if (headingMatch) {
        const level = headingMatch[1].length;
        const text = headingMatch[2].replace(/\*{1,3}/g, '');
        const headingLevels = {
          1: HeadingLevel.HEADING_1, 2: HeadingLevel.HEADING_2,
          3: HeadingLevel.HEADING_3, 4: HeadingLevel.HEADING_4
        };
        elements.push(new Paragraph({
          heading: headingLevels[level] || HeadingLevel.HEADING_4,
          spacing: { before: level === 1 ? 360 : 240, after: 120 },
          children: [new TextRun({
            text, bold: true,
            size: level === 1 ? 32 : level === 2 ? 28 : level === 3 ? 26 : 24,
            font: 'Calibri', color: level <= 2 ? '1F3864' : '333333'
          })]
        }));
        i++; continue;
      }

      // Table detection
      if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
        const tableRows = [];
        while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
          const row = lines[i].trim();
          if (!/^\|[\s-:|]+\|$/.test(row)) {
            const cells = row.split('|').filter((_, idx, arr) => idx > 0 && idx < arr.length - 1).map(c => c.trim());
            tableRows.push(cells);
          }
          i++;
        }
        if (tableRows.length > 0) {
          elements.push(createTable(tableRows));
        }
        continue;
      }

      // Numbered list
      const numberedMatch = trimmed.match(/^(\d+)\.\s+(.+)$/);
      if (numberedMatch) {
        elements.push(new Paragraph({
          spacing: { before: 40, after: 40 },
          indent: { left: convertInchesToTwip(0.5) },
          children: [
            new TextRun({ text: `${numberedMatch[1]}. `, bold: true, size: 24, font: 'Calibri' }),
            ...parseInlineFormatting(numberedMatch[2])
          ]
        }));
        i++; continue;
      }

      // Bullet list
      const bulletMatch = trimmed.match(/^[-*+]\s+(.+)$/);
      if (bulletMatch) {
        const indent = line.search(/\S/);
        const indentLevel = Math.floor(indent / 2);
        elements.push(new Paragraph({
          spacing: { before: 40, after: 40 },
          indent: { left: convertInchesToTwip(0.4 + indentLevel * 0.3) },
          children: [
            new TextRun({ text: '• ', size: 24, font: 'Calibri' }),
            ...parseInlineFormatting(bulletMatch[1])
          ]
        }));
        i++; continue;
      }

      // Regular paragraph
      elements.push(new Paragraph({
        spacing: { before: 60, after: 60 },
        children: parseInlineFormatting(trimmed)
      }));
      i++;
    }

    return elements;
  }

  /**
   * Create a docx Table from parsed rows
   */
  function createTable(rows) {
    const { Table, TableRow, TableCell, Paragraph, WidthType, ShadingType } = window.docx;
    const colCount = rows.reduce((max, row) => Math.max(max, row.length), 0);

    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: rows.map((cells, rowIdx) => {
        while (cells.length < colCount) cells.push('');
        return new TableRow({
          children: cells.map(cellText => {
            return new TableCell({
              width: { size: Math.floor(100 / colCount), type: WidthType.PERCENTAGE },
              shading: rowIdx === 0 ? {
                type: ShadingType.SOLID, color: 'D6E4F0', fill: 'D6E4F0'
              } : undefined,
              children: [new Paragraph({
                spacing: { before: 40, after: 40 },
                children: parseInlineFormatting(cellText, {
                  bold: rowIdx === 0, size: 22,
                })
              })]
            });
          })
        });
      })
    });
  }

  /* ── Document Builder ────────────────────────────── */

  async function exportToWord(markdownContent, metadata = {}) {
    if (!window.docx) {
      throw new Error('Library docx.js belum dimuat. Silakan refresh halaman.');
    }

    const {
      Document, Paragraph, TextRun, Packer, AlignmentType,
      BorderStyle, Header, Footer, PageNumber, convertInchesToTwip
    } = window.docx;

    const settings = Storage.getSettings();
    const docTitle = metadata.title || 'Perangkat Ajar';
    const template = metadata.templateTitle || docTitle;

    // Parse markdown to elements
    const contentElements = parseMarkdownToElements(markdownContent);

    // Build document title section
    const titleSection = [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 120 },
        children: [new TextRun({
          text: template.toUpperCase(),
          bold: true, size: 36, font: 'Calibri', color: '1F3864'
        })]
      })
    ];

    if (settings.namaSekolah) {
      titleSection.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 60 },
        children: [new TextRun({
          text: settings.namaSekolah,
          size: 28, font: 'Calibri', bold: true
        })]
      }));
    }

    if (settings.namaGuru) {
      titleSection.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [new TextRun({
          text: `Disusun oleh: ${settings.namaGuru}${settings.nip ? ` (NIP: ${settings.nip})` : ''}`,
          size: 22, font: 'Calibri', italics: true, color: '666666'
        })]
      }));
    }

    titleSection.push(new Paragraph({
      spacing: { before: 100, after: 200 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: '1F3864' } }
    }));

    // Create document
    const doc = new Document({
      title: docTitle,
      subject: metadata.subject || 'Perangkat Ajar - Kurikulum Merdeka',
      creator: settings.namaGuru || 'AI Perangkat Ajar Generator',
      description: `${template} - Generated by AI Perangkat Ajar`,
      styles: {
        default: {
          document: {
            run: { font: 'Calibri', size: 24, color: '333333' }
          },
          heading1: {
            run: { font: 'Calibri', size: 32, bold: true, color: '1F3864' },
            paragraph: { spacing: { before: 360, after: 120 } }
          },
          heading2: {
            run: { font: 'Calibri', size: 28, bold: true, color: '2E5090' },
            paragraph: { spacing: { before: 240, after: 100 } }
          },
          heading3: {
            run: { font: 'Calibri', size: 26, bold: true, color: '333333' },
            paragraph: { spacing: { before: 200, after: 80 } }
          }
        }
      },
      sections: [{
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(1),
              right: convertInchesToTwip(1),
              bottom: convertInchesToTwip(1),
              left: convertInchesToTwip(1.25)
            }
          }
        },
        headers: {
          default: new Header({
            children: [new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [new TextRun({
                text: `${template} — ${settings.namaSekolah || 'AI Perangkat Ajar'}`,
                size: 18, font: 'Calibri', italics: true, color: '999999'
              })]
            })]
          })
        },
        footers: {
          default: new Footer({
            children: [new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ text: 'Halaman ', size: 18, font: 'Calibri', color: '999999' }),
                new TextRun({ children: [PageNumber.CURRENT], size: 18, font: 'Calibri', color: '999999' })
              ]
            })]
          })
        },
        children: [...titleSection, ...contentElements]
      }]
    });

    // Generate and save
    const blob = await Packer.toBlob(doc);
    const fileName = generateFileName(template);
    window.saveAs(blob, fileName);
    return fileName;
  }

  function generateFileName(title) {
    const clean = title.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_').toLowerCase().slice(0, 40);
    const date = new Date().toISOString().slice(0, 10);
    return `${clean}_${date}.docx`;
  }

  function isReady() {
    return !!(window.docx && window.saveAs);
  }

  return { exportToWord, isReady };
})();
