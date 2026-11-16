# -*- coding: utf-8 -*-
"""Two-pass build: render, locate headings by PDF text, rebuild with a static TOC."""
import json
import os
import re
import subprocess
import sys

from docx import Document

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import pdf_text

NODE = r"C:\Users\ASUS\AppData\Local\Programs\DeepSeek Harness\resources\runtime\primary-runtime\dependencies\node\bin\node.exe"
CLI = r"C:\Users\ASUS\AppData\Local\Programs\DeepSeek Harness\resources\app.asar.unpacked\dsh\node_modules\@deepseek-ai\libreoffice-kit\lib\cli.js"


def convert(docx_path, pdf_path):
    if os.path.exists(pdf_path):
        os.remove(pdf_path)
    r = subprocess.run([NODE, CLI, "convert", "--input", docx_path, "--output", pdf_path],
                       capture_output=True, text=True)
    if r.returncode != 0 or not os.path.exists(pdf_path):
        raise RuntimeError(f"convert failed: {r.stderr or r.stdout}")
    return pdf_path


def headings(docx_path):
    doc = Document(docx_path)
    out = []
    for p in doc.paragraphs:
        name = p.style.name if p.style is not None else ""
        if name in ("Heading 1", "Heading 2"):
            text = p.text.strip()
            if text:
                out.append((1 if name == "Heading 1" else 2, text))
    return out


def norm(s):
    return re.sub(r"\s+", "", s)


def build_toc(docx_path, pdf_path, json_path):
    heads = headings(docx_path)
    pages = [norm(t) for t in pdf_text.extract_pages(pdf_path)]
    entries = []
    for level, text in heads:
        n = norm(text)
        found = None
        for i, page in enumerate(pages):
            if i < 2:
                continue
            if n and n in page:
                found = i + 1
                break
        if found is None:
            for i, page in enumerate(pages):
                if i >= 2 and n[:6] in page:
                    found = i + 1
                    break
        entries.append({"level": level, "text": text, "page": found or 0})
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(entries, f, ensure_ascii=False, indent=1)
    missing = [e for e in entries if not e["page"]]
    print(f"headings={len(entries)} missing={len(missing)}")
    for e in entries:
        print(f"  {'  ' if e['level'] == 2 else ''}{e['text']}  ->  {e['page']}")
    return entries


def run(builder_module, docx_name, json_name):
    import importlib
    mod = importlib.import_module(builder_module)
    docx_path = os.path.join(HERE, docx_name)
    pdf_path = os.path.splitext(docx_path)[0] + ".pdf"
    json_path = os.path.join(HERE, json_name)
    if os.path.exists(json_path):
        os.remove(json_path)
    mod.OUT = docx_path
    mod.build()
    convert(docx_path, pdf_path)
    build_toc(docx_path, pdf_path, json_path)
    mod.build()
    convert(docx_path, pdf_path)
    pages = pdf_text.extract_pages(pdf_path)
    for i, t in enumerate(pages, 1):
        if norm("1 摘要与范围") in norm(t) and i > 2:
            print(f"content starts on page {i} (total {len(pages)})")
            break


if __name__ == "__main__":
    run(sys.argv[1], sys.argv[2], sys.argv[3])
