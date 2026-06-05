// Minimal, dependency-free Markdown-ish renderer for v1 admin compose.
// Supports: headings (#, ##, ###), paragraphs, bold **x**, italic *x*,
// links [text](url), unordered lists (- ), and line breaks. HTML is escaped.
export function renderMarkdown(md: string): string {
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const inline = (s: string) =>
    esc(s)
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" style="color:#4f46e5">$1</a>');

  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];
  let inList = false;
  const closeList = () => {
    if (inList) {
      out.push("</ul>");
      inList = false;
    }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) {
      closeList();
      continue;
    }
    if (line.startsWith("### ")) {
      closeList();
      out.push(`<h3>${inline(line.slice(4))}</h3>`);
    } else if (line.startsWith("## ")) {
      closeList();
      out.push(`<h2>${inline(line.slice(3))}</h2>`);
    } else if (line.startsWith("# ")) {
      closeList();
      out.push(`<h1>${inline(line.slice(2))}</h1>`);
    } else if (line.startsWith("- ")) {
      if (!inList) {
        out.push("<ul>");
        inList = true;
      }
      out.push(`<li>${inline(line.slice(2))}</li>`);
    } else {
      closeList();
      out.push(`<p>${inline(line)}</p>`);
    }
  }
  closeList();
  return out.join("\n");
}

export function wrapEmailHtml(subject: string, bodyHtml: string): string {
  return `<!doctype html><html><body style="margin:0;background:#f8fafc;padding:24px;font-family:system-ui,sans-serif;color:#0f172a">
    <div style="max-width:640px;margin:0 auto;background:#fff;border-radius:12px;padding:32px;border:1px solid #e2e8f0">
      <h1 style="font-size:22px;margin:0 0 16px">${subject.replace(/</g, "&lt;")}</h1>
      <div style="line-height:1.6">${bodyHtml}</div>
      <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0">
      <p style="color:#64748b;font-size:12px;margin:0">You received this because you're subscribed to Intelligence insights for this category.</p>
    </div>
  </body></html>`;
}
