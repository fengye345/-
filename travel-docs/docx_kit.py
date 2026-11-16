# -*- coding: utf-8 -*-
"""Reusable Word styling kit for the Travelog technical documents."""
import os
from docx import Document
from docx.shared import Pt, Cm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_TAB_ALIGNMENT, WD_TAB_LEADER
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

FONT = "Microsoft YaHei"
FONT_CN = "微软雅黑"
MONO = "Consolas"

INK = RGBColor(0x1A, 0x1F, 0x1C)
INK2 = RGBColor(0x3E, 0x46, 0x42)
MUTED = RGBColor(0x6F, 0x76, 0x6F)
JADE = RGBColor(0x1B, 0x66, 0x53)
JADE_HEX = "1B6653"
CLAY = RGBColor(0xBC, 0x5A, 0x37)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
PAPER_HEX = "F7F4EC"
LINE_HEX = "DFD9CB"


def _set_font(run, size=10.5, bold=False, color=INK, name=FONT, east=FONT_CN, italic=False):
    run.font.name = name
    run._element.get_or_add_rPr().rFonts.set(qn("w:eastAsia"), east)
    run.font.size = Pt(size)
    run.bold = bold
    run.italic = italic
    run.font.color.rgb = color


def _shade(el, fill):
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:color"), "auto")
    shd.set(qn("w:fill"), fill)
    el.append(shd)


def _cell_shade(cell, fill):
    tcPr = cell._tc.get_or_add_tcPr()
    _shade(tcPr, fill)


def _cell_margins(table, top=60, bottom=60, left=90, right=90):
    tblPr = table._tbl.tblPr
    mar = OxmlElement("w:tblCellMar")
    for tag, val in (("top", top), ("left", left), ("bottom", bottom), ("right", right)):
        node = OxmlElement(f"w:{tag}")
        node.set(qn("w:w"), str(val))
        node.set(qn("w:type"), "dxa")
        mar.append(node)
    tblPr.append(mar)


def _table_borders(table, color=LINE_HEX, size=4):
    tblPr = table._tbl.tblPr
    borders = OxmlElement("w:tblBorders")
    for edge in ("top", "left", "bottom", "right", "insideH", "insideV"):
        el = OxmlElement(f"w:{edge}")
        el.set(qn("w:val"), "single")
        el.set(qn("w:sz"), str(size))
        el.set(qn("w:space"), "0")
        el.set(qn("w:color"), color)
        borders.append(el)
    tblPr.append(borders)


def _table_no_borders(table):
    tblPr = table._tbl.tblPr
    borders = OxmlElement("w:tblBorders")
    for edge in ("top", "left", "bottom", "right", "insideH", "insideV"):
        el = OxmlElement(f"w:{edge}")
        el.set(qn("w:val"), "nil")
        borders.append(el)
    tblPr.append(borders)


def _para_bottom_border(p, color=JADE_HEX, size=8):
    pPr = p._p.get_or_add_pPr()
    bdr = OxmlElement("w:pBdr")
    bottom = OxmlElement("w:bottom")
    bottom.set(qn("w:val"), "single")
    bottom.set(qn("w:sz"), str(size))
    bottom.set(qn("w:space"), "4")
    bottom.set(qn("w:color"), color)
    bdr.append(bottom)
    pPr.append(bdr)


def _keep_with_next(p):
    p.paragraph_format.keep_with_next = True


def _add_field(paragraph, instr, placeholder="1"):
    run = paragraph.add_run()
    fld_begin = OxmlElement("w:fldChar")
    fld_begin.set(qn("w:fldCharType"), "begin")
    instr_el = OxmlElement("w:instrText")
    instr_el.set(qn("xml:space"), "preserve")
    instr_el.text = instr
    fld_sep = OxmlElement("w:fldChar")
    fld_sep.set(qn("w:fldCharType"), "separate")
    text = OxmlElement("w:t")
    text.text = placeholder
    fld_end = OxmlElement("w:fldChar")
    fld_end.set(qn("w:fldCharType"), "end")
    run._r.append(fld_begin)
    run._r.append(instr_el)
    run._r.append(fld_sep)
    run._r.append(text)
    run._r.append(fld_end)
    return run


