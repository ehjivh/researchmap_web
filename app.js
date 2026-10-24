const emptyData = {
  researcher: { interests: [], areas: [], links: [] },
  education: [], experience: [], papers: [], books: [], presentations: [],
  music: [], misc: [], media: [], awards: [], committees: [], associations: [], social: [], others: []
};
let currentData = emptyData;
const text = (value) => typeof value === "string" ? value : value?.ja || value?.en || "";
const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c]));
const date = (value) => String(value || "").replace(/-/g, ".");
const titleOf = (item) => text(item.paper_title) || text(item.book_title) || text(item.presentation_title) || text(item.media_coverage_title) || text(item.other_title) || text(item.award_name) || text(item.title) || text(item.name) || "（タイトル未登録）";
const yearOf = (item) => date(item.publication_date || item.from_date || item.date || "—");
function authorNames(item) {
  const source = item.authors || item.presenters;
  const names = source?.ja || source?.en;
  if (Array.isArray(names)) return names.map((author) => typeof author === "string" ? author : author?.name || "").filter(Boolean);
  if (typeof names === "string" && names.trim()) return [names.trim()];
  return [];
}
const citationAuthor = (item) => authorNames(item).join("、") || "著者情報なし";
const citationKey = (kind, item, index) => `${kind}_${String(yearOf(item)).replace(/\D/g, "") || "nd"}_${index + 1}`;
function citationData(kind, item, index) {
  const author = citationAuthor(item);
  const title = titleOf(item);
  const year = String(yearOf(item)).slice(0, 4);
  const source = text(item.publication_name) || text(item.publisher) || text(item.event);
  const apa = kind === "presentation"
    ? `${author} (${year || "n.d."}). ${title}. ${source || "学会発表"}`
    : `${author} (${year || "n.d."}). ${title}. ${source ? `${source}.` : ""}`.replace(/\.\s*\.$/, ".");
  const key = citationKey(kind, item, index);
  const bibtexAuthors = authorNames(item).join(" and ") || "著者情報なし";
  const bibtex = `@misc{${key},\n  author = {${bibtexAuthors}},\n  title = {${title}},\n  year = {${year || "n.d."}}${source ? `,\n  howpublished = {${source}}` : ""}\n}`;
  return { apa, bibtex };
}
function citationHtml(kind, item, index) {
  if (!["paper", "book", "presentation", "misc", "media"].includes(kind)) return "";
  const citation = citationData(kind, item, index);
  return `<details class="citation"><summary>引用形式を表示</summary><div class="citation-row"><strong>APA</strong><code>${esc(citation.apa)}</code><button type="button" class="copy-citation" data-copy="${esc(citation.apa)}">コピー</button></div><div class="citation-row"><strong>BibTeX</strong><code>${esc(citation.bibtex)}</code><button type="button" class="copy-citation" data-copy="${esc(citation.bibtex)}">コピー</button></div></details>`;
}
function empty(message = "登録された情報はありません。") { return `<p class="empty">${message}</p>`; }
function renderItems(id, items, kind = "") {
  const el = document.querySelector(`#${id}-list`);
  if (!el) return;
  el.innerHTML = items.length ? items.map(([meta, title, detail, url, citation], index) => `<div class="item searchable"><div class="item-title">${esc(title)}${url ? `<a class="item-link" href="${esc(url)}" target="_blank" rel="noreferrer">詳細 ↗</a>` : ""}</div>${meta ? `<div class="item-meta">${esc(meta)}</div>` : ""}${detail ? `<div class="item-detail">${esc(detail)}</div>` : ""}${citation ? citationHtml(kind, citation, index) : ""}</div>`).join("") : empty();
}
function render(data) {
  currentData = data;
  const r = data.researcher;
  document.querySelector("#profile-id").textContent = r.id || "—";
  document.querySelector("#researcher-name").textContent = `${text(r.family_name)} ${text(r.given_name)}`.trim() || "研究者名未登録";
  document.querySelector("#researcher-name-en").textContent = `${text(r.given_name?.en)} ${text(r.family_name?.en)}`.trim();
  const affiliation = r.affiliations?.[0] || {};
  document.querySelector("#affiliation-summary").textContent = [text(affiliation.affiliation), text(affiliation.job)].filter(Boolean).join("　");
  document.querySelector("#external-links").innerHTML = (r.links || []).map(([label, url]) => `<a href="${esc(url)}" target="_blank" rel="noreferrer">${esc(label)} ↗</a>`).join("");
  document.querySelector("#basic-list").innerHTML = [
    ["氏名", `${text(r.family_name)} ${text(r.given_name)}`.trim()],
    ["氏名（英語）", `${text(r.given_name?.en)} ${text(r.family_name?.en)}`.trim()],
    ["所属", [text(affiliation.affiliation), text(affiliation.job)].filter(Boolean).join("　")],
    ["研究者ID", r.id || ""],
    ["外部リンク", (r.links || []).map(([label, url]) => `<a href="${esc(url)}" target="_blank" rel="noreferrer">${esc(label)} ↗</a>`).join("　")]
  ].filter(([, value]) => value).map(([label, value]) => `<div class="area-item searchable"><strong>${esc(label)}</strong><span>${value}</span></div>`).join("") || empty();
  document.querySelector("#research-area-list").innerHTML = r.areas?.length ? r.areas.map(([discipline, field, keyword]) => `<div class="area-item searchable"><strong>${esc(discipline)}</strong>${esc(field)}${keyword ? `　${esc(keyword)}` : ""}</div>`).join("") : empty();
  document.querySelector("#keyword-list").innerHTML = r.interests?.length ? r.interests.map((keyword) => `<div class="item searchable"><div class="item-title">${esc(keyword)}</div></div>`).join("") : empty();
  renderItems("education", data.education || []);
  renderItems("experience", data.experience || []);
  renderItems("papers", data.papers || [], "paper");
  renderItems("books", data.books || [], "book");
  renderItems("presentations", data.presentations || [], "presentation");
  renderItems("misc", data.misc || [], "misc");
  renderItems("media", data.media || [], "media");
  renderItems("awards", data.awards || []);
  renderItems("committees", data.committees || []);
  renderItems("associations", data.associations || []);
  renderItems("social", data.social || []);
  renderItems("others", data.others || []);
}
function parseExport(raw) {
  let records;
  try {
    const parsed = JSON.parse(raw);
    records = Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    records = [];
    let start = -1;
    let depth = 0;
    let inString = false;
    let escaped = false;
    for (let index = 0; index < raw.length; index += 1) {
      const character = raw[index];
      if (inString) {
        if (escaped) escaped = false;
        else if (character === "\\") escaped = true;
        else if (character === '"') inString = false;
        continue;
      }
      if (character === '"') {
        inString = true;
      } else if (character === "{") {
        if (depth === 0) start = index;
        depth += 1;
      } else if (character === "}") {
        depth -= 1;
        if (depth === 0 && start >= 0) {
          records.push(JSON.parse(raw.slice(start, index + 1)));
          start = -1;
        }
      }
    }
    if (!records.length) throw new Error("JSON records not found");
  }
  const out = { researcher: { interests: [], areas: [], links: [] }, education: [], experience: [], papers: [], books: [], presentations: [], music: [], misc: [], media: [], awards: [], committees: [], associations: [], social: [], others: [] };
  for (const record of records) {
    const type = record?.insert?.type, item = record?.merge || {};
    if (type === "researchers") {
      out.researcher = { ...out.researcher, ...item, id: record.insert.id, links: (item.see_also || []).map((link) => [link.label || "外部リンク", link["@id"]]).filter((link) => link[1]) };
    } else if (type === "research_interests") out.researcher.interests.push(text(item.keyword));
    else if (type === "research_areas") out.researcher.areas.push([text(item.discipline), text(item.research_field), text(item.research_keyword)]);
    else if (type === "education") out.education.push([`${date(item.from_date)} — ${date(item.to_date)}`, text(item.affiliation), [text(item.department), text(item.course)].filter(Boolean).join(" / ")]);
    else if (type === "research_experience") out.experience.push([`${date(item.from_date)} — ${item.to_date === "9999" ? "" : date(item.to_date)}`, text(item.affiliation), [text(item.section), text(item.job)].filter(Boolean).join(" / ")]);
    else if (type === "published_papers") out.papers.push([yearOf(item), titleOf(item), text(item.publication_name), item.see_also?.[0]?.["@id"], item]);
    else if (type === "books_etc") out.books.push([yearOf(item), titleOf(item), text(item.publisher), item.see_also?.[0]?.["@id"], item]);
    else if (type === "presentations" || type.includes("lecture")) out.presentations.push([yearOf(item), titleOf(item), [text(item.event), text(item.presentation_type), text(item.location)].filter(Boolean).join(" / "), item.see_also?.[0]?.["@id"], item]);
    else if (type.includes("music") || type.includes("musical") || type.includes("composition") || type.includes("artistic")) out.music.push([yearOf(item), titleOf(item), [text(item.event), text(item.publisher), text(item.description)].filter(Boolean).join(" / "), item.see_also?.[0]?.["@id"]]);
    else if (type === "media_coverage") out.media.push([yearOf(item), titleOf(item), [text(item.publisher), text(item.event)].filter(Boolean).join(" / "), item.see_also?.[0]?.["@id"], item]);
    else if (type === "awards") out.awards.push([yearOf(item), titleOf(item), text(item.publisher)]);
    else if (type === "committee_memberships") out.committees.push([`${date(item.from_date)} — ${item.to_date === "9999" ? "" : date(item.to_date)}`, text(item.committee_name) || text(item.role), text(item.association)]);
    else if (type === "association_memberships") out.associations.push([`${date(item.from_date)} — ${item.to_date === "9999" ? "" : date(item.to_date)}`, text(item.association) || text(item.organization), text(item.role) || text(item.position)]);
    else if (type === "social_contribution") out.social.push([yearOf(item), titleOf(item), text(item.organization)]);
    else if (type === "misc") out.misc.push([yearOf(item), titleOf(item), [text(item.publication_name), text(item.publisher), text(item.misc_type)].filter(Boolean).join(" / "), item.see_also?.[0]?.["@id"], item]);
    else if (type === "others") out.others.push([yearOf(item), titleOf(item), ""]);
  }
  return out;
}
function showToast(message) { const toast = document.querySelector("#toast"); toast.textContent = message; toast.classList.add("visible"); setTimeout(() => toast.classList.remove("visible"), 2500); }
document.querySelector("#file-input").addEventListener("change", async (event) => {
  const file = event.target.files?.[0]; if (!file) return;
  try { render(parseExport(await file.text())); document.querySelector("#source-status").textContent = `${file.name} を読み込みました`; showToast("読み込みました"); }
  catch (error) { document.querySelector("#source-status").textContent = "読み込みに失敗しました"; showToast("JSON / JSONL形式を確認してください"); console.error(error); }
});
document.querySelector("#search-input").addEventListener("input", (event) => {
  const query = event.target.value.trim().toLowerCase();
  document.querySelectorAll(".searchable").forEach((el) => el.classList.toggle("is-hidden", query && !el.textContent.toLowerCase().includes(query)));
});
document.addEventListener("click", async (event) => {
  const button = event.target.closest(".copy-citation");
  if (!button) return;
  try { await navigator.clipboard.writeText(button.dataset.copy); showToast("引用をコピーしました"); button.textContent = "コピー済み"; setTimeout(() => { button.textContent = "コピー"; }, 1800); }
  catch (error) { showToast("コピーできませんでした"); console.error(error); }
});
render(emptyData);
