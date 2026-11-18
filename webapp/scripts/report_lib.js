/* CAVR-Dyna project report generator — follows the user's RL-project template format.
 * Format rules: Times New Roman throughout, 12pt body justified, 1.5 spacing,
 * black text only, no italics, sequential figure/table numbering,
 * captions below figures / above tables, Arabic page numbers in body.
 */
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  ImageRun, PageBreak, Footer, PageNumber, NumberFormat, AlignmentType,
  HeadingLevel, WidthType, BorderStyle, ShadingType, TableOfContents,
  SectionType, Math: OoxmlMath, MathRun, MathFraction, MathSubScript,
  MathSuperScript, MathSubSuperScript, MathSum, MathRadical, VerticalAlign,
} = require("docx");
const fs = require("fs");
const path = require("path");

const ROOT = "/home/z/my-project";
const OUT = path.join(ROOT, "download", "CAVR-Dyna-Project-Report.docx");
const R = JSON.parse(fs.readFileSync(path.join(ROOT, "data/cavr/results.json"), "utf8"));

/* ---------- constants ---------- */
const TNR = { ascii: "Times New Roman", eastAsia: "SimSun" };
const MONO = { ascii: "Courier New", eastAsia: "SimSun" };
const BLACK = "000000";
const BODY = 24;          // 12pt
const CAP = 21;           // 10.5pt
const TBL = 20;           // 10pt table text
const CODE = 18;          // 9pt code
const LINE = 360;         // 1.5x
const PAGE = { size: { width: 11906, height: 16838 },
  margin: { top: 1440, bottom: 1440, left: 1701, right: 1417, header: 850, footer: 992 } };
const allBlackBorders = {
  top: { style: BorderStyle.SINGLE, size: 4, color: BLACK },
  bottom: { style: BorderStyle.SINGLE, size: 4, color: BLACK },
  left: { style: BorderStyle.SINGLE, size: 4, color: BLACK },
  right: { style: BorderStyle.SINGLE, size: 4, color: BLACK },
  insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: BLACK },
  insideVertical: { style: BorderStyle.SINGLE, size: 4, color: BLACK },
};
const noBorders = {
  top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE },
  left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE },
  insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE },
};

function safeText(v, ph) {
  if (v === undefined || v === null || v === "" || String(v) === "NaN" || String(v) === "undefined") {
    return ph || "[value]";
  }
  return String(v);
}
const fmtN = (v, d = 3) => {
  if (v === null || v === undefined || Number.isNaN(v)) return "-";
  if (Number.isInteger(v)) return String(v);
  return Number(v).toFixed(d);
};