def new_doc(title, subject=""):
    doc = Document()
    sec = doc.sections[0]
    sec.page_width = Cm(21)
    sec.page_height = Cm(29.7)
    sec.top_margin = Cm(2.2)
    sec.bottom_margin = Cm(2.0)
    sec.left_margin = Cm(2.0)
    sec.right_margin = Cm(2.0)
    sec.header_distance = Cm(1.1)
    sec.footer_distance = Cm(1.1)

    normal = doc.styles["Normal"]
    normal.font.name = FONT
    normal._element.rPr.rFonts.set(qn("w:eastAsia"), FONT_CN)
    normal.font.size = Pt(10.5)
    normal.font.color.rgb = INK
    normal.paragraph_format.line_spacing = 1.55
    normal.paragraph_format.space_after = Pt(5)

    for name in ("List Bullet", "List Number"):
        st = doc.styles[name]
        st.font.name = FONT
        st._element.rPr.rFonts.set(qn("w:eastAsia"), FONT_CN)
        st.font.size = Pt(10.5)
        st.paragraph_format.line_spacing = 1.5
        st.paragraph_format.space_after = Pt(2)

    props = doc.core_properties
    props.title = title
    props.subject = subject
    props.author = "旅迹 Travelog 产品与技术组"
    props.category = "技术文档"
    return doc


def header_footer(doc, label):
    sec = doc.sections[0]
    sec.different_first_page_header_footer = True

    header = sec.header
    hp = header.paragraphs[0]
    hp.paragraph_format.space_after = Pt(2)
    left = hp.add_run(label)
    _set_font(left, 8.5, False, MUTED)
    hp.add_run("\t\t")
    right = hp.add_run("V1.0 · INTERNAL")
    _set_font(right, 8, False, MUTED)
    pPr = hp._p.get_or_add_pPr()
    tabs = OxmlElement("w:tabs")
    tab = OxmlElement("w:tab")
    tab.set(qn("w:val"), "right")
    tab.set(qn("w:pos"), str(int((21 - 4.0) / 2.54 * 1440)))
    tabs.append(tab)
    pPr.append(tabs)
    _para_bottom_border(hp, LINE_HEX, 4)

    footer = sec.footer
    fp = footer.paragraphs[0]
    fp.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = fp.add_run("旅迹 Travelog · 机密 · 仅限项目组内部使用        ")
    _set_font(r, 8, False, MUTED)
    r2 = fp.add_run("第 ")
    _set_font(r2, 8, False, MUTED)
    _add_field(fp, " PAGE ", "1")
    r3 = fp.add_run(" 页 / 共 ")
    _set_font(r3, 8, False, MUTED)
    _add_field(fp, " NUMPAGES ", "1")
    r4 = fp.add_run(" 页")
    _set_font(r4, 8, False, MUTED)


def cover(doc, kicker, title, subtitle, meta_rows, footer_note=""):
    band = doc.add_table(rows=1, cols=1)
    band.alignment = WD_TABLE_ALIGNMENT.CENTER
    cell = band.cell(0, 0)
    _cell_shade(cell, "0C342A")
    cell.width = Cm(17)
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(16)
    p.paragraph_format.space_after = Pt(16)
    r = p.add_run("TRAVELOG    旅迹")
    _set_font(r, 11, True, RGBColor(0xE6, 0xD2, 0xA4))

    spacer = doc.add_paragraph()
    spacer.paragraph_format.space_after = Pt(54)

    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(10)
    r = p.add_run(kicker)
    _set_font(r, 9, False, MUTED)

    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(12)
    p.paragraph_format.line_spacing = 1.32
    r = p.add_run(title)
    _set_font(r, 30, True, INK)

    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(28)
    r = p.add_run(subtitle)
    _set_font(r, 12, False, MUTED)

    line = doc.add_paragraph()
    line.paragraph_format.space_after = Pt(20)
    _para_bottom_border(line, JADE_HEX, 6)

    table = doc.add_table(rows=0, cols=2)
    table.autofit = False
    _table_no_borders(table)
    for label, value in meta_rows:
        row = table.add_row()
        c0, c1 = row.cells
        c0.width = Cm(4.2)
        c1.width = Cm(12.8)
        p0 = c0.paragraphs[0]
        p0.paragraph_format.space_after = Pt(4)
        r0 = p0.add_run(label)
        _set_font(r0, 9.5, False, MUTED)
        p1 = c1.paragraphs[0]
        p1.paragraph_format.space_after = Pt(4)
        r1 = p1.add_run(value)
        _set_font(r1, 10.5, False, INK2)

    if footer_note:
        doc.add_paragraph()
        p = doc.add_paragraph()
        r = p.add_run(footer_note)
        _set_font(r, 8.5, False, MUTED)

    doc.add_page_break()


