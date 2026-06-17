const pptxgen = require("pptxgenjs");
const sharp = require("sharp");
const React = require("react");
const RDS = require("react-dom/server");
const fa = require("react-icons/fa6");
const si = require("react-icons/si");
const fs = require("fs");

// ---------- THEME ----------
const C = {
  bg: "0A0807", card: "14110E", card2: "100D0B", border: "2A241F", border2: "3A332C",
  primary: "EA580C", primaryLt: "FB923C", primaryDk: "9A3412",
  text: "F5F3F0", muted: "9C958B", dim: "73695F", gold: "B08254",
};
const HEAD = "Cambria";   // elegant serif for titles
const BODY = "Calibri";   // clean sans for body
const W = 13.333, H = 7.5;

// ---------- ASSET HELPERS ----------
async function svgPng(svg, density = 300) {
  return "image/png;base64," + (await sharp(Buffer.from(svg), { density }).png().toBuffer()).toString("base64");
}
async function iconPng(IconComp, color = "#F5F3F0", size = 256) {
  const svg = RDS.renderToStaticMarkup(React.createElement(IconComp, { color, size: String(size) }));
  return "image/png;base64," + (await sharp(Buffer.from(svg)).resize(size, size).png().toBuffer()).toString("base64");
}
function flowDefs() {
  return `<defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0.4" y2="1"><stop offset="0" stop-color="#0c0a08"/><stop offset="0.55" stop-color="#070504"/><stop offset="1" stop-color="#0d0805"/></linearGradient>
    <linearGradient id="flow" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#9a3412"/><stop offset="0.5" stop-color="#ea580c"/><stop offset="1" stop-color="#fb923c"/></linearGradient>
    <radialGradient id="haze" cx="0.5" cy="0.0" r="0.9"><stop offset="0" stop-color="#ea580c" stop-opacity="0.10"/><stop offset="1" stop-color="#ea580c" stop-opacity="0"/></radialGradient>
    <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#ea580c" stop-opacity="0.42"/><stop offset="1" stop-color="#ea580c" stop-opacity="0"/></radialGradient>
    <pattern id="grid" width="34" height="34" patternUnits="userSpaceOnUse"><path d="M34 0H0V34" fill="none" stroke="#ffffff" stroke-opacity="0.02" stroke-width="0.7"/></pattern>
  </defs>`;
}
async function bgContent() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1333" height="750" viewBox="0 0 1333 750">${flowDefs()}
    <rect width="1333" height="750" fill="url(#bg)"/><rect width="1333" height="750" fill="url(#grid)"/><rect width="1333" height="750" fill="url(#haze)"/>
    <g fill="none" stroke="url(#flow)" stroke-linecap="round">
      <path d="M-40 150 C 320 60, 640 300, 980 180 S 1440 320, 1360 250" stroke-width="2.5" opacity="0.08"/>
      <path d="M-40 640 C 300 560, 700 760, 1000 640 S 1440 740, 1380 700" stroke-width="2.5" opacity="0.06"/>
    </g>
    <g fill="#ea580c"><circle cx="1120" cy="120" r="2.4" opacity="0.35"/><circle cx="210" cy="560" r="2.2" opacity="0.3"/><circle cx="1180" cy="600" r="2" opacity="0.3"/></g>
  </svg>`;
  return await svgPng(svg, 150);
}
async function bgDivider() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1333" height="750" viewBox="0 0 1333 750">${flowDefs()}
    <rect width="1333" height="750" fill="url(#bg)"/><rect width="1333" height="750" fill="url(#grid)"/>
    <circle cx="1050" cy="375" r="420" fill="url(#glow)" opacity="0.7"/>
    <g fill="none" stroke="url(#flow)" stroke-linecap="round"><path d="M-40 470 C 360 380, 720 600, 1080 470 S 1460 560, 1400 520" stroke-width="3" opacity="0.10"/></g>
  </svg>`;
  return await svgPng(svg, 150);
}
async function logoMark(px = 420) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}" viewBox="0 0 120 120">
    <defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fdba74"/><stop offset="0.55" stop-color="#ea580c"/><stop offset="1" stop-color="#9a3412"/></linearGradient></defs>
    <rect x="6" y="6" width="108" height="108" rx="26" fill="url(#lg)"/>
    <g stroke="#fff7ed" stroke-width="7" fill="none" stroke-linecap="round" opacity="0.96">
      <path d="M34 48 C 50 34, 70 34, 86 48"/><path d="M34 64 C 50 50, 70 50, 86 64"/><path d="M34 80 C 50 66, 70 66, 86 80"/>
    </g></svg>`;
  return await svgPng(svg, 300);
}
// brand tech logo from react-icons (simple-icons) with brand color
async function brandPng(IconComp, hex, size = 256) {
  const svg = RDS.renderToStaticMarkup(React.createElement(IconComp, { color: hex, size: String(size) }));
  return "image/png;base64," + (await sharp(Buffer.from(svg)).png().toBuffer()).toString("base64");
}

// ---------- BUILD ----------
(async () => {
  const A = {
    bgC: await bgContent(), bgD: await bgDivider(), logo: await logoMark(),
    // pipeline / generic icons (off-white on dark, or terracotta)
    iGit: await iconPng(fa.FaCodeBranch, "#F5F3F0"),
    iKanban: await iconPng(fa.FaTableColumnsBig ? fa.FaTableColumnsBig : fa.FaTableColumns, "#F5F3F0"),
    iSprint: await iconPng(fa.FaArrowsSpin, "#F5F3F0"),
    iAI: await iconPng(fa.FaWandMagicSparkles, "#F5F3F0"),
    iAward: await iconPng(fa.FaAward, "#F5F3F0"),
    // problem
    iFile: await iconPng(fa.FaRegFileLines, "#FB923C"),
    iFree: await iconPng(fa.FaUsersSlash ? fa.FaUsersSlash : fa.FaUserLargeSlash, "#FB923C"),
    iAgile: await iconPng(fa.FaArrowsSpin, "#FB923C"),
    // roles
    iCrown: await iconPng(fa.FaCrown, "#FB923C"),
    iBuilding: await iconPng(fa.FaBuildingColumns, "#FB923C"),
    iTeacher: await iconPng(fa.FaChalkboardUser, "#FB923C"),
    iStudent: await iconPng(fa.FaGraduationCap, "#FB923C"),
    // misc
    iLock: await iconPng(fa.FaLock, "#FB923C"),
    iLayer: await iconPng(fa.FaLayerGroup, "#FB923C"),
    iCal: await iconPng(fa.FaRegCalendar, "#FB923C"),
    iBell: await iconPng(fa.FaRegBell, "#FB923C"),
    iCheck: await iconPng(fa.FaCheck, "#FB923C"),
    iCloud: await iconPng(fa.FaCloudArrowUp, "#FB923C"),
    iSearch: await iconPng(fa.FaMagnifyingGlassChart ? fa.FaMagnifyingGlassChart : fa.FaChartLine, "#FB923C"),
    iScale: await iconPng(fa.FaScaleBalanced, "#FB923C"),
    iCode: await iconPng(fa.FaCode, "#FB923C"),
    iBolt: await iconPng(fa.FaBolt, "#FB923C"),
    iMobile: await iconPng(fa.FaMobileScreen, "#FB923C"),
    iGlobe: await iconPng(fa.FaGlobe, "#FB923C"),
    iBrain: await iconPng(fa.FaBrain, "#FB923C"),
    iPlug: await iconPng(fa.FaPlug, "#FB923C"),
    iArrow: await iconPng(fa.FaArrowRightLong, "#73695F"),
    // tech brand logos
    tNext: await brandPng(si.SiNextdotjs, "#F5F3F0"),
    tReact: await brandPng(si.SiReact, "#61DAFB"),
    tTS: await brandPng(si.SiTypescript, "#3178C6"),
    tSupabase: await brandPng(si.SiSupabase, "#3FCF8E"),
    tPg: await brandPng(si.SiPostgresql, "#4169E1"),
    tTw: await brandPng(si.SiTailwindcss, "#38BDF8"),
    tGemini: await brandPng(si.SiGooglegemini, "#A78BFA"),
    tNode: await brandPng(si.SiNodedotjs, "#5FA04E"),
    tGithub: await brandPng(si.SiGithub, "#F5F3F0"),
  };

  const p = new pptxgen();
  p.defineLayout({ name: "WIDE", width: W, height: H });
  p.layout = "WIDE";
  p.author = "Oğulcan Kacar";
  p.title = "CampusFlow";

  const mkShadow = () => ({ type: "outer", color: "000000", blur: 9, offset: 3, angle: 90, opacity: 0.45 });

  // reusable: section header (kicker + title)
  function header(s, kicker, title) {
    s.addText(kicker, { x: 0.7, y: 0.5, w: 12, h: 0.3, fontFace: BODY, fontSize: 12.5, bold: true, color: C.primary, charSpacing: 3 });
    s.addText(title, { x: 0.68, y: 0.78, w: 12, h: 0.7, fontFace: HEAD, fontSize: 30, bold: true, color: C.text });
  }
  // card
  function card(s, x, y, w, h, fill = C.card) {
    s.addShape(p.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.1, fill: { color: fill }, line: { color: C.border, width: 1 }, shadow: mkShadow() });
  }
  // icon in tinted circle
  function iconCircle(s, x, y, d, iconData, tint = "1d1410") {
    s.addShape(p.shapes.OVAL, { x, y, w: d, h: d, fill: { color: tint }, line: { color: C.primaryDk, width: 1 } });
    const ip = d * 0.5; s.addImage({ data: iconData, x: x + (d - ip) / 2, y: y + (d - ip) / 2, w: ip, h: ip });
  }
  function newSlide(bg = A.bgC) { const s = p.addSlide(); s.background = { data: bg }; return s; }

  // ============ SLIDE 1 — TITLE ============
  {
    const s = newSlide(A.bgC);
    s.addImage({ data: A.logo, x: 0.95, y: 1.15, w: 1.5, h: 1.5 });
    s.addText([{ text: "Campus", options: { color: C.text } }, { text: "Flow", options: { color: C.primaryLt } }],
      { x: 2.65, y: 1.18, w: 9, h: 0.95, fontFace: BODY, fontSize: 56, bold: true, charSpacing: -1, valign: "middle" });
    s.addText("IŞIK ÜNİVERSİTESİ · YÖNETİM BİLİŞİM SİSTEMLERİ", { x: 2.68, y: 2.15, w: 9, h: 0.35, fontFace: BODY, fontSize: 13, bold: true, color: C.gold, charSpacing: 2 });
    // project title
    s.addText("Yapay Zekâ Destekli Akademik Çevik Süreç Platformu",
      { x: 0.95, y: 3.5, w: 11.4, h: 1.4, fontFace: HEAD, fontSize: 40, bold: true, color: C.text, lineSpacingMultiple: 1.02 });
    s.addText("Koddan nota uzanan tek, adil bir akış — grup projelerinde gerçek katkıyı yapay zekâ ile şeffaf değerlendirir.",
      { x: 0.97, y: 4.85, w: 10.8, h: 0.6, fontFace: BODY, fontSize: 16, italic: true, color: C.muted });
    // presenter row
    s.addShape(p.shapes.LINE, { x: 0.97, y: 5.75, w: 11.4, h: 0, line: { color: C.border2, width: 1 } });
    s.addText([
      { text: "HAZIRLAYAN\n", options: { fontSize: 10.5, bold: true, color: C.dim, charSpacing: 2, breakLine: true } },
      { text: "Oğulcan Kacar", options: { fontSize: 17, color: C.text, bold: true } },
    ], { x: 0.97, y: 6.0, w: 5, h: 0.55, fontFace: BODY, valign: "top" });
    s.addText("Öğrenci No: ____________", { x: 0.97, y: 6.62, w: 5, h: 0.3, fontFace: BODY, fontSize: 11.5, color: C.dim });
    s.addText([
      { text: "DANIŞMAN\n", options: { fontSize: 10.5, bold: true, color: C.dim, charSpacing: 2, breakLine: true } },
      { text: "Dr. Şahin Aydın", options: { fontSize: 17, color: C.text, bold: true } },
    ], { x: 6.2, y: 6.0, w: 4, h: 0.9, fontFace: BODY, valign: "top" });
    s.addText([
      { text: "YIL\n", options: { fontSize: 10.5, bold: true, color: C.dim, charSpacing: 2, breakLine: true } },
      { text: "2026", options: { fontSize: 17, color: C.text, bold: true } },
    ], { x: 10.6, y: 6.0, w: 1.8, h: 0.9, fontFace: BODY, valign: "top", align: "right" });
    s.addNotes("Kendini ve projeyi tanıt. CampusFlow, üniversite grup projelerini koddan nota tek bir akışta yöneten, yapay zekâ destekli çevik bir platformdur.");
  }

  // ============ SLIDE 2 — İÇİNDEKİLER ============
  {
    const s = newSlide(A.bgC);
    header(s, "GENEL BAKIŞ", "İçindekiler");
    const items = [
      ["I", "Giriş ve Motivasyon", "Problem ve araştırmanın önemi", A.iSearch],
      ["II", "Literatür Araştırması", "İlgili çalışmalar ve boşluk", A.iLayer],
      ["III", "Metodoloji ve Sistem Tasarımı", "Yöntem, mimari, veri tabanı", A.iCode],
      ["IV", "Uygulama ve Bulgular", "Geliştirilen sistem ve analiz", A.iBolt],
      ["V", "Sonuç", "Değerlendirme ve gelecek çalışmalar", A.iCheck],
    ];
    let y = 1.95;
    items.forEach((it, i) => {
      card(s, 0.7, y, 11.93, 0.86);
      iconCircle(s, 1.0, y + 0.18, 0.5, it[3]);
      s.addText(it[0], { x: 1.7, y: y, w: 0.9, h: 0.86, fontFace: HEAD, fontSize: 26, bold: true, color: C.primary, align: "center", valign: "middle" });
      s.addText(it[1], { x: 2.65, y: y + 0.12, w: 7.5, h: 0.4, fontFace: BODY, fontSize: 17, bold: true, color: C.text, valign: "middle" });
      s.addText(it[2], { x: 2.65, y: y + 0.46, w: 9.5, h: 0.32, fontFace: BODY, fontSize: 12.5, color: C.muted, valign: "middle" });
      y += 1.0;
    });
  }

  // ============ DIVIDER helper ============
  function divider(roman, title, sub) {
    const s = newSlide(A.bgD);
    s.addText("BÖLÜM " + roman, { x: 0.9, y: 2.55, w: 8, h: 0.5, fontFace: BODY, fontSize: 16, bold: true, color: C.primary, charSpacing: 4 });
    s.addText(title, { x: 0.87, y: 3.05, w: 9.2, h: 1.6, fontFace: HEAD, fontSize: 46, bold: true, color: C.text, lineSpacingMultiple: 1.0 });
    if (sub) s.addText(sub, { x: 0.9, y: 4.55, w: 8.5, h: 0.6, fontFace: BODY, fontSize: 15, italic: true, color: C.muted });
    s.addText(roman, { x: 9.4, y: 1.4, w: 3.5, h: 4.7, fontFace: HEAD, fontSize: 300, bold: true, color: C.primary, align: "center", valign: "middle", transparency: 78 });
    return s;
  }

  // ============ SLIDE 3 — DIVIDER I ============
  divider("I", "Giriş ve Motivasyon", "Problem nedir, neden önemlidir?");

  // ============ SLIDE 4 — Araştırma Konusunun Önemi ============
  {
    const s = newSlide(A.bgC);
    header(s, "BÖLÜM I · GİRİŞ", "Araştırma Konusunun Önemi");
    const cards = [
      [A.iFile, "Statik teslim", "Grup projeleri dönem sonunda tek bir dosyayla değerlendirilir; süreç görünmez."],
      [A.iFree, "“Serbest binici”", "Bireysel katkı ölçülemediği için emek dağılımı adaletsiz kalır."],
      [A.iAgile, "Çevikten uzak", "Öğrenciler, sektörün temeli olan çevik takım pratiklerinden mahrum kalır."],
    ];
    let x = 0.7;
    cards.forEach((c) => {
      card(s, x, 2.0, 3.84, 3.0);
      iconCircle(s, x + 0.35, 2.35, 0.7, c[0]);
      s.addText(c[1], { x: x + 0.35, y: 3.2, w: 3.2, h: 0.5, fontFace: HEAD, fontSize: 21, bold: true, color: C.text });
      s.addText(c[2], { x: x + 0.35, y: 3.75, w: 3.2, h: 1.1, fontFace: BODY, fontSize: 14, color: C.muted, lineSpacingMultiple: 1.08 });
      x += 4.05;
    });
    s.addText([
      { text: "Hedef:  ", options: { color: C.primaryLt, bold: true } },
      { text: "süreci görünür, katkıyı ölçülebilir ve değerlendirmeyi adil kılmak.", options: { color: C.text } },
    ], { x: 0.7, y: 5.5, w: 11.9, h: 0.6, fontFace: HEAD, fontSize: 20, italic: true, align: "center" });
  }

  // ============ SLIDE 5 — DIVIDER II ============
  divider("II", "Literatür Araştırması", "İlgili çalışmalar ve eksik kalan nokta");

  // ============ SLIDE 6 — İlgili Çalışmalar ============
  {
    const s = newSlide(A.bgC);
    header(s, "BÖLÜM II · LİTERATÜR", "İlgili Çalışmalar");
    const cols = [
      ["Öğrenme Yönetim Sistemleri", "Moodle · Blackboard", ["Ders içeriği ve dosya teslimi", "Süreç ve bireysel katkı görünmez", "Çevik/endüstriyel pratik yok"], false],
      ["Proje Yönetim Araçları", "Jira · Trello · GitHub", ["Güçlü çevik akış", "Akademik/çok kiracılı değil", "Otomatik değerlendirme yok"], false],
      ["CampusFlow", "Bu çalışma", ["Akademik + çevik tek platform", "GitHub katkısını otomatik dinler", "Yapay zekâ ile adil not önerisi"], true],
    ];
    let x = 0.7;
    cols.forEach((c) => {
      const hl = c[3];
      card(s, x, 1.95, 3.84, 3.95, hl ? "1d1410" : C.card);
      if (hl) s.addShape(p.shapes.ROUNDED_RECTANGLE, { x, y: 1.95, w: 3.84, h: 3.95, rectRadius: 0.1, fill: { color: "1d1410", transparency: 100 }, line: { color: C.primary, width: 1.75 } });
      s.addText(c[0], { x: x + 0.3, y: 2.2, w: 3.24, h: 0.6, fontFace: BODY, fontSize: 16.5, bold: true, color: hl ? C.primaryLt : C.text });
      s.addText(c[1], { x: x + 0.3, y: 2.78, w: 3.24, h: 0.3, fontFace: BODY, fontSize: 11.5, italic: true, color: C.dim });
      s.addText(c[2].map((t, i) => ({ text: t, options: { bullet: { code: "2022", indent: 14 }, color: C.muted, fontSize: 13, breakLine: true, paraSpaceAfter: 8 } })),
        { x: x + 0.3, y: 3.25, w: 3.3, h: 2.4, fontFace: BODY, valign: "top" });
      x += 4.05;
    });
    s.addText("Boşluk: akademik bağlama uygun, çevik ve yapay zekâ destekli adil değerlendirme yapan bütünleşik bir platform yoktu.",
      { x: 0.7, y: 6.15, w: 11.9, h: 0.5, fontFace: BODY, fontSize: 13.5, italic: true, color: C.gold, align: "center" });
  }

  // ============ SLIDE 7 — DIVIDER III ============
  divider("III", "Metodoloji ve Sistem Tasarımı", "Yöntem, mimari ve veri tabanı");

  // ============ SLIDE 8 — Yöntem ve Materyaller (tech) ============
  {
    const s = newSlide(A.bgC);
    header(s, "BÖLÜM III · YÖNTEM", "Yöntem ve Materyaller");
    s.addText("Modern, tam yığın (full-stack) bir web mimarisi; çevik geliştirme yöntemiyle hayata geçirildi.",
      { x: 0.7, y: 1.55, w: 11.9, h: 0.4, fontFace: BODY, fontSize: 14.5, color: C.muted });
    const tech = [
      [A.tNext, "Next.js 16", "App Router"], [A.tReact, "React 19", "Arayüz"], [A.tTS, "TypeScript", "Tip güvenliği"],
      [A.tSupabase, "Supabase", "Auth + Backend"], [A.tPg, "PostgreSQL", "Veri tabanı + RLS"], [A.tTw, "Tailwind CSS", "Tasarım"],
      [A.tGemini, "Google Gemini", "Yapay zekâ"], [A.tNode, "Node.js", "Çalışma zamanı"],
    ];
    const cw = 2.83, gap = 0.22, x0 = 0.7, y0 = 2.25, rh = 1.55;
    tech.forEach((t, i) => {
      const col = i % 4, row = Math.floor(i / 4);
      const x = x0 + col * (cw + gap), y = y0 + row * (rh + 0.25);
      card(s, x, y, cw, rh);
      s.addImage({ data: t[0], x: x + cw / 2 - 0.33, y: y + 0.22, w: 0.66, h: 0.66 });
      s.addText(t[1], { x: x, y: y + 0.92, w: cw, h: 0.3, fontFace: BODY, fontSize: 14.5, bold: true, color: C.text, align: "center" });
      s.addText(t[2], { x: x, y: y + 1.2, w: cw, h: 0.28, fontFace: BODY, fontSize: 11, color: C.muted, align: "center" });
    });
    s.addText("Çevik yöntem: iş listesi (backlog) → sprint → Kanban → sürekli teslim.",
      { x: 0.7, y: 6.25, w: 11.9, h: 0.4, fontFace: BODY, fontSize: 13.5, italic: true, color: C.gold, align: "center" });
  }

  // ============ SLIDE 9 — Metodoloji (pipeline) ============
  {
    const s = newSlide(A.bgC);
    header(s, "BÖLÜM III · METODOLOJİ", "Sistem Akışı — “Sıfır-Dosya” Mimarisi");
    s.addText("GitHub ve çalışma alanındaki gerçek dijital katkı asenkron dinlenir, yapay zekâ ile değerlendirmeye dönüşür.",
      { x: 0.7, y: 1.55, w: 11.9, h: 0.4, fontFace: BODY, fontSize: 14.5, color: C.muted });
    const steps = [
      [A.iGit, "GitHub", "Commit & PR", true], [A.iKanban, "Kanban", "Görev takibi", false],
      [A.iSprint, "Sprint", "Dönem planı", false], [A.iAI, "Yapay Zekâ", "Analiz", false], [A.iAward, "Not Önerisi", "Gerekçeli", true],
    ];
    const n = steps.length, d = 1.5, gapX = (11.93 - n * d) / (n - 1), x0 = 0.7, cy = 3.5;
    // connector line
    s.addShape(p.shapes.LINE, { x: x0 + d / 2, y: cy + d / 2, w: (n - 1) * (d + gapX), h: 0, line: { color: C.primary, width: 2.5 } });
    steps.forEach((st, i) => {
      const x = x0 + i * (d + gapX);
      s.addShape(p.shapes.OVAL, { x, y: cy, w: d, h: d, fill: { color: C.card }, line: { color: st[3] ? C.primary : C.border2, width: st[3] ? 2.5 : 1.5 } });
      s.addImage({ data: st[0], x: x + d / 2 - 0.34, y: cy + d / 2 - 0.34, w: 0.68, h: 0.68 });
      s.addText(st[1], { x: x - 0.3, y: cy + d + 0.12, w: d + 0.6, h: 0.32, fontFace: BODY, fontSize: 15, bold: true, color: C.text, align: "center" });
      s.addText(st[2], { x: x - 0.3, y: cy + d + 0.44, w: d + 0.6, h: 0.3, fontFace: BODY, fontSize: 12, color: C.muted, align: "center" });
    });
    s.addText([
      { text: "Manipülasyona açık akran anketleri olmadan, ", options: { color: C.muted } },
      { text: "gerçek efor dağılımı", options: { color: C.primaryLt, bold: true } },
      { text: " ortaya çıkar.", options: { color: C.muted } },
    ], { x: 0.7, y: 6.2, w: 11.9, h: 0.5, fontFace: BODY, fontSize: 14, italic: true, align: "center" });
  }

  // ============ SLIDE 10 — Veri Tabanı Mimarisi ============
  {
    const s = newSlide(A.bgC);
    header(s, "BÖLÜM III · MİMARİ", "Veri Tabanı Mimarisi");
    // layered architecture: 3 layers
    const layers = [
      ["İSTEMCİ", "Next.js + React arayüzü · Server Actions", C.text],
      ["GÜVENLİK KATMANI", "Supabase Auth · Row Level Security (RLS) · Çok kiracılı izolasyon", C.primaryLt],
      ["VERİ TABANI", "PostgreSQL · 15+ tablo · 17 migration", C.text],
    ];
    let y = 1.95;
    layers.forEach((l, i) => {
      card(s, 0.7, y, 6.4, 1.15, i === 1 ? "1d1410" : C.card);
      s.addText(l[0], { x: 0.95, y: y + 0.18, w: 5.8, h: 0.35, fontFace: BODY, fontSize: 12, bold: true, color: i === 1 ? C.primaryLt : C.gold, charSpacing: 2 });
      s.addText(l[1], { x: 0.95, y: y + 0.55, w: 5.9, h: 0.5, fontFace: BODY, fontSize: 13.5, color: C.muted });
      if (i < 2) s.addImage({ data: A.iArrow, x: 3.75, y: y + 1.16, w: 0.3, h: 0.3, rotate: 90 });
      y += 1.55;
    });
    // right: key tables grid
    card(s, 7.45, 1.95, 5.15, 4.3);
    s.addText("Temel Tablolar", { x: 7.75, y: 2.15, w: 4.5, h: 0.4, fontFace: BODY, fontSize: 14, bold: true, color: C.text });
    const tables = ["organizations", "profiles", "courses", "teams", "sprints", "tasks", "task_integrations", "ai_analyses", "grade_suggestions", "calendar_events"];
    const tx = [7.75, 10.15];
    tables.forEach((t, i) => {
      const col = i % 2, row = Math.floor(i / 2);
      s.addShape(p.shapes.ROUNDED_RECTANGLE, { x: tx[col], y: 2.65 + row * 0.66, w: 2.2, h: 0.5, rectRadius: 0.05, fill: { color: "100D0B" }, line: { color: C.border2, width: 1 } });
      s.addText(t, { x: tx[col] + 0.15, y: 2.65 + row * 0.66, w: 2.0, h: 0.5, fontFace: "Consolas", fontSize: 11.5, color: C.primaryLt, valign: "middle" });
    });
    s.addText("SECURITY DEFINER fonksiyonları ile RLS özyinelemesi çözüldü; her kurum kendi verisinde izole.",
      { x: 0.7, y: 6.45, w: 11.9, h: 0.4, fontFace: BODY, fontSize: 13, italic: true, color: C.gold, align: "center" });
  }

  // ============ SLIDE 11 — DIVIDER IV ============
  divider("IV", "Uygulama ve Bulgular", "Geliştirilen sistem ve değerlendirme");

  // ============ SLIDE 12 — Geliştirilen Sistem ============
  {
    const s = newSlide(A.bgC);
    header(s, "BÖLÜM IV · UYGULAMA", "Geliştirilen Sistem");
    // screenshot framed left
    card(s, 0.7, 1.95, 6.9, 4.45);
    s.addShape(p.shapes.OVAL, { x: 0.95, y: 2.2, w: 0.12, h: 0.12, fill: { color: "57514A" }, line: { type: "none" } });
    s.addShape(p.shapes.OVAL, { x: 1.13, y: 2.2, w: 0.12, h: 0.12, fill: { color: "57514A" }, line: { type: "none" } });
    s.addShape(p.shapes.OVAL, { x: 1.31, y: 2.2, w: 0.12, h: 0.12, fill: { color: "57514A" }, line: { type: "none" } });
    s.addText("AI Rapor Paneli", { x: 1.6, y: 2.12, w: 4, h: 0.28, fontFace: BODY, fontSize: 11, color: C.dim, valign: "middle" });
    s.addImage({ path: "ss1.jpg", x: 0.92, y: 2.55, w: 6.46, h: 3.62, sizing: { type: "contain", w: 6.46, h: 3.62 } });
    // right: roles
    s.addText("Rol Tabanlı 4 Panel", { x: 7.9, y: 2.0, w: 4.7, h: 0.4, fontFace: BODY, fontSize: 16, bold: true, color: C.text });
    const roles = [
      [A.iCrown, "Süper Admin", "Tüm üniversiteler"], [A.iBuilding, "Admin", "Kendi kurumu"],
      [A.iTeacher, "Eğitmen", "Ders, takım, değerlendirme"], [A.iStudent, "Öğrenci", "Sprint, görev, teslim"],
    ];
    let y = 2.55;
    roles.forEach((r) => {
      card(s, 7.9, y, 4.7, 0.84);
      iconCircle(s, 8.12, y + 0.17, 0.5, r[0]);
      s.addText(r[1], { x: 8.8, y: y + 0.13, w: 3.6, h: 0.34, fontFace: BODY, fontSize: 14.5, bold: true, color: C.text, valign: "middle" });
      s.addText(r[2], { x: 8.8, y: y + 0.45, w: 3.6, h: 0.3, fontFace: BODY, fontSize: 11.5, color: C.muted, valign: "middle" });
      y += 0.95;
    });
  }

  // ============ SLIDE 13 — Performans Analizi ============
  {
    const s = newSlide(A.bgC);
    header(s, "BÖLÜM IV · BULGULAR", "Performans Analizi");
    // stat callouts
    const stats = [["15+", "Veri tabanı tablosu"], ["4", "Rol seviyesi"], ["9", "Fonksiyonel modül"], ["100%", "Çok kiracılı izolasyon"]];
    let x = 0.7;
    stats.forEach((st) => {
      card(s, x, 1.9, 2.83, 1.5);
      s.addText(st[0], { x: x, y: 1.98, w: 2.83, h: 0.75, fontFace: HEAD, fontSize: 38, bold: true, color: C.primaryLt, align: "center" });
      s.addText(st[1], { x: x + 0.1, y: 2.78, w: 2.63, h: 0.5, fontFace: BODY, fontSize: 12, color: C.muted, align: "center" });
      x += 3.03;
    });
    // comparison chart
    card(s, 0.7, 3.65, 11.93, 2.95);
    s.addText("Yetenek Karşılaştırması (niteliksel)", { x: 0.95, y: 3.8, w: 8, h: 0.35, fontFace: BODY, fontSize: 13.5, bold: true, color: C.text });
    s.addChart(p.charts.BAR, [
      { name: "Geleneksel LMS", labels: ["Şeffaflık", "Efor ölçümü", "Otomasyon", "Çevik pratik", "Adil not"], values: [3, 2, 2, 1, 3] },
      { name: "CampusFlow", labels: ["Şeffaflık", "Efor ölçümü", "Otomasyon", "Çevik pratik", "Adil not"], values: [9, 9, 8, 9, 9] },
    ], {
      x: 0.85, y: 4.2, w: 11.6, h: 2.25, barDir: "col", chartColors: ["6F6860", "EA580C"],
      chartArea: { fill: { color: "14110E" } }, plotArea: { fill: { color: "14110E" } },
      catAxisLabelColor: "9C958B", catAxisLabelFontFace: BODY, catAxisLabelFontSize: 11,
      valAxisHidden: true, valGridLine: { style: "none" }, catGridLine: { style: "none" },
      valAxisMaxVal: 10, valAxisMinVal: 0,
      showLegend: true, legendPos: "t", legendColor: "9C958B", legendFontFace: BODY, legendFontSize: 11,
      barGapWidthPct: 60,
    });
    s.addNotes("Bu grafik niteliksel/kavramsal bir karşılaştırmadır. Gerçek ölçümlerin (yanıt süresi, kullanıcı testi sonuçları) varsa buraya ekleyebilirsin.");
  }

  // ============ SLIDE 14 — DIVIDER V ============
  divider("V", "Sonuç", "Değerlendirme ve gelecek çalışmalar");

  // ============ SLIDE 15 — Sonuç ve Tartışma ============
  {
    const s = newSlide(A.bgC);
    header(s, "BÖLÜM V · SONUÇ", "Sonuç ve Tartışma");
    const points = [
      [A.iScale, "Adil değerlendirme", "Gerçek dijital katkı analiz edilerek “serbest binici” sorunu önlenir."],
      [A.iAgile, "Çevik yetkinlik", "Öğrenciler Sprint/Kanban ile sektöre hazır pratikler kazanır."],
      [A.iBrain, "Yapay zekâ analitiği", "LLM ile şeffaf, gerekçeli ve bireysel not önerileri üretilir."],
      [A.iLock, "Güvenli & ölçeklenebilir", "Çok kiracılı mimari ve RLS ile kurumsal düzeyde izolasyon."],
    ];
    let y = 1.95, x = 0.7;
    points.forEach((pt, i) => {
      const col = i % 2; const xx = 0.7 + col * 6.06; if (i % 2 === 0 && i > 0) y += 2.1; const yy = 1.95 + Math.floor(i / 2) * 2.1;
      card(s, xx, yy, 5.87, 1.85);
      iconCircle(s, xx + 0.3, yy + 0.32, 0.7, pt[0]);
      s.addText(pt[1], { x: xx + 1.2, y: yy + 0.28, w: 4.4, h: 0.45, fontFace: HEAD, fontSize: 19, bold: true, color: C.text });
      s.addText(pt[2], { x: xx + 1.2, y: yy + 0.78, w: 4.5, h: 0.9, fontFace: BODY, fontSize: 13.5, color: C.muted, lineSpacingMultiple: 1.05 });
    });
  }

  // ============ SLIDE 16 — Gelecek Çalışmalar ============
  {
    const s = newSlide(A.bgC);
    header(s, "BÖLÜM V · GELECEK", "Gelecek Çalışmalar");
    const phases = [
      [A.iMobile, "Faz I", "Mobil Uygulama", "iOS/Android ile her yerden erişim"],
      [A.iBrain, "Faz II", "Daha Derin AI", "Kod kalitesi ve katkı tahmini"],
      [A.iGlobe, "Faz III", "Çoklu Dil & Global", "Uluslararası kurumlara ölçeklenme"],
      [A.iPlug, "Faz IV", "LMS Entegrasyonu", "Moodle/Blackboard ve not aktarımı"],
    ];
    const cw = 2.83, gap = 0.22, x0 = 0.7, y = 2.2, ch = 3.7;
    phases.forEach((ph, i) => {
      const x = x0 + i * (cw + gap);
      card(s, x, y, cw, ch);
      iconCircle(s, x + cw / 2 - 0.4, y + 0.4, 0.8, ph[0]);
      s.addText(ph[1], { x: x, y: y + 1.4, w: cw, h: 0.3, fontFace: BODY, fontSize: 12, bold: true, color: C.primary, align: "center", charSpacing: 2 });
      s.addText(ph[2], { x: x + 0.2, y: y + 1.75, w: cw - 0.4, h: 0.7, fontFace: HEAD, fontSize: 18, bold: true, color: C.text, align: "center" });
      s.addText(ph[3], { x: x + 0.25, y: y + 2.5, w: cw - 0.5, h: 0.9, fontFace: BODY, fontSize: 12.5, color: C.muted, align: "center", lineSpacingMultiple: 1.06 });
    });
  }

  // ============ SLIDE 17 — Kaynaklar & Soru-Cevap ============
  {
    const s = newSlide(A.bgD);
    s.addText("KAYNAKLAR & SORU-CEVAP", { x: 0.9, y: 0.7, w: 11, h: 0.4, fontFace: BODY, fontSize: 13, bold: true, color: C.primary, charSpacing: 3 });
    // references left
    s.addText("Seçili Kaynaklar", { x: 0.9, y: 1.25, w: 7, h: 0.4, fontFace: HEAD, fontSize: 20, bold: true, color: C.text });
    const refs = [
      "Beck, K. et al. (2001). Manifesto for Agile Software Development.",
      "Siemens, G. (2013). Learning Analytics: The Emergence of a Discipline. American Behavioral Scientist.",
      "Davenport, T. H. (2018). The AI Advantage. MIT Press.",
      "Brooks, C. & Greer, J. (2014). Explaining predictive models of student success. LAK.",
      "Vaswani, A. et al. (2017). Attention Is All You Need. NeurIPS.",
    ];
    s.addText(refs.map((r) => ({ text: r, options: { bullet: { code: "2022", indent: 16 }, color: C.muted, fontSize: 12.5, breakLine: true, paraSpaceAfter: 10 } })),
      { x: 0.95, y: 1.75, w: 7.1, h: 3.4, fontFace: BODY, valign: "top", lineSpacingMultiple: 1.05 });
    // right: thanks card
    card(s, 8.4, 1.6, 4.2, 4.0, "1d1410");
    s.addImage({ data: A.logo, x: 10.0, y: 2.0, w: 1.0, h: 1.0 });
    s.addText("Sorularınız?", { x: 8.6, y: 3.2, w: 3.8, h: 0.5, fontFace: HEAD, fontSize: 26, bold: true, color: C.text, align: "center" });
    s.addText("Dinlediğiniz için teşekkürler.", { x: 8.6, y: 3.8, w: 3.8, h: 0.4, fontFace: BODY, fontSize: 13, italic: true, color: C.muted, align: "center" });
    s.addText([
      { text: "Oğulcan Kacar\n", options: { fontSize: 14, bold: true, color: C.text, breakLine: true } },
      { text: "ogulcankacarr@gmail.com", options: { fontSize: 12.5, color: C.primaryLt } },
    ], { x: 8.6, y: 4.5, w: 3.8, h: 0.8, fontFace: BODY, align: "center", valign: "top" });
    s.addText("CampusFlow — koddan nota uzanan tek, adil bir akış.",
      { x: 0.9, y: 6.55, w: 11.5, h: 0.4, fontFace: HEAD, fontSize: 14, italic: true, color: C.gold });
  }

  await p.writeFile({ fileName: "Tez_Sunum_CampusFlow.pptx" });
  console.log("WROTE Tez_Sunum_CampusFlow.pptx with", p.slides ? p.slides.length : "?", "slides");
})();
