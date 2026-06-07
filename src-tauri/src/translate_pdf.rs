use printpdf::*;
use std::io::BufWriter;

const PAGE_W_MM: f32 = 210.0;
const PAGE_H_MM: f32 = 297.0;
const MARGIN_X_MM: f32 = 12.0;
const MARGIN_Y_MM: f32 = 14.0;
const COL_GAP_MM: f32 = 6.0;
const BODY_SIZE: f32 = 9.0;
const HEADING_SIZE: f32 = 10.5;
const TITLE_SIZE: f32 = 12.0;
const BODY_LINE_MM: f32 = 3.6;
const HEADING_LINE_MM: f32 = 4.2;
const TITLE_LINE_MM: f32 = 5.0;
const COL_CHARS: usize = 52;

struct PdfWriter {
    doc: PdfDocumentReference,
    page_id: PdfPageIndex,
    layer_id: PdfLayerIndex,
    layer: PdfLayerReference,
    font: IndirectFontRef,
    font_bold: IndirectFontRef,
    col_width_mm: f32,
    left_x: f32,
    right_x: f32,
    left_y: f32,
    right_y: f32,
    column: Column,
}

#[derive(Clone, Copy, PartialEq, Eq)]
enum Column {
    Left,
    Right,
}

#[derive(Clone, Copy, PartialEq, Eq)]
enum BlockKind {
    Title,
    Heading,
    Body,
}

impl PdfWriter {
    fn new(title: &str) -> anyhow::Result<Self> {
        let (doc, page_id, layer_id) =
            PdfDocument::new(title, Mm(PAGE_W_MM), Mm(PAGE_H_MM), "Layer 1");
        let font = doc.add_builtin_font(BuiltinFont::Helvetica)?;
        let font_bold = doc.add_builtin_font(BuiltinFont::HelveticaBold)?;
        let col_width_mm =
            (PAGE_W_MM - (2.0 * MARGIN_X_MM) - COL_GAP_MM) / 2.0;
        let left_x = MARGIN_X_MM;
        let right_x = MARGIN_X_MM + col_width_mm + COL_GAP_MM;
        let top_y = PAGE_H_MM - MARGIN_Y_MM;
        let layer = doc.get_page(page_id).get_layer(layer_id);

        Ok(Self {
            doc,
            page_id,
            layer_id,
            layer,
            font,
            font_bold,
            col_width_mm,
            left_x,
            right_x,
            left_y: top_y,
            right_y: top_y,
            column: Column::Left,
        })
    }

    fn new_page(&mut self) {
        let (page_id, layer_id) = self.doc.add_page(Mm(PAGE_W_MM), Mm(PAGE_H_MM), "Layer 1");
        self.page_id = page_id;
        self.layer_id = layer_id;
        self.layer = self.doc.get_page(page_id).get_layer(layer_id);
        self.left_y = PAGE_H_MM - MARGIN_Y_MM;
        self.right_y = PAGE_H_MM - MARGIN_Y_MM;
        self.column = Column::Left;
    }

    fn write_full_width(&mut self, text: &str, kind: BlockKind) {
        let (size, line_h, bold) = match kind {
            BlockKind::Title => (TITLE_SIZE, TITLE_LINE_MM, true),
            BlockKind::Heading => (HEADING_SIZE, HEADING_LINE_MM, true),
            BlockKind::Body => (BODY_SIZE, BODY_LINE_MM, false),
        };
        let chars = if kind == BlockKind::Title {
            70
        } else {
            (COL_CHARS as f32 * 2.1) as usize
        };

        for line in wrap_text(text, chars) {
            if self.left_y < MARGIN_Y_MM + line_h {
                self.new_page();
            }
            if bold {
                self.layer.use_text(
                    &line,
                    size,
                    Mm(MARGIN_X_MM),
                    Mm(self.left_y),
                    &self.font_bold,
                );
            } else {
                self.layer
                    .use_text(&line, size, Mm(MARGIN_X_MM), Mm(self.left_y), &self.font);
            }
            self.left_y -= line_h;
            self.right_y = self.left_y;
        }
        self.left_y -= line_h * 0.35;
        self.right_y = self.left_y;
    }