def toc(doc, entries=None):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(12)
    r = p.add_run("目  录")
    _set_font(r, 18, True, JADE)

    if not entries:
        p = doc.add_paragraph()
        r = p.add_run("目录页（构建时自动生成）")
        _set_font(r, 9, False, MUTED)
        doc.add_page_break()
        return

    if entries and isinstance(entries[0], dict):
        entries = [(e["level"], e["text"], e["page"]) for e in entries]

    half = (len(entries) + 1) // 2
    cols = [entries[:half], entries[half:]]
    table = doc.add_table(rows=1, cols=2)
    table.autofit = False
    _table_no_borders(table)
    _cell_margins(table, top=0, bottom=0, left=0, right=140)
    for ci, group in enumerate(cols):
        cell = table.cell(0, ci)
        cell.width = Cm(8.4)
        first = True
        for level, text, page in group:
            para = cell.paragraphs[0] if first else cell.add_paragraph()
            first = False
            pf = para.paragraph_format
            pf.space_before = Pt(6 if level == 1 else 0)
            pf.space_after = Pt(1)
            pf.line_spacing = 1.12
            pf.tab_stops.add_tab_stop(Cm(7.9), WD_TAB_ALIGNMENT.RIGHT, WD_TAB_LEADER.DOTS)
            if level == 2:
                pf.left_indent = Cm(0.36)
            r1 = para.add_run(text)
            _set_font(r1, 9.5 if level == 1 else 8.5, level == 1, JADE if level == 1 else INK2)
            r2 = para.add_run("\t")
            _set_font(r2, 8.5, False, MUTED)
            r3 = para.add_run(str(page))
            _set_font(r3, 8.5, level == 1, JADE if level == 1 else MUTED)

    note = doc.add_paragraph()
    note.paragraph_format.space_before = Pt(10)
    r = note.add_run("页码与正文页脚一致；章节顺序即阅读顺序。")
    _set_font(r, 8, False, MUTED)


def h1pb(doc, text):
    p = h1(doc, text)
    p.paragraph_format.page_break_before = True
    return p


def h1(doc, text):
    p = doc.add_paragraph()
    p.style = doc.styles["Heading 1"]
    p.paragraph_format.space_before = Pt(16)
    p.paragraph_format.space_after = Pt(9)
    p.paragraph_format.keep_with_next = True
    r = p.add_run(text)
    _set_font(r, 17, True, JADE)
    _para_bottom_border(p, "DCE5DD", 8)
    return p


def h2(doc, text):
    p = doc.add_paragraph()
    p.style = doc.styles["Heading 2"]
    p.paragraph_format.space_before = Pt(13)
    p.paragraph_format.space_after = Pt(5)
    _keep_with_next(p)
    r = p.add_run(text)
    _set_font(r, 13.5, True, INK)
    return p


def h3(doc, text):
    p = doc.add_paragraph()
    p.style = doc.styles["Heading 3"]
    p.paragraph_format.space_before = Pt(9)
    p.paragraph_format.space_after = Pt(3)
    _keep_with_next(p)
    r = p.add_run(text)
    _set_font(r, 11.5, True, INK2)
    return p