/* ---------- builders ---------- */
function body(text, opts = {}) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { line: LINE, after: opts.after ?? 120 },
    indent: { firstLine: opts.noIndent ? 0 : 360 },
    keepLines: true,
    children: [new TextRun({ text, size: BODY, font: TNR, color: BLACK })],
  });
}
function bodyRuns(runs, opts = {}) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { line: LINE, after: opts.after ?? 120 },
    indent: { firstLine: opts.noIndent ? 0 : 360 },
    keepLines: true,
    children: runs,
  });
}
function h1(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_1, keepNext: true,
    spacing: { before: 480, after: 240, line: LINE },
    children: [new TextRun({ text, bold: true, size: 32, font: TNR, color: BLACK })] });
}
function h2(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_2, keepNext: true,
    spacing: { before: 360, after: 180, line: LINE },
    children: [new TextRun({ text, bold: true, size: 28, font: TNR, color: BLACK })] });
}
function h3(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_3, keepNext: true,
    spacing: { before: 240, after: 120, line: LINE },
    children: [new TextRun({ text, bold: true, size: 24, font: TNR, color: BLACK })] });
}
function figCaption(text) {
  return new Paragraph({ alignment: AlignmentType.CENTER,
    spacing: { line: 276, before: 60, after: 240 }, keepLines: true,
    children: [new TextRun({ text, size: CAP, font: TNR, color: BLACK })] });
}
function figure(file, caption, displayWidth) {
  const buf = fs.readFileSync(file);
  const { png } = require("./png_size");
  return [
    new Paragraph({ alignment: AlignmentType.CENTER, keepNext: true,
      spacing: { before: 120, after: 60 },
      children: [new ImageRun({ data: buf, type: "png",
        transformation: png(file, displayWidth) })] }),
    figCaption(caption),
  ];
}
function tabCaption(text) {
  return new Paragraph({ alignment: AlignmentType.CENTER, keepNext: true,
    spacing: { line: 276, before: 240, after: 120 },
    children: [new TextRun({ text, size: CAP, font: TNR, color: BLACK })] });
}
function cellPara(text, { bold = false, align = AlignmentType.LEFT, size = TBL } = {}) {
  return new Paragraph({ alignment: align, spacing: { line: 264 },
    children: [new TextRun({ text: safeText(text), bold, size, font: TNR, color: BLACK })] });
}
function dataTable({ widths, header, rows, boldRows = [], numAlignFrom = 1 }) {
  const mk = (t, i, isHeader, isBoldRow) => new TableCell({
    children: [cellPara(t, { bold: isHeader || isBoldRow,
      align: i >= numAlignFrom && !isHeader ? AlignmentType.RIGHT : AlignmentType.LEFT })],
    margins: { top: 40, bottom: 40, left: 100, right: 100 },
    width: { size: widths[i], type: WidthType.PERCENTAGE },
    verticalAlign: VerticalAlign.CENTER,
    shading: isHeader ? { type: ShadingType.CLEAR, fill: "FFFFFF" } : undefined,
  });
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: allBlackBorders,
    rows: [
      new TableRow({ tableHeader: true, cantSplit: true,
        children: header.map((t, i) => mk(t, i, true, false)) }),
      ...rows.map((r, ri) => new TableRow({ cantSplit: true,
        children: r.map((t, i) => mk(t, i, false, boldRows.includes(ri))) })),
    ],
  });
}
function eqRow(mathChildren, number) {
  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, borders: noBorders,
    rows: [new TableRow({ cantSplit: true, children: [
      new TableCell({ width: { size: 88, type: WidthType.PERCENTAGE },
        margins: { top: 60, bottom: 60, left: 100, right: 100 },
        children: [new Paragraph({ alignment: AlignmentType.CENTER,
          spacing: { line: 300 },
          children: [new OoxmlMath({ children: mathChildren })] })] }),
      new TableCell({ width: { size: 12, type: WidthType.PERCENTAGE },
        margins: { top: 60, bottom: 60, left: 100, right: 100 },
        verticalAlign: VerticalAlign.CENTER,
        children: [new Paragraph({ alignment: AlignmentType.RIGHT,
          children: [new TextRun({ text: `(${number})`, size: BODY, font: TNR, color: BLACK })] })] }),
    ] })] });
}
function codeBlock(lines) {
  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, borders: allBlackBorders,
    rows: [new TableRow({ cantSplit: false, children: [
      new TableCell({ width: { size: 100, type: WidthType.PERCENTAGE },
        margins: { top: 120, bottom: 120, left: 160, right: 160 },
        children: lines.map(l => new Paragraph({
          spacing: { line: 240 },
          children: [new TextRun({ text: l.length ? l : " ", size: CODE, font: MONO, color: BLACK })] })),
      }) ] })] });
}
function refPara(text) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { line: LINE, after: 120 },
    indent: { left: 480, hanging: 480 },
    children: [new TextRun({ text, size: BODY, font: TNR, color: BLACK })],
  });
}
function spacer(after = 120) {
  return new Paragraph({ spacing: { after }, children: [] });
}

module.exports = {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, ImageRun,
  PageBreak, Footer, PageNumber, NumberFormat, AlignmentType, HeadingLevel,
  WidthType, BorderStyle, ShadingType, TableOfContents, SectionType,
  OoxmlMath, MathRun, MathFraction, MathSubScript, MathSuperScript,
  MathSubSuperScript, MathSum, MathRadical, VerticalAlign,
  TNR, MONO, BLACK, BODY, CAP, TBL, CODE, LINE, PAGE, allBlackBorders, noBorders,
  R, ROOT, OUT, body, bodyRuns, h1, h2, h3, figCaption, figure, tabCaption,
  dataTable, eqRow, codeBlock, refPara, spacer, safeText, fmtN,
};