    fn write_column_line(&mut self, text: &str, kind: BlockKind) {
        let (size, line_h, bold) = match kind {
            BlockKind::Title => (TITLE_SIZE, TITLE_LINE_MM, true),
            BlockKind::Heading => (HEADING_SIZE, HEADING_LINE_MM, true),
            BlockKind::Body => (BODY_SIZE, BODY_LINE_MM, false),
        };

        let y = match self.column {
            Column::Left => self.left_y,
            Column::Right => self.right_y,
        };

        if y < MARGIN_Y_MM + line_h {
            if self.column == Column::Left && self.right_y > MARGIN_Y_MM + line_h * 2.0 {
                self.column = Column::Right;
            } else {
                self.new_page();
            }
            self.write_column_line(text, kind);
            return;
        }

        let col_x = match self.column {
            Column::Left => self.left_x,
            Column::Right => self.right_x,
        };
        let col_y = match self.column {
            Column::Left => self.left_y,
            Column::Right => self.right_y,
        };

        if bold {
            self.layer
                .use_text(text, size, Mm(col_x), Mm(col_y), &self.font_bold);
        } else {
            self.layer.use_text(text, size, Mm(col_x), Mm(col_y), &self.font);
        }

        match self.column {
            Column::Left => self.left_y -= line_h,
            Column::Right => self.right_y -= line_h,
        }
    }

    fn write_paragraph(&mut self, text: &str, kind: BlockKind) {
        if text.trim().is_empty() {
            let gap = BODY_LINE_MM * 0.6;
            self.left_y -= gap;
            self.right_y -= gap;
            return;
        }

        if kind == BlockKind::Title {
            self.write_full_width(text, kind);
            self.column = Column::Left;
            return;
        }

        if kind == BlockKind::Heading {
            if self.column == Column::Right {
                self.column = Column::Left;
                self.left_y = self.left_y.min(self.right_y) - HEADING_LINE_MM * 0.5;
                self.right_y = self.left_y;
            } else {
                self.left_y -= HEADING_LINE_MM * 0.35;
                self.right_y = self.left_y;
            }
            for line in wrap_text(text, COL_CHARS) {
                self.write_column_line(&line, kind);
            }
            self.left_y -= BODY_LINE_MM * 0.25;
            self.right_y = self.left_y;
            return;
        }

        for line in wrap_text(text, COL_CHARS) {
            if line.is_empty() {
                continue;
            }
            self.write_column_line(&line, BlockKind::Body);
        }
        self.left_y -= BODY_LINE_MM * 0.2;
        self.right_y = self.left_y;
    }

    fn finish(self) -> anyhow::Result<Vec<u8>> {
        let mut buf = Vec::new();
        self.doc.save(&mut BufWriter::new(&mut buf))?;
        Ok(buf)
    }
}

pub fn text_to_pdf_bytes(title: &str, body: &str) -> anyhow::Result<Vec<u8>> {
    let mut writer = PdfWriter::new(title)?;
    let blocks = parse_blocks(body);

    for (index, (text, kind)) in blocks.into_iter().enumerate() {
        let block_kind = if index == 0 && kind == BlockKind::Title {
            BlockKind::Title
        } else {
            kind
        };
        writer.write_paragraph(&text, block_kind);
    }

    writer.finish()
}

fn parse_blocks(body: &str) -> Vec<(String, BlockKind)> {
    let paragraphs: Vec<&str> = body.split("\n\n").map(str::trim).filter(|p| !p.is_empty()).collect();
    let mut blocks = Vec::new();

    for (index, paragraph) in paragraphs.iter().enumerate() {
        let flat = paragraph.replace('\n', " ");
        let kind = if index == 0 && flat.len() < 180 && !flat.ends_with('.') {
            BlockKind::Title
        } else if is_heading(&flat) {
            BlockKind::Heading
        } else {
            BlockKind::Body
        };
        blocks.push((flat, kind));
    }

    blocks
}

fn is_heading(text: &str) -> bool {
    let t = text.trim();
    if t.len() > 120 {
        return false;
    }
    let lower = t.to_ascii_lowercase();
    if matches!(
        lower.as_str(),
        "abstract" | "zusammenfassung" | "introduction" | "einleitung" | "references" | "literatur"
    ) {
        return true;
    }
    if t.chars().next().map(|c| c.is_ascii_digit()).unwrap_or(false) && t.contains('.') {
        return true;
    }
    t.len() < 80 && t.chars().filter(|c| c.is_uppercase()).count() > t.len() / 3
}

fn wrap_text(text: &str, max_chars: usize) -> Vec<String> {
    let mut lines = Vec::new();
    let mut start = 0;
    let chars: Vec<char> = text.chars().collect();
    while start < chars.len() {
        let end = (start + max_chars).min(chars.len());
        let mut break_at = end;
        if end < chars.len() {
            if let Some(rel) = chars[start..end]
                .iter()
                .rposition(|c| c.is_whitespace())
            {
                if rel > max_chars / 4 {
                    break_at = start + rel;
                }
            }
        }
        let slice: String = chars[start..break_at].iter().collect();
        lines.push(slice.trim().to_string());
        start = break_at;
        while start < chars.len() && chars[start].is_whitespace() {
            start += 1;
        }
    }
    if lines.is_empty() {
        lines.push(String::new());
    }
    lines
}