def _rich(p, text, size=10.5, color=INK):
    parts = text.split("**")
    for i, part in enumerate(parts):
        if not part:
            continue
        r = p.add_run(part)
        _set_font(r, size, bold=(i % 2 == 1), color=color)


def p(doc, text, size=10.5, color=INK, space_after=5, indent=0):
    para = doc.add_paragraph()
    para.paragraph_format.space_after = Pt(space_after)
    if indent:
        para.paragraph_format.left_indent = Cm(indent)
    _rich(para, text, size, color)
    return para


def bullets(doc, items, size=10.5):
    for item in items:
        para = doc.add_paragraph(style="List Bullet")
        para.paragraph_format.space_after = Pt(2)
        _rich(para, item, size)


def numbers(doc, items, size=10.5):
    for item in items:
        para = doc.add_paragraph(style="List Number")
        para.paragraph_format.space_after = Pt(2)
        _rich(para, item, size)


def caption(doc, text):
    para = doc.add_paragraph()
    para.alignment = WD_ALIGN_PARAGRAPH.CENTER
    para.paragraph_format.space_before = Pt(2)
    para.paragraph_format.space_after = Pt(10)
    r = para.add_run(text)
    _set_font(r, 8.5, False, MUTED)


def img(doc, path, width_cm=16.4, cap=""):
    para = doc.add_paragraph()
    para.alignment = WD_ALIGN_PARAGRAPH.CENTER
    para.paragraph_format.space_before = Pt(6)
    para.paragraph_format.space_after = Pt(2)
    run = para.add_run()
    run.add_picture(path, width=Cm(width_cm))
    if cap:
        caption(doc, cap)


def code(doc, text, size=8.2):
    para = doc.add_paragraph()
    pf = para.paragraph_format
    pf.left_indent = Cm(0.25)
    pf.space_before = Pt(4)
    pf.space_after = Pt(8)
    pf.line_spacing = 1.15
    pf.keep_together = True
    pPr = para._p.get_or_add_pPr()
    _shade(pPr, "F5F2E8")
    bdr = OxmlElement("w:pBdr")
    left = OxmlElement("w:left")
    left.set(qn("w:val"), "single")
    left.set(qn("w:sz"), "12")
    left.set(qn("w:space"), "6")
    left.set(qn("w:color"), "C9BFA5")
    bdr.append(left)
    pPr.append(bdr)
    run = para.add_run(text)
    _set_font(run, size, False, RGBColor(0x2F, 0x35, 0x30), MONO, MONO)


def callout(doc, title, text, kind="info"):
    fill = "EAF2EC" if kind == "info" else "FBEFE6"
    accent = JADE_HEX if kind == "info" else "BC5A37"
    table = doc.add_table(rows=1, cols=1)
    table.autofit = False
    cell = table.cell(0, 0)
    cell.width = Cm(17)
    _cell_shade(cell, fill)
    tcPr = cell._tc.get_or_add_tcPr()
    borders = OxmlElement("w:tcBorders")
    left = OxmlElement("w:left")
    left.set(qn("w:val"), "single")
    left.set(qn("w:sz"), "24")
    left.set(qn("w:space"), "0")
    left.set(qn("w:color"), accent)
    borders.append(left)
    tcPr.append(borders)
    p0 = cell.paragraphs[0]
    p0.paragraph_format.space_before = Pt(4)
    p0.paragraph_format.space_after = Pt(2)
    r = p0.add_run(title)
    _set_font(r, 9.5, True, JADE if kind == "info" else CLAY)
    p1 = cell.add_paragraph()
    p1.paragraph_format.space_after = Pt(4)
    r1 = p1.add_run(text)
    _set_font(r1, 9.5, False, INK2)
    doc.add_paragraph().paragraph_format.space_after = Pt(2)


