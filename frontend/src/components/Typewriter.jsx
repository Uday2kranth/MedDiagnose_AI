import React, { useState, useEffect } from 'react';

const parseMarkdown = (text) => {
  if (!text) return "";

  // Split into lines
  const lines = text.split("\n");
  const html = [];
  let inList = false;
  let inTable = false;
  let isHeader = true;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line === "") {
      if (inList) {
        html.push("</ul>");
        inList = false;
      }
      if (inTable) {
        html.push("</tbody></table>");
        inTable = false;
      }
      continue;
    }

    // Horizontal Rule
    if (line === "---") {
      if (inList) { html.push("</ul>"); inList = false; }
      if (inTable) { html.push("</tbody></table>"); inTable = false; }
      html.push('<hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.12); margin: 12px 0;" />');
      continue;
    }

    // Headers
    if (line.startsWith("### ")) {
      if (inList) { html.push("</ul>"); inList = false; }
      if (inTable) { html.push("</tbody></table>"); inTable = false; }
      html.push(`<h4 style="margin: 12px 0 6px; font-weight: 700; color: var(--accent-peach, #ffccaa); font-size: 14px;">${line.substring(4)}</h4>`);
      continue;
    }
    if (line.startsWith("## ")) {
      if (inList) { html.push("</ul>"); inList = false; }
      if (inTable) { html.push("</tbody></table>"); inTable = false; }
      html.push(`<h3 style="margin: 16px 0 8px; font-weight: 700; color: var(--accent-lilac, #c4b5fd); font-size: 15px;">${line.substring(3)}</h3>`);
      continue;
    }
    if (line.startsWith("# ")) {
      if (inList) { html.push("</ul>"); inList = false; }
      if (inTable) { html.push("</tbody></table>"); inTable = false; }
      html.push(`<h2 style="margin: 18px 0 10px; font-weight: 800; color: var(--text-white, #fff); font-size: 16px;">${line.substring(2)}</h2>`);
      continue;
    }

    // Markdown Table Parser
    if (line.startsWith("|")) {
      if (inList) { html.push("</ul>"); inList = false; }
      
      // Check if it is a separator row like |---|---|
      if (line.match(/^\|[\s\-\:\|]+$/)) {
        continue; // Skip the separator row
      }

      if (!inTable) {
        html.push('<table style="width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 11px; background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 6px; overflow: hidden; table-layout: auto;">');
        html.push('<thead>');
        inTable = true;
        isHeader = true;
      }

      // Split columns and remove outer empty matches from splitting the bounds
      const cells = line.split("|").map(c => c.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);

      if (isHeader) {
        const headerRow = cells.map(c => `<th style="padding: 8px 10px; text-align: left; font-weight: 700; border-bottom: 2px solid rgba(255,255,255,0.12); background: rgba(255,255,255,0.06); color: var(--text-white, #fff);">${c}</th>`).join("");
        html.push(`<tr style="background: rgba(0,0,0,0.2);">${headerRow}</tr>`);
        html.push('</thead><tbody>');
        isHeader = false;
      } else {
        const dataRow = cells.map(c => `<td style="padding: 8px 10px; border-bottom: 1px solid rgba(255,255,255,0.06); color: var(--text-normal, #d1d5db);">${c}</td>`).join("");
        html.push(`<tr style="transition: background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.02)'" onmouseout="this.style.background='transparent'">${dataRow}</tr>`);
      }
      continue;
    }

    // Close table if we exit table block
    if (inTable && !line.startsWith("|")) {
      html.push("</tbody></table>");
      inTable = false;
    }

    // Bullet points (* , - , • )
    const bulletMatch = line.match(/^[\*\-•]\s+(.*)/);
    if (bulletMatch) {
      if (!inList) {
        html.push('<ul style="margin: 6px 0 8px; padding-left: 18px; list-style-type: disc; display: flex; flex-direction: column; gap: 4px;">');
        inList = true;
      }
      html.push(`<li style="line-height: 1.5; color: var(--text-normal, #d1d5db);">${bulletMatch[1]}</li>`);
      continue;
    }

    // Default paragraph
    if (inList) {
      html.push("</ul>");
      inList = false;
    }
    html.push(`<p style="margin: 6px 0; line-height: 1.5; color: var(--text-normal, #d1d5db); text-align: justify;">${line}</p>`);
  }

  // Final tags closure
  if (inList) {
    html.push("</ul>");
  }
  if (inTable) {
    html.push("</tbody></table>");
  }

  let result = html.join("");

  // Bold inline replacement (**text**)
  result = result.replace(/\*\*(.*?)\*\*/g, '<strong style="color: var(--text-white, #fff); font-weight: 600;">$1</strong>');

  // Emphasis inline replacement (*text*)
  result = result.replace(/\*(.*?)\*/g, '<em style="font-style: italic;">$1</em>');

  // Warnings / Disclaimers highlights
  result = result.replace(/⚠️/g, '<span style="color: #fbbf24; margin-right: 4px; display: inline-block;">⚠️</span>');

  return result;
};

const Typewriter = ({ text, speed = 8 }) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [text]);

  useEffect(() => {
    if (index >= text.length) return;

    const timer = setTimeout(() => {
      setIndex((prev) => prev + 1);
    }, speed);

    return () => clearTimeout(timer);
  }, [index, text, speed]);

  const displayedText = text.slice(0, index);
  const parsedHTML = parseMarkdown(displayedText);

  return (
    <div
      className="parsed-markdown-content"
      style={{ display: 'flex', flexDirection: 'column', gap: '2px', width: '100%' }}
      dangerouslySetInnerHTML={{ __html: parsedHTML }}
    />
  );
};

export default Typewriter;
