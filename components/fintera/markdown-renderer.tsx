import React from "react";
import Link from "next/link";

interface MarkdownRendererProps {
  content: string;
  variant?: "light" | "dark";
  className?: string;
}

/**
 * Parses inline markdown tokens:
 * - Escaped dollar signs (\$ -> $)
 * - Links: [label](url)
 * - Bold: **text**
 * - Inline code: `code`
 * - Italic: *text*
 */
export function renderInlineMarkdown(
  rawText: string,
  variant: "light" | "dark" = "light"
): React.ReactNode[] {
  const cleaned = rawText.replace(/\\\$/g, "$");
  const tokenRegex =
    /(\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*|`[^`]+`|\*[^*\n]+\*)/g;

  const parts = cleaned.split(tokenRegex);
  return parts.map((part, idx) => {
    if (!part) return null;

    // 1. Markdown Link: [label](url)
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      const [, label, href] = linkMatch;
      const isInternal = href.startsWith("/");
      const linkClass =
        variant === "dark"
          ? "font-semibold text-[#00C4B3] underline decoration-[#00C4B3]/50 underline-offset-4 hover:text-teal-300"
          : "font-semibold text-[#0A2342] underline decoration-[#00C4B3] decoration-2 underline-offset-4 hover:text-[#008f82]";

      if (isInternal) {
        return (
          <Link key={idx} href={href} className={linkClass}>
            {label}
          </Link>
        );
      }
      return (
        <a
          key={idx}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={linkClass}
        >
          {label} ↗
        </a>
      );
    }

    // 2. Bold: **text**
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      const inner = part.slice(2, -2);
      return (
        <strong
          key={idx}
          className={
            variant === "dark"
              ? "font-bold text-white"
              : "font-bold text-[#0A2342]"
          }
        >
          {inner}
        </strong>
      );
    }

    // 3. Inline Code: `code`
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      const inner = part.slice(1, -1);
      return (
        <code
          key={idx}
          className={
            variant === "dark"
              ? "rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[0.85em] text-[#00C4B3]"
              : "rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[0.85em] text-[#0A2342]"
          }
        >
          {inner}
        </code>
      );
    }

    // 4. Italic: *text*
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      const inner = part.slice(1, -1);
      return (
        <em
          key={idx}
          className={
            variant === "dark" ? "italic text-slate-200" : "italic text-slate-700"
          }
        >
          {inner}
        </em>
      );
    }

    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
}

function isTableSeparatorLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed.includes("|")) return false;
  return /^\|?[\s:-]+\|[\s|:-]*$/.test(trimmed);
}

function parseTableCells(line: string): string[] {
  const trimmed = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  return trimmed.split("|").map((cell) => cell.trim());
}

export function MarkdownRenderer({
  content,
  variant = "light",
  className = "",
}: MarkdownRendererProps) {
  if (!content) return null;

  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    // Skip empty lines
    if (!line) {
      i++;
      continue;
    }

    // 1. Horizontal Rule (---, ***, ___)
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line)) {
      elements.push(
        <hr
          key={`hr-${i}`}
          className={
            variant === "dark"
              ? "my-5 border-slate-800"
              : "my-8 border-slate-200"
          }
        />
      );
      i++;
      continue;
    }

    // 2. Headings (#, ##, ###, ####)
    if (line.startsWith("# ")) {
      elements.push(
        <h1
          key={`h1-${i}`}
          className={
            variant === "dark"
              ? "mt-4 mb-2 text-lg font-extrabold tracking-tight text-white"
              : "mt-6 mb-3 text-2xl font-extrabold tracking-tight text-[#0A2342] sm:text-3xl"
          }
        >
          {renderInlineMarkdown(line.replace(/^#\s+/, ""), variant)}
        </h1>
      );
      i++;
      continue;
    }

    if (line.startsWith("## ")) {
      elements.push(
        <h2
          key={`h2-${i}`}
          className={
            variant === "dark"
              ? "mt-5 mb-2 flex items-center gap-2 border-b border-slate-800 pb-1.5 text-sm font-bold text-[#00C4B3]"
              : "mt-8 mb-3 border-b border-slate-100 pb-2 text-xl font-bold text-[#0A2342] sm:text-2xl"
          }
        >
          {renderInlineMarkdown(line.replace(/^##\s+/, ""), variant)}
        </h2>
      );
      i++;
      continue;
    }

    if (line.startsWith("### ")) {
      elements.push(
        <h3
          key={`h3-${i}`}
          className={
            variant === "dark"
              ? "mt-4 mb-1.5 text-xs font-bold uppercase tracking-wider text-sky-300"
              : "mt-6 mb-2 text-lg font-bold text-[#0A2342]"
          }
        >
          {renderInlineMarkdown(line.replace(/^###\s+/, ""), variant)}
        </h3>
      );
      i++;
      continue;
    }

    if (line.startsWith("#### ")) {
      elements.push(
        <h4
          key={`h4-${i}`}
          className={
            variant === "dark"
              ? "mt-3 mb-1 text-xs font-semibold text-slate-200"
              : "mt-4 mb-1.5 text-base font-bold text-slate-800"
          }
        >
          {renderInlineMarkdown(line.replace(/^####\s+/, ""), variant)}
        </h4>
      );
      i++;
      continue;
    }

    // 3. Blockquote (> ...)
    if (line.startsWith(">")) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) {
        quoteLines.push(lines[i].trim().replace(/^>\s?/, ""));
        i++;
      }
      elements.push(
        <blockquote
          key={`quote-${i}`}
          className={
            variant === "dark"
              ? "my-3 rounded-xl border-l-4 border-[#00C4B3] bg-[#0A2342]/60 p-3.5 text-xs leading-relaxed text-slate-200"
              : "my-5 rounded-2xl border-l-4 border-[#00C4B3] bg-[#0A2342]/[0.04] p-5 text-sm leading-relaxed text-slate-700"
          }
        >
          {renderInlineMarkdown(quoteLines.join(" "), variant)}
        </blockquote>
      );
      continue;
    }

    // 4. Markdown Table (| col1 | col2 | followed by |---|---|)
    if (
      line.includes("|") &&
      i + 1 < lines.length &&
      isTableSeparatorLine(lines[i + 1])
    ) {
      const headers = parseTableCells(line);
      i += 2; // Skip header + separator row
      const rows: string[][] = [];
      while (
        i < lines.length &&
        lines[i].trim().includes("|") &&
        lines[i].trim() !== ""
      ) {
        if (!isTableSeparatorLine(lines[i])) {
          rows.push(parseTableCells(lines[i]));
        }
        i++;
      }

      elements.push(
        <div
          key={`table-${i}`}
          className={
            variant === "dark"
              ? "my-3 overflow-x-auto rounded-xl border border-slate-800 bg-slate-950"
              : "my-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm"
          }
        >
          <table className="w-full border-collapse text-left">
            <thead>
              <tr
                className={
                  variant === "dark"
                    ? "border-b border-slate-800 bg-[#0A2342] text-[11px] font-bold uppercase tracking-wider text-[#00C4B3]"
                    : "border-b border-slate-200 bg-[#0A2342] text-xs font-bold uppercase tracking-wider text-white"
                }
              >
                {headers.map((header, hIdx) => (
                  <th key={hIdx} className="px-4 py-3">
                    {renderInlineMarkdown(header, "dark")}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/40">
              {rows.map((row, rIdx) => (
                <tr
                  key={rIdx}
                  className={
                    variant === "dark"
                      ? "border-b border-slate-800/70 text-xs text-slate-200 even:bg-slate-900/40"
                      : "border-b border-slate-100 text-sm text-slate-700 even:bg-slate-50/70"
                  }
                >
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="px-4 py-3 align-top">
                      {renderInlineMarkdown(cell, variant)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    // 5. Unordered List (- item, * item, • item, including checkboxes - [ ] / - [x])
    if (/^([-*•])\s+/.test(line)) {
      const listItems: { text: string; checked?: boolean }[] = [];
      while (i < lines.length && /^([-*•])\s+/.test(lines[i].trim())) {
        const rawItem = lines[i].trim().replace(/^([-*•])\s+/, "");
        const checkboxMatch = rawItem.match(/^\[([ xX])\]\s+(.*)$/);
        if (checkboxMatch) {
          listItems.push({
            checked: checkboxMatch[1].toLowerCase() === "x",
            text: checkboxMatch[2],
          });
        } else {
          listItems.push({ text: rawItem });
        }
        i++;
      }

      elements.push(
        <ul
          key={`ul-${i}`}
          className={
            variant === "dark"
              ? "my-2.5 space-y-1.5 pl-1"
              : "my-4 space-y-2.5 pl-1"
          }
        >
          {listItems.map((li, lIdx) => (
            <li
              key={lIdx}
              className={
                variant === "dark"
                  ? "flex items-start gap-2.5 text-xs leading-relaxed text-slate-200"
                  : "flex items-start gap-3 text-base leading-relaxed text-slate-700"
              }
            >
              {typeof li.checked === "boolean" ? (
                <span
                  className={`mt-1 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] font-bold ${
                    li.checked
                      ? "border-[#00C4B3] bg-[#00C4B3] text-[#0A2342]"
                      : variant === "dark"
                      ? "border-slate-600 bg-slate-900 text-transparent"
                      : "border-slate-300 bg-white text-transparent"
                  }`}
                >
                  ✓
                </span>
              ) : (
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#00C4B3]" />
              )}
              <span className="flex-1">
                {renderInlineMarkdown(li.text, variant)}
              </span>
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // 6. Ordered List (1. item, 2. item)
    if (/^\d+\.\s+/.test(line)) {
      const orderedItems: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        orderedItems.push(lines[i].trim().replace(/^\d+\.\s+/, ""));
        i++;
      }

      elements.push(
        <ol
          key={`ol-${i}`}
          className={
            variant === "dark"
              ? "my-2.5 space-y-2 pl-1"
              : "my-4 space-y-3 pl-1"
          }
        >
          {orderedItems.map((oi, oIdx) => (
            <li
              key={oIdx}
              className={
                variant === "dark"
                  ? "flex items-start gap-2.5 text-xs leading-relaxed text-slate-200"
                  : "flex items-start gap-3 text-base leading-relaxed text-slate-700"
              }
            >
              <span
                className={
                  variant === "dark"
                    ? "mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#0A2342] border border-[#00C4B3]/40 text-[10px] font-bold text-[#00C4B3]"
                    : "mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#0A2342] text-xs font-bold text-[#00C4B3]"
                }
              >
                {oIdx + 1}
              </span>
              <span className="flex-1">
                {renderInlineMarkdown(oi, variant)}
              </span>
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // 7. Standard Paragraph (collect consecutive non-special lines)
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !lines[i].trim().startsWith("#") &&
      !lines[i].trim().startsWith(">") &&
      !/^([-*•])\s+/.test(lines[i].trim()) &&
      !/^\d+\.\s+/.test(lines[i].trim()) &&
      !/^(-{3,}|\*{3,}|_{3,})$/.test(lines[i].trim()) &&
      !(
        lines[i].trim().includes("|") &&
        i + 1 < lines.length &&
        isTableSeparatorLine(lines[i + 1])
      )
    ) {
      paraLines.push(lines[i].trim());
      i++;
    }

    elements.push(
      <p
        key={`p-${i}`}
        className={
          variant === "dark"
            ? "my-2 text-xs leading-relaxed text-slate-300"
            : "my-3.5 text-base leading-relaxed text-slate-700"
        }
      >
        {renderInlineMarkdown(paraLines.join(" "), variant)}
      </p>
    );
  }

  return <div className={className}>{elements}</div>;
}