def table(doc, headers, rows, widths=None, font_size=8.5, header_fill="E8EFE8",
          first_col_bold=False, align_center=None, zebra=True):
    table = doc.add_table(rows=1, cols=len(headers))
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    _table_borders(table)
    _cell_margins(table)

    hdr = table.rows[0]
    trPr = hdr._tr.get_or_add_trPr()
    th = OxmlElement("w:tblHeader")
    th.set(qn("w:val"), "true")
    trPr.append(th)
    for i, h in enumerate(headers):
        cell = hdr.cells[i]
        _cell_shade(cell, header_fill)
        cell.width = Cm(widths[i]) if widths else Cm(17 / len(headers))
        para = cell.paragraphs[0]
        para.paragraph_format.space_after = Pt(0)
        para.paragraph_format.line_spacing = 1.25
        r = para.add_run(h)
        _set_font(r, font_size, True, JADE)

    for ri, row in enumerate(rows):
        cells = table.add_row().cells
        trPr = table.rows[-1]._tr.get_or_add_trPr()
        cant = OxmlElement("w:cantSplit")
        cant.set(qn("w:val"), "true")
        trPr.append(cant)
        for ci, val in enumerate(row):
            cell = cells[ci]
            cell.width = Cm(widths[ci]) if widths else Cm(17 / len(headers))
            if zebra and ri % 2 == 1:
                _cell_shade(cell, "FBF9F3")
            para = cell.paragraphs[0]
            para.paragraph_format.space_after = Pt(0)
            para.paragraph_format.line_spacing = 1.3
            if align_center and ci in align_center:
                para.alignment = WD_ALIGN_PARAGRAPH.CENTER
            _rich(para, str(val), font_size, INK)
            if first_col_bold and ci == 0:
                for run in para.runs:
                    run.bold = True
    doc.add_paragraph().paragraph_format.space_after = Pt(2)
    return table


def kv(doc, pairs, widths=(4.0, 12.8), font_size=9):
    table = doc.add_table(rows=0, cols=2)
    table.autofit = False
    _table_borders(table)
    _cell_margins(table)
    for k, v in pairs:
        cells = table.add_row().cells
        cells[0].width = Cm(widths[0])
        cells[1].width = Cm(widths[1])
        _cell_shade(cells[0], "F7F4EC")
        for idx, text in enumerate((k, v)):
            para = cells[idx].paragraphs[0]
            para.paragraph_format.space_after = Pt(0)
            para.paragraph_format.line_spacing = 1.35
            _rich(para, str(text), font_size, INK if idx == 1 else INK2)
            if idx == 0:
                for run in para.runs:
                    run.bold = True
    doc.add_paragraph().paragraph_format.space_after = Pt(2)


def pagebreak(doc):
    doc.add_page_break()


def render(doc, blocks):
    for block in blocks:
        kind = block[0]
        if kind == "h1":
            h1(doc, block[1])
        elif kind == "h1pb":
            h1pb(doc, block[1])
        elif kind == "h2":
            h2(doc, block[1])
        elif kind == "h3":
            h3(doc, block[1])
        elif kind == "p":
            p(doc, block[1])
        elif kind == "bullets":
            bullets(doc, block[1])
        elif kind == "numbers":
            numbers(doc, block[1])
        elif kind == "table":
            _, headers, rows, widths = block[:4]
            opts = block[4] if len(block) > 4 else {}
            table(doc, headers, rows, widths, **opts)
        elif kind == "code":
            code(doc, block[1])
        elif kind == "callout":
            callout(doc, block[1], block[2], block[3] if len(block) > 3 else "info")
        elif kind == "img":
            img(doc, block[1], block[2] if len(block) > 2 else 16.4, block[3] if len(block) > 3 else "")
        elif kind == "caption":
            caption(doc, block[1])
        elif kind == "kv":
            kv(doc, block[1])
        elif kind == "pagebreak":
            pagebreak(doc)
        else:
            raise ValueError(f"unknown block: {kind}")


def save(doc, path):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    doc.save(path)
    print("saved", path, os.path.getsize(path), "bytes")
