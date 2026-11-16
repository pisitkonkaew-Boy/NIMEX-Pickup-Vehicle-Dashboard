/* NIMEX Pickup Vehicle Dashboard — share.js
   แชร์/ส่งออกแบบเลือกหัวข้อ (Excel, PowerPoint, PNG ยาว, ข้อความ) + อินโฟกราฟิก 16:9
   ไม่มีการคำนวณ KPI ใหม่ในไฟล์นี้: ตัวเลขทั้งหมดมาจากฟังก์ชันเดิมใน app.js ที่ส่งเข้ามาทาง A
   ภาพสร้างจาก SVG ล้วน ฝังฟอนต์ Prompt + โลโก้ (ไม่ใช้ html2canvas) */
window.PickupShare = function(A){
window.__pickupA = A;   /* NIMEX Hub ศูนย์รายงาน อ่านตัวเลข Ontime ผ่าน computeKPISet เดิม */
var state = A.state, anState = A.anState, analysisRows = A.analysisRows, applyFilters = A.applyFilters, buildDcTableModel = A.buildDcTableModel, chartWindowTrips = A.chartWindowTrips, computeKPISet = A.computeKPISet, dataMinKey = A.dataMinKey, diffPct = A.diffPct, effectiveGranularity = A.effectiveGranularity, fmtBaht = A.fmtBaht, fmtDelta = A.fmtDelta, fmtInt = A.fmtInt, fmtPct = A.fmtPct, getProblemTrips = A.getProblemTrips, groupByBucket = A.groupByBucket, locationOf = A.locationOf, prevTripsForPeriod = A.prevTripsForPeriod, previousPeriod = A.previousPeriod, shortRangeLabel = A.shortRangeLabel, showToast = A.showToast, avgDelayMin = A.avgDelayMin, tripsInRange = A.tripsInRange, tripMatchesNonDateFilters = A.tripMatchesNonDateFilters, dcShortLabel = A.dcShortLabel, dcRowsFor = A.dcRowsFor;
// ===================== [ปรับ 08/11/2569] แชร์และส่งออก ตาม NIMEX Design Kit =====================
// ทุกไฟล์ใช้ผลตามตัวกรองปัจจุบัน · ภาพสร้างจาก SVG ล้วนที่ฝังฟอนต์ Prompt (ไม่ใช้ html2canvas) · ชื่อไฟล์ภาษาอังกฤษ
var SECS = [['kpi','ผลสำคัญ'],['trend','แนวโน้ม Ontime %'],['delay','เวลาล่าช้าเฉลี่ย'],['dc','สรุปราย DC'],['cust','ลูกค้าที่ได้รับผลกระทบ'],['analysis','ผลการวิเคราะห์']];
// [ปรับ 14/11/2569] ดีสุด/แย่สุด แยกรายตัวชี้วัด (ตัวละ 1 ช่อง ไม่ติ๊กไว้ก่อน) จัดอันดับราย DC และรายทะเบียนรถ
// v = ค่าจากผลคำนวณเดิม (computeKPISet / avgDelayMin) · hi = สูงดี (false = ต่ำดี) · mode = วิธีคิดผลต่างเทียบช่วงก่อน
var BW = [
  { k:'bw_ontimePct', t:'Ontime %',            hi:true,  mode:'pp',  v:function(o){ return o.k.ontimePct; }, f:function(x){ return fmtPct(x); }, x:function(x){ return Math.round(x * 1000) / 10; }, g:'on' },
  { k:'bw_delayPct',  t:'Delay %',             hi:false, mode:'pp',  v:function(o){ return o.k.delayPct; }, f:function(x){ return fmtPct(x); }, x:function(x){ return Math.round(x * 1000) / 10; }, g:'de' },
  { k:'bw_avgDelay',  t:'ล่าช้าเฉลี่ย (นาที)',   hi:false, mode:'abs', v:function(o){ return o.avgDelay === null ? 0 : o.avgDelay; }, f:function(x, o){ return o && o.avgDelay === null ? '0 (ไม่มีเที่ยวล่าช้า)' : fmtInt(x) + ' นาที'; }, x:function(x){ return Math.round(x * 10) / 10; } },
  { k:'bw_revenue',   t:'รายได้',               hi:true,  mode:'pct', v:function(o){ return o.k.revenue; }, f:function(x){ return fmtBaht(x); }, x:function(x){ return Math.round(x); } },
  { k:'bw_avgPieces', t:'ชิ้น/คัน',             hi:true,  mode:'pct', v:function(o){ return o.k.avgPieces; }, f:function(x){ return fmtInt(x); }, x:function(x){ return Math.round(x * 10) / 10; } },
];
var BWK = {}; BW.forEach(function(b){ BWK[b.k] = b; SECS.push([b.k, 'ดีสุด/แย่สุด: ' + b.t]); });
var BW_MIN_TRIPS = 5;   // ทะเบียนที่มีน้อยกว่านี้ไม่นำมาจัดอันดับ (อัตราแกว่งมาก)
var picked = new Set(['kpi','trend','dc','cust']);
// ผลต่างเทียบช่วงก่อน: ดี = เขียว แย่ = แดง (ไม่ใช้สีน้ำเงินสำหรับ "ดี")
var LIGHT = { ink:'#0b1f3f', muted:'#55657f', line:'#dbe3f0', panel:'#ffffff', s:['#1d57b8','#b8860b','#6e93d6','#b8334a','#2f8f8f'], bad:'#c0392b', good:'#18864b' };
// [ปรับ 14/11/2569] เกรด A–F (ยังซ่อนไว้ ผู้ดูแลเปิดเองที่หน้าต่างแชร์ → "แสดงเกรด A–F") ค่าบันทึกใน Sheet: settings.showGrade
var GRADE = {
  on: { t:'Ontime %', cut:[[95,'A'],[90,'B'],[85,'C'],[80,'D']], hi:true,  note:'A ≥95 · B ≥90 · C ≥85 · D ≥80 · F <80' },
  de: { t:'Delay %',  cut:[[5,'A'],[10,'B'],[15,'C'],[20,'D']],  hi:false, note:'A ≤5 · B ≤10 · C ≤15 · D ≤20 · F >20' },
};
var GRADE_C = { A:'#18864b', B:'#5aa469', C:'#d4a017', D:'#e07b39', F:'#c0392b' };
function gradeOf(kind, rate){ var G = GRADE[kind], v = rate * 100; for(var i = 0; i < G.cut.length; i++){ if(G.hi ? v >= G.cut[i][0] : v <= G.cut[i][0]) return G.cut[i][1]; } return 'F'; }
function showGrade(){ var D = window.__PICKUP_DATA; return !!(D && D.settings && D.settings.showGrade); }
var AB_C = '#b8860b', CC_C = '#1d57b8';
// [ปรับ 16/11/2569] แผนใหม่: ข้อความ AB/CC ในไฟล์ส่งออกเปลี่ยนเป็น กลุ่มทัน/กลุ่มตก
function PL(s){ return window.__pickupPlanLabel ? window.__pickupPlanLabel(s) : s; }
function isNewPlan(){ return !!(window.__pickupIsNewPlan && window.__pickupIsNewPlan()); }
function esc(s){ return PL(String(s === null || s === undefined ? '' : s)).replace(/[&<>"]/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]; }); }
function niceMax(v){ if(v <= 0) return 1; var e = Math.pow(10, Math.floor(Math.log10(v))), n = v / e; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * e; }
var ICN = {
  check:'<path d="M5 12.5l4.5 4.5L19 7.5"/>', clock:'<circle cx="12" cy="12" r="8"/><path d="M12 8v4.5l3 2"/>', hour:'<path d="M7 3h10M7 21h10M8 3c0 5 8 5 8 9s-8 4-8 9M16 3c0 5-8 5-8 9"/>',
  bill:'<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/>', box:'<path d="M3 7l9-4 9 4-9 4z"/><path d="M3 7v10l9 4 9-4V7M12 11v10"/>', money:'<circle cx="12" cy="12" r="9"/><path d="M15 8.5H10.5a2 2 0 000 4h3a2 2 0 010 4H9M12 6v12"/>',
  pin:'<path d="M12 22s7-6 7-12a7 7 0 00-14 0c0 6 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/>', star:'<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
  line:'<path d="M3 17l5-5 4 3 8-8"/><path d="M15 7h5v5"/>', alert:'<path d="M12 3l9.5 17h-19z"/><path d="M12 10v4M12 17.5v.01"/>', user:'<circle cx="12" cy="8" r="4"/><path d="M4 21c1-5 5-6 8-6s7 1 8 6"/>',
  analysis:'<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4M8 11h6M11 8v6"/>', dc:'<path d="M3 21V9l9-5 9 5v12"/><path d="M8 21v-7h8v7"/>'
};
function svgI(n, x, y, s, col, sw){ return '<g transform="translate(' + x + ' ' + y + ') scale(' + (s/24) + ')" fill="none" stroke="' + col + '" stroke-width="' + (sw || 2) + '" stroke-linecap="round" stroke-linejoin="round">' + ICN[n] + '</g>'; }
var SECI = { kpi:'star', trend:'line', delay:'clock', dc:'dc', cust:'user', analysis:'analysis' };
BW.forEach(function(b){ SECI[b.k] = 'star'; });

// ---------- ผลต่างเทียบช่วงก่อน (รูปแบบเดียวกับ kpiData) ----------
function deltaOf(c, p, mode, good){
  if(p === null || p === undefined || c === null || c === undefined) return null;
  var x = mode === 'pct' ? diffPct(c, p) : c - p; if(!isFinite(x)) return null;
  var flat = Math.abs(x) < (mode === 'abs' ? 0.5 : 0.0005), txt = mode === 'pp' ? Math.abs(x*100).toFixed(1) + ' จุด' : mode === 'abs' ? fmtInt(Math.abs(x)) : Math.abs(x*100).toFixed(1) + '%';
  return { x:x, flat:flat, up: flat ? null : ((x > 0) === good), txt: flat ? 'เท่าเดิม' : (x > 0 ? '▲ ' : '▼ ') + txt };
}

// ---------- ดีสุด/แย่สุด: จัดอันดับราย DC และรายทะเบียนรถ ตามตัวกรองบนหน้า ----------
var BW_DIMS = [
  { id:'dc', t:'DC', top:5, min:1, key:function(t){ return t.dcCode; }, name:function(k, ts){ var d = state.dcList.find(function(x){ return x.code === k; }); return d ? d.label : dcShortLabel(ts[0].dc); } },
  { id:'plate', t:'ทะเบียนรถ', top:5, min:BW_MIN_TRIPS, key:function(t){ return t.plate ? String(t.plate).trim() : ''; }, name:function(k){ return k; } },
];
function bwGroup(trips, D){
  var m = new Map();
  trips.forEach(function(t){ var k = D.key(t); if(!k) return; if(!m.has(k)) m.set(k, []); m.get(k).push(t); });
  var out = new Map();
  m.forEach(function(ts, k){ out.set(k, { key:k, name:D.name(k, ts), ts:ts, n:ts.length, k:computeKPISet(ts), avgDelay:avgDelayMin(ts), loc: D.id === 'plate' ? locationOf(ts) : (ts[0].zone || '-') }); });
  return out;
}
function bwData(key){
  var M = BWK[key], cur = applyFilters(), pi = prevTripsForPeriod();
  return BW_DIMS.map(function(D){
    var G = bwGroup(cur, D), P = pi ? bwGroup(pi.trips, D) : null, all = Array.from(G.values());
    var rows = all.filter(function(r){ return r.n >= D.min; });
    rows.forEach(function(r){ r.val = M.v(r); var p = P && P.get(r.key); r.prevVal = p ? M.v(p) : null; r.d = p ? deltaOf(r.val, r.prevVal, M.mode, M.hi) : null; });
    rows.sort(function(a, b){ return (M.hi ? b.val - a.val : a.val - b.val) || (b.n - a.n) || String(a.name).localeCompare(String(b.name), 'th'); });
    var n = rows.length >= 2 * D.top ? D.top : Math.floor(rows.length / 2);   // จำนวนน้อยกว่า: ใช้ครึ่งหนึ่ง ไม่ให้ซ้ำกัน
    rows.forEach(function(r, i){ r.rank = i + 1; r.tag = i < n ? 'ดีสุด' : i >= rows.length - n ? 'แย่สุด' : ''; });
    return { D:D, M:M, rows:rows, n:n, best:rows.slice(0, n), worst:rows.slice(rows.length - n).reverse(), skipped:all.length - rows.length, hasPrev:!!pi };
  });
}
function bwVal(M, r){ return M.f(r.val, r); }
function gradeTxt(M, r){ return M.g && showGrade() ? gradeOf(M.g, r.val) : ''; }

// ---------- data for exports ----------
function scopeText(){
  var G = { day:'รายวัน', week:'รายสัปดาห์', month:'รายเดือน' }[state.granularity] || '';
  var p = previousPeriod(state.dateFrom, state.dateTo, state.granularity), minK = dataMinKey(), has = p && minK && p.from >= minK;
  var f = isNewPlan() ? ['แผนใหม่'] : [];
  if(state.selectedDC){ var d = state.dcList.find(function(x){ return x.code === state.selectedDC; }); f.push('DC ' + (d ? d.label : state.selectedDC)); }
  else if(state.selectedZone) f.push('ภาค ' + state.selectedZone);
  else f.push(state.dcList.length + ' DC');
  if(state.productFilter) f.push(state.productFilter === 'แห้ง' ? 'สินค้า AB' : 'สินค้า CC');
  if(state.dcGroupFilter) f.push('BKK ไม่รวม 691');
  if(state.tripGroupFilter) f.push(state.tripGroupFilter === 'single' ? '1 เที่ยว/วัน' : 'มากกว่า 1 เที่ยว/วัน');
  return { range: shortRangeLabel(state.dateFrom, state.dateTo), gran: G, cmp: has ? shortRangeLabel(p.from, p.to) : '', has: has, scope: f.join(' · ') };
}
function kpiData(){
  var cur = computeKPISet(applyFilters()), pi = prevTripsForPeriod(), prev = pi ? computeKPISet(pi.trips) : null;
  var D = function(c, p, mode, good){ if(!prev) return null; var x = mode === 'pct' ? diffPct(c, p) : c - p; if(!isFinite(x)) return null;
    var flat = Math.abs(x) < (mode === 'abs' ? 0.5 : 0.0005), txt = mode === 'pp' ? Math.abs(x*100).toFixed(1) + ' จุด' : mode === 'abs' ? fmtInt(Math.abs(x)) : Math.abs(x*100).toFixed(1) + '%';
    return { x:x, flat:flat, up: flat ? null : ((x > 0) === good), txt: flat ? 'เท่าเดิม' : (x > 0 ? '▲ ' : '▼ ') + txt }; };
  var main = [
    { id:'ontime', l:'ตรงเวลา (Ontime)', ic:'check', v:fmtInt(cur.ontime), sub:fmtPct(cur.ontimePct) + ' ของเที่ยว', ab:cur.ontimeAB, cc:cur.ontimeCC, bar:'#6e93d6', d: prev && D(cur.ontimePct, prev.ontimePct, 'pp', true) },
    { id:'delay', l:'ล่าช้า (Delay)', ic:'clock', v:fmtInt(cur.delay), sub:fmtPct(cur.delayPct) + ' ของเที่ยว', ab:cur.delayAB, cc:cur.delayCC, bar:'#e0657c', d: prev && D(cur.delayPct, prev.delayPct, 'pp', false) },
    { id:'pending', l:'ยังไม่กลับเข้าคลัง', ic:'hour', v:fmtInt(cur.pending), sub:fmtPct(cur.pendingPct) + ' ของเที่ยว', ab:cur.pendingAB, cc:cur.pendingCC, bar:'#9aa7bb', d: prev && D(cur.pending, prev.pending, 'abs', false) },
  ];
  var stats = [
    { l:'บิลรวม', ic:'bill', v:fmtInt(cur.bills), d: prev && D(cur.bills, prev.bills, 'pct', true) },
    { l:'ชิ้นรวม', ic:'box', v:fmtInt(cur.pieces), d: prev && D(cur.pieces, prev.pieces, 'pct', true) },
    { l:'รายได้รวม', ic:'money', v:fmtBaht(cur.revenue), d: prev && D(cur.revenue, prev.revenue, 'pct', true) },
    { l:'จุดเข้ารับเฉลี่ย/เที่ยว', ic:'pin', v:fmtInt(cur.avgPoints), d: prev && D(cur.avgPoints, prev.avgPoints, 'pct', true) },
    { l:'บิลเฉลี่ย/คัน', ic:'bill', v:fmtInt(cur.avgBills), d: prev && D(cur.avgBills, prev.avgBills, 'pct', true) },
    { l:'ชิ้นเฉลี่ย/คัน', ic:'box', v:fmtInt(cur.avgPieces), d: prev && D(cur.avgPieces, prev.avgPieces, 'pct', true) },
  ];
  return { cur:cur, prev:prev, main:main, stats:stats, total:cur.total, totalD: prev && D(cur.total, prev.total, 'pct', true) };
}
function trendData(kind){
  var B = groupByBucket(chartWindowTrips(), effectiveGranularity());
  var ser = function(prod){ return B.map(function(b){ var g = b.trips.filter(function(t){ return t.dominantProduct === prod; });
    if(kind === 'delay'){ g = g.filter(function(t){ return t.status === 'delay' && t.delayMinutes !== null; }); return g.length ? g.reduce(function(s,t){ return s + t.delayMinutes; }, 0) / g.length : NaN; }
    return g.length ? g.filter(function(t){ return t.status === 'ontime'; }).length / g.length * 100 : NaN; }); };
  return { labels: B.map(function(b){ return b.label; }), ab: ser('แห้ง'), cc: ser('เย็น') };
}
function custRows(){
  var m = new Map();
  getProblemTrips().forEach(function(t){
    t.customers.forEach(function(c){
      if(state.excludedCustomers.has(c)) return;
      if(!m.has(c)) m.set(c, { name:c, trips:0, delay:0, pending:0, ts:[] });
      var o = m.get(c); o.trips++; if(t.status === 'delay') o.delay++; else o.pending++; o.ts.push(t);
    });
  });
  return Array.from(m.values()).map(function(o){ o.loc = locationOf(o.ts); o.revenue = o.ts.reduce(function(s,t){ return s + t.revenue; }, 0); return o; })
    .sort(function(a,b){ return b.trips - a.trips || b.revenue - a.revenue; });
}
function dcExportModel(){ return buildDcTableModel(applyFilters()); }
function dcCellText(r, c){
  if(c.d){ if(!r.prev) return '–'; var D = fmtDelta(c.d.cur(r), c.d.prev(r.prev), c.d); return { t:String(D.h).replace(/<[^>]+>/g,''), cls:D.cls }; }
  var v = c.v(r); return c.txt ? v : c.f(v);
}

// ---------- SVG building blocks (fixed light colours, same parts make PNG / slides / A4) ----------
function lineSvg(o){
  var W = o.W, H = o.H, m = { l:56, r:14, t:14, b:40 }, iw = W - m.l - m.r, ih = H - m.t - m.b, P = LIGHT;
  var all = []; o.series.forEach(function(s){ s.vals.forEach(function(v){ if(isFinite(v)) all.push(v); }); });
  var mx = o.max || niceMax(Math.max.apply(null, all.concat([1]))), mn = o.min || 0, n = o.labels.length;
  var y = function(v){ return m.t + ih * (1 - (v - mn) / ((mx - mn) || 1)); }, x = function(i){ return m.l + (n > 1 ? iw * i / (n - 1) : iw / 2); };
  var s = '';
  for(var k = 0; k <= 4; k++){ var v = mn + (mx - mn) * k / 4; s += '<line x1="' + m.l + '" x2="' + (W - m.r) + '" y1="' + y(v) + '" y2="' + y(v) + '" stroke="' + P.line + '"/><text x="' + (m.l - 8) + '" y="' + (y(v) + 4) + '" text-anchor="end" font-size="12" fill="' + P.muted + '">' + esc(o.fmt(v)) + '</text>'; }
  var step = Math.max(1, Math.ceil(n / (W < 700 ? 6 : 10)));
  o.labels.forEach(function(l, i){ if(i % step === 0 || i === n - 1) s += '<text x="' + x(i) + '" y="' + (H - 14) + '" text-anchor="middle" font-size="12" fill="' + P.muted + '">' + esc(l) + '</text>'; });
  o.series.forEach(function(se){
    var d = '', p = false;
    se.vals.forEach(function(v, i){ if(!isFinite(v)){ p = false; return; } d += (p ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(v).toFixed(1); p = true; });
    s += '<path d="' + d + '" fill="none" stroke="' + se.color + '" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"' + (se.dash ? ' stroke-dasharray="6 4"' : '') + '/>';
    se.vals.forEach(function(v, i){ if(isFinite(v)) s += '<circle cx="' + x(i) + '" cy="' + y(v) + '" r="3" fill="' + se.color + '"/>'; });
  });
  return { s:s, h:H };
}
function legendSvg(items, W, y){
  var s = '', tw = items.length * 130, x0 = (W - tw) / 2;
  items.forEach(function(it, i){ var x = x0 + i * 130; s += '<rect x="' + x + '" y="' + (y - 10) + '" width="14" height="14" rx="3" fill="' + it.c + '"/><text x="' + (x + 20) + '" y="' + (y + 2) + '" font-size="14" fill="#0b1f3f">' + esc(it.t) + '</text>'; });
  return s;
}
function miniTable(cols, data, W, h){
  var rh = h ? Math.max(24, Math.min(54, h / (data.length + 1))) : 30, fs = rh >= 38 ? 16 : rh >= 32 ? 15 : 13, base = Math.round(rh / 2 + fs * .36), tw = cols.reduce(function(s,c){ return s + c.w; }, 0), x = 0;
  var xs = cols.map(function(c){ var a = x; x += c.w / tw * W; return a; });
  var s = '<rect width="' + W + '" height="' + rh + '" rx="6" fill="#0a2a5e"/>';
  var tx = function(c, i){ var cw = c.w / tw * W; return c.r ? xs[i] + cw - 10 : c.c ? xs[i] + cw / 2 : xs[i] + 10; };
  var an = function(c){ return c.r ? 'end' : c.c ? 'middle' : 'start'; };
  cols.forEach(function(c, i){ s += '<text x="' + tx(c, i) + '" y="' + base + '" text-anchor="' + an(c) + '" font-size="' + fs + '" font-weight="600" fill="#fff">' + esc(c.t) + '</text>'; });
  data.forEach(function(r, j){
    var y = (j + 1) * rh;
    if(r.__sum) s += '<rect y="' + y + '" width="' + W + '" height="' + rh + '" fill="#e6edf8"/>';
    else if(j % 2) s += '<rect y="' + y + '" width="' + W + '" height="' + rh + '" fill="#f2f5fb"/>';
    cols.forEach(function(c, i){
      var X = tx(c, i);
      if(c.rank){ var R = Math.min(11, rh / 2 - 3); s += '<circle cx="' + X + '" cy="' + (y + rh / 2) + '" r="' + R + '" fill="' + (j < 3 ? '#b8334a' : '#6e93d6') + '"/><text x="' + X + '" y="' + (y + rh / 2 + 4.5) + '" text-anchor="middle" font-size="13" font-weight="600" fill="#fff">' + (j + 1) + '</text>'; return; }
      var val = c.f(r), col = '#0b1f3f';
      if(val && typeof val === 'object'){ col = val.cls === 'good' ? LIGHT.good : val.cls === 'badt' ? LIGHT.bad : col; val = val.t; }
      if(c.col) col = c.col(r) || col;
      s += '<text x="' + X + '" y="' + (y + base) + '" text-anchor="' + an(c) + '" font-size="' + fs + '" font-weight="' + (i === 0 || r.__sum || c.b ? 600 : 400) + '" fill="' + col + '">' + esc(val) + '</text>';
    });
  });
  return { s:s, h:(data.length + 1) * rh };
}
function gradeBadge(kind, rate, cx, cy, r){
  if(!kind || !showGrade()) return '';
  var g = gradeOf(kind, rate);
  return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="' + GRADE_C[g] + '" stroke="#fff" stroke-width="2"/><text x="' + cx + '" y="' + (cy + r * .38) + '" text-anchor="middle" font-size="' + Math.round(r * 1.1) + '" font-weight="700" fill="#fff">' + g + '</text>';
}
function kpiPiece(w, h){
  var K = kpiData(), gap = 14, natCh = 182, sh = 70, rows = w > 900 ? 1 : 2, cols = 6 / rows;
  if(h && h > 520){ sh = 96; } var statH = rows * sh + (rows - 1) * gap, ch = h ? Math.min(Math.max(natCh, h - statH - gap), 300) : natCh, cw = (w - 2 * gap) / 3, s = '', vf = ch > 230 ? 50 : 38, oy = h ? Math.max(0, (h - ch - gap - statH) / 2) : 0;
  K.main.forEach(function(t, i){
    var x = i * (cw + gap), dc = t.d ? (t.d.up === null ? '#cfdcf2' : t.d.up ? '#9fe3c4' : '#ffb3bf') : '#cfdcf2';
    s += '<g transform="translate(' + x + ' ' + oy + ')"><rect width="' + cw + '" height="' + ch + '" rx="14" fill="#0a2a5e"/><rect y="' + (ch - 5) + '" width="' + cw + '" height="5" fill="' + t.bar + '"/>' +
      '<circle cx="26" cy="26" r="16" fill="#d4af37"/>' + svgI(t.ic, 15, 15, 22, '#0a2a5e', 2.4) +
      '<text x="' + cw / 2 + '" y="' + (ch * .19 + 4) + '" text-anchor="middle" font-size="16" fill="#e6d79c">' + esc(t.l) + '</text>' +
      '<text x="' + cw / 2 + '" y="' + (ch * .43 + 10) + '" text-anchor="middle" font-size="' + vf + '" font-weight="600" fill="#fff">' + esc(t.v) + '</text>' +
      '<text x="' + cw / 2 + '" y="' + (ch * .57 + 8) + '" text-anchor="middle" font-size="14" fill="#cfdcf2">' + esc(t.sub) + '</text>' +
      (t.d ? '<text x="' + cw / 2 + '" y="' + (ch * .57 + 30) + '" text-anchor="middle" font-size="15" font-weight="600" fill="' + dc + '">' + esc(t.d.txt) + ' เทียบช่วงก่อน</text>' : !K.prev ? '<text x="' + cw / 2 + '" y="' + (ch * .57 + 30) + '" text-anchor="middle" font-size="14" fill="#cfdcf2">ไม่มีช่วงก่อนหน้า</text>' : '') +
      gradeBadge(t.id === 'ontime' ? 'on' : t.id === 'delay' ? 'de' : null, t.id === 'ontime' ? K.cur.ontimePct : K.cur.delayPct, cw - 26, 26, 17) +
      '<line x1="' + (cw * .2) + '" x2="' + (cw * .8) + '" y1="' + (ch - 40) + '" y2="' + (ch - 40) + '" stroke="rgba(255,255,255,.18)" stroke-dasharray="4 4"/>' +
      '<text x="' + (cw / 2 - 12) + '" y="' + (ch - 16) + '" text-anchor="end" font-size="15" font-weight="600" fill="#f0d57a">AB ' + fmtInt(t.ab) + '</text>' +
      '<text x="' + (cw / 2 + 12) + '" y="' + (ch - 16) + '" font-size="15" font-weight="600" fill="#a9c6f5">CC ' + fmtInt(t.cc) + '</text></g>';
  });
  var sw = (w - (cols - 1) * gap) / cols;
  K.stats.forEach(function(t, i){
    var x = (i % cols) * (sw + gap), y = oy + ch + gap + Math.floor(i / cols) * (sh + gap), dc = t.d ? (t.d.up === null ? '#55657f' : t.d.up ? LIGHT.good : LIGHT.bad) : '#55657f';
    s += '<g transform="translate(' + x + ' ' + y + ')"><rect width="' + sw + '" height="' + sh + '" rx="12" fill="#f2f5fb" stroke="#dbe3f0"/><circle cx="30" cy="' + sh / 2 + '" r="18" fill="#0a2a5e"/>' + svgI(t.ic, 19, sh / 2 - 11, 22, '#d4af37') +
      '<text x="58" y="24" font-size="13" fill="#55657f">' + esc(t.l) + '</text><text x="58" y="47" font-size="19" font-weight="600" fill="#0b1f3f">' + esc(t.v) + '</text>' +
      (t.d ? '<text x="58" y="64" font-size="12" font-weight="600" fill="' + dc + '">' + esc(t.d.txt) + '</text>' : !K.prev ? '<text x="58" y="64" font-size="12" fill="#55657f">ไม่มีช่วงก่อนหน้า</text>' : '') + '</g>';
  });
  return { t:'ผลสำคัญ · ' + fmtInt(K.total) + ' เที่ยว' + (K.totalD ? ' (' + K.totalD.txt + ')' : ''), s:s, h: h ? Math.max(h, ch + gap + statH) : ch + gap + statH };
}
function infoPiece(k, w, o){
  o = o || {}; var h = o.h, n = o.n || 10;
  if(BWK[k]) return bwPiece(k, w, h);
  if(k === 'kpi') return kpiPiece(w, h);
  if(k === 'trend' || k === 'delay'){
    var T = trendData(k), H = h ? Math.round(h) : Math.round(Math.max(220, w * .26)), lc = lineSvg({ labels:T.labels, series:[{ color:AB_C, vals:T.ab }, { color:CC_C, vals:T.cc }], fmt: k === 'trend' ? function(v){ return Math.round(v) + '%'; } : function(v){ return Math.round(v) + ' น.'; }, W:w, H:H - 26, max: k === 'trend' ? 100 : null });
    return { t: k === 'trend' ? 'แนวโน้ม Ontime % (ทอง = AB, น้ำเงิน = CC)' : 'เวลาล่าช้าเฉลี่ย นาที (ทอง = AB, น้ำเงิน = CC)', s: lc.s + legendSvg([{ c:AB_C, t:'AB (แห้ง)' }, { c:CC_C, t:'CC (เย็น)' }], w, H - 6), h:H };
  }
  if(k === 'dc'){
    var M = dcExportModel(), cs = M.cols.filter(function(c){ return c.k !== 'zone'; }).slice(0, w > 900 ? 10 : 6);
    var cols = [{ t:'DC', w:2.2, f:function(r){ return r.label; } }].concat(cs.map(function(c){ return { t:c.t, w: c.d ? 1.5 : 1.25, r:1, b: !!c.strong, f:function(r){ return dcCellText(r, c); } }; }));
    var data = M.rows.concat([Object.assign({ __sum:true }, M.sum)]);
    var tb = miniTable(cols, data, w, h);
    return { t:'สรุปราย DC' + (M.prevInfo ? ' · Δ เทียบ ' + shortRangeLabel(M.prevInfo.p.from, M.prevInfo.p.to) : ''), s:tb.s, h:tb.h };
  }
  if(k === 'cust'){
    var R = custRows().slice(0, n);
    var tc = miniTable([{ t:'#', w:.7, c:1, rank:1, f:function(){ return ''; } }, { t:'ลูกค้า', w:5, f:function(r){ return r.name.length > 34 ? r.name.slice(0, 33) + '…' : r.name; } }, { t:'ภาค / DC', w:2.8, f:function(r){ return r.loc; } }, { t:'เที่ยว', w:1, r:1, f:function(r){ return fmtInt(r.trips); } }, { t:'Delay', w:1, r:1, col:function(){ return LIGHT.bad; }, f:function(r){ return fmtInt(r.delay); } }], R, w, h);
    return { t:'ลูกค้าที่ได้รับผลกระทบสูงสุด ' + R.length + ' ราย', s:tc.s, h:tc.h };
  }
  if(k === 'analysis'){
    var A = analysisRows(), RR = A.rows.slice(0, n), loc = anState.dim !== 'dc';
    var ta = miniTable([{ t:'#', w:.7, c:1, rank:1, f:function(){ return ''; } }, { t:A.D.t, w:3.2, f:function(r){ return String(r.name).length > 26 ? String(r.name).slice(0, 25) + '…' : r.name; } }].concat(loc ? [{ t:'ภาค / DC', w:3, f:function(r){ return r.loc; } }] : []).concat([{ t:'เที่ยว', w:1, r:1, f:function(r){ return fmtInt(r.ts.length); } }, { t:A.M.t.replace(/ \(.*\)/,''), w:1.6, r:1, b:1, col:function(){ return LIGHT.bad; }, f:function(r){ return A.M.f(r.val); } }]), RR, w, h);
    return { t:'ผลการวิเคราะห์: ' + A.D.t + ' แย่สุด ' + RR.length + ' อันดับ (' + A.M.t.replace(/ \(.*\)/,'') + ')', s:ta.s, h:ta.h };
  }
}
function bwPiece(k, w, h){
  var R = bwData(k), M = BWK[k], gap = 24, hw = (w - gap) / 2, tH = 30, s = '', mh = 0, gr = !!(M.g && showGrade());
  var parts = R.map(function(G, i){
    var data = G.best.concat(G.worst), x = i * (hw + gap);
    var cols = [{ t:'', w:1.3, b:1, col:function(r){ return r.tag === 'ดีสุด' ? LIGHT.good : LIGHT.bad; }, f:function(r){ return r.tag + ' ' + (r.tag === 'ดีสุด' ? r.rank : G.rows.length - r.rank + 1); } },
      { t:G.D.t, w:2.6, f:function(r){ var t = String(r.name); return t.length > 22 ? t.slice(0, 21) + '…' : t; } },
      { t:'เที่ยว', w:.9, r:1, f:function(r){ return fmtInt(r.n); } },
      { t:M.t, w:1.9, r:1, b:1, f:function(r){ return bwVal(M, r).replace(' (ไม่มีเที่ยวล่าช้า)', ''); } }]
      .concat(gr ? [{ t:'เกรด', w:.8, c:1, b:1, col:function(r){ return GRADE_C[gradeTxt(M, r)]; }, f:function(r){ return gradeTxt(M, r); } }] : [])
      .concat([{ t:'Δ ช่วงก่อน', w:1.5, r:1, col:function(r){ return !r.d || r.d.up === null ? LIGHT.muted : r.d.up ? LIGHT.good : LIGHT.bad; }, f:function(r){ return r.d ? r.d.txt : G.hasPrev ? '–' : 'ไม่มีช่วงก่อนหน้า'; } }]);
    var head = '<text x="' + (x + hw / 2) + '" y="20" text-anchor="middle" font-size="16" font-weight="600" fill="#0a2a5e">ราย' + G.D.t + ' · ดีสุด ' + G.n + ' / แย่สุด ' + G.n + (G.D.id === 'plate' ? ' (≥' + BW_MIN_TRIPS + ' เที่ยว)' : '') + '</text>';
    if(!G.n) return { s:head + '<text x="' + (x + hw / 2) + '" y="' + (tH + 40) + '" text-anchor="middle" font-size="15" fill="#55657f">ข้อมูลไม่พอจัดอันดับ (มี ' + G.rows.length + ' รายการ)</text>', h:tH + 60 };
    var tb = miniTable(cols, data, hw, h ? h - tH : null);
    return { s:head + '<g transform="translate(' + x + ' ' + tH + ')">' + tb.s + '</g>', h:tb.h + tH };
  });
  parts.forEach(function(p){ s += p.s; mh = Math.max(mh, p.h); });
  return { t:'ดีสุด/แย่สุด: ' + M.t + (M.hi ? ' (สูง = ดี)' : ' (ต่ำ = ดี)'), s:s, h: h ? Math.max(h, mh) : mh };
}
var CARD = { top:56, pad:20 };
function card(p, k, x, y, w, h){
  return '<g transform="translate(' + x + ' ' + y + ')"><rect width="' + w + '" height="' + h + '" rx="16" fill="#fff" stroke="#dbe3f0"/><rect x="' + (w * .15) + '" y="-1.2" width="' + (w * .7) + '" height="2.4" fill="#d4af37"/>' +
    '<circle cx="' + w / 2 + '" cy="0" r="19" fill="#0a2a5e" stroke="#d4af37" stroke-width="2"/>' + svgI(SECI[k], w / 2 - 11, -11, 22, '#f0d57a') +
    '<text x="' + w / 2 + '" y="' + (CARD.top - 14) + '" text-anchor="middle" font-size="18" font-weight="600" fill="#0a2a5e">' + esc(p.t) + '</text><g transform="translate(' + CARD.pad + ' ' + CARD.top + ')">' + p.s + '</g></g>';
}
function logoSrc(){ if(window.__LOGO_DATA) return window.__LOGO_DATA; var i = document.querySelector('.rail .lg img'); return i ? i.getAttribute('src') : ''; }
function sheetHead(W, H0, id){
  var big = H0 > 120, pw = big ? 248 : 150, rw = big ? 360 : 300, ph = H0 - 46, ly = (H0 - 5 - ph) / 2, m = 24, S = scopeText();
  var L = big ? [S.gran + ' · ' + S.range, S.has ? 'เทียบ ' + S.cmp : '', S.scope].filter(Boolean) : [S.gran + ' · ' + S.range, (S.has ? 'เทียบ ' + S.cmp + ' · ' : '') + S.scope];
  var tx = (m + pw + (W - m - rw)) / 2, tfs = Math.round(Math.min(big ? 40 : 32, (W - 2 * m - pw - rw - 40) / 16.5));
  var dots = [.3,.42,.58,.7].map(function(f, i){ return '<circle cx="' + W * f + '" cy="' + (H0 - 20 - (i % 2) * 14) + '" r="4" fill="#d4af37"/>'; }).join('');
  return '<defs><linearGradient id="' + id + '" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#071f4a"/><stop offset=".5" stop-color="#143f8c"/><stop offset="1" stop-color="#071f4a"/></linearGradient></defs><rect width="' + W + '" height="' + H0 + '" fill="url(#' + id + ')"/>' +
    '<path d="M' + W * .24 + ' ' + (H0 - 20) + 'C' + W * .3 + ' ' + (H0 - 46) + ' ' + W * .36 + ' ' + (H0 - 6) + ' ' + W * .42 + ' ' + (H0 - 34) + 'S' + W * .54 + ' ' + (H0 - 8) + ' ' + W * .58 + ' ' + (H0 - 20) + 'S' + W * .68 + ' ' + (H0 - 44) + ' ' + W * .76 + ' ' + (H0 - 20) + '" fill="none" stroke="#6e93d6" stroke-width="2" stroke-dasharray="6 7" opacity=".55"/>' + (big ? dots : '') +
    '<rect y="' + (H0 - 5) + '" width="' + W + '" height="5" fill="#d4af37"/><rect x="' + m + '" y="' + ly + '" width="' + pw + '" height="' + ph + '" rx="14" fill="#fff"/><image x="' + (m + 10) + '" y="' + (ly + 8) + '" width="' + (pw - 20) + '" height="' + (ph - 16) + '" href="' + logoSrc() + '" preserveAspectRatio="xMidYMid meet"/>' +
    '<text x="' + tx + '" y="' + (big ? 72 : 46) + '" text-anchor="middle" font-size="' + tfs + '" font-weight="600" fill="#fff">NIMEX Pickup Vehicle Dashboard</text><text x="' + tx + '" y="' + (big ? 106 : 74) + '" text-anchor="middle" font-size="' + (big ? 22 : 17) + '" fill="#e6d79c">สรุปผลรถเข้ารับสินค้า</text>' +
    '<rect x="' + (W - m - rw) + '" y="' + ly + '" width="' + rw + '" height="' + ph + '" rx="14" fill="rgba(255,255,255,.1)" stroke="#d4af37"/>' +
    L.map(function(t, i){ return '<text x="' + (W - m - rw / 2) + '" y="' + (ly + ph / 2 + (i - (L.length - 1) / 2) * (big ? 30 : 22) + (big ? 7 : 5)) + '" text-anchor="middle" font-size="' + (i ? (big ? 15 : 12) : (big ? 18 : 14)) + '" font-weight="' + (i ? 400 : 600) + '" fill="#fff">' + esc(t) + '</text>'; }).join('');
}
function sheetFoot(W, H, h){ return '<rect y="' + (H - h) + '" width="' + W + '" height="' + h + '" fill="#0a2a5e"/><rect y="' + (H - h) + '" width="' + W + '" height="3" fill="#d4af37"/><text x="' + W / 2 + '" y="' + (H - h / 2 + 6) + '" text-anchor="middle" font-size="14" fill="#dfe8f7">วันทำการ จันทร์–เสาร์ · เทียบช่วงก่อนด้วยจำนวนวันทำการเท่ากัน · ข้อมูลจากรายงาน NIMEX016267</text>'; }
function fontCss(){ var e = document.getElementById('fontcss'); return e ? e.textContent : ''; }
function wrapSvg(W, H, inner){ return { svg:'<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '"><style>' + fontCss() + 'text{font-family:Prompt,sans-serif}</style><rect width="' + W + '" height="' + H + '" fill="#eef2f9"/>' + inner + '</svg>', W:W, H:H }; }
// ===================== [ปรับ 14/11/2569] อินโฟกราฟิก 16:9 (1920×1080 → PNG 3840×2160) =====================
// การ์ด KPI และตัวเลขราย DC มาจาก computeKPISet / avgDelayMin เดิม · การ์ดใช้ตัวกรองทั้งหมดบนหน้า (รวมภาค/DC)
// กราฟราย DC แสดงครบทุก DC เพื่อเทียบ (ใช้ช่วงเวลาและตัวกรองอื่นเหมือนเดิม แต่ไม่กรองภาค/DC)
function tripsAllDc(){
  var z = state.selectedZone, d = state.selectedDC, out;
  state.selectedZone = ''; state.selectedDC = '';
  try{ out = tripsInRange(state.dateFrom, state.dateTo); } finally { state.selectedZone = z; state.selectedDC = d; }
  return out;
}
function dcStats(){
  var m = dcRowsFor(tripsAllDc());
  return Array.from(m.keys()).sort().map(function(code){
    var ts = m.get(code), info = state.dcList.find(function(x){ return x.code === code; }), k = computeKPISet(ts);
    return { code:code, label: info ? info.label : dcShortLabel(ts[0].dc), n:ts.length, k:k,
      abRate: k.totalAB ? k.ontimeAB / k.totalAB : NaN, ccRate: k.totalCC ? k.ontimeCC / k.totalCC : NaN, sel: code === state.selectedDC };
  });
}
// แกนไม่เริ่มที่ 0 เมื่อค่าอยู่ช่วงแคบ (เช่น 70–95%) ปัดลงเป็นช่วง 20 เพื่อให้เส้นแกนลงตัว
function axisMin(vals){ var f = vals.filter(isFinite); if(!f.length) return 0; var mn = Math.min.apply(null, f); return mn >= 30 ? Math.max(0, Math.floor((mn - 3) / 20) * 20) : 0; }
function panel(x, y, w, h, title, inner, note){
  return '<g transform="translate(' + x + ' ' + y + ')"><rect width="' + w + '" height="' + h + '" rx="16" fill="#fff" stroke="#dbe3f0"/><rect x="20" y="0" width="64" height="4" rx="2" fill="#d4af37"/>' +
    '<text x="22" y="38" font-size="20" font-weight="600" fill="#0a2a5e">' + esc(title) + '</text>' +
    (note ? '<text x="' + (w - 20) + '" y="37" text-anchor="end" font-size="13" fill="#55657f">' + esc(note) + '</text>' : '') + inner + '</g>';
}
function barsV(o){   // แท่งคู่แนวตั้ง: o.groups=[{label, sub, vals:[..], sel}], o.series=[{c,t}]
  var W = o.W, H = o.H, m = { l:52, r:12, t:12, b:52 }, iw = W - m.l - m.r, ih = H - m.t - m.b, mn = o.min || 0, mx = o.max, s = '';
  var y = function(v){ return m.t + ih * (1 - (v - mn) / ((mx - mn) || 1)); };
  for(var k = 0; k <= 4; k++){ var v = mn + (mx - mn) * k / 4; s += '<line x1="' + m.l + '" x2="' + (W - m.r) + '" y1="' + y(v) + '" y2="' + y(v) + '" stroke="#dbe3f0"/><text x="' + (m.l - 8) + '" y="' + (y(v) + 4) + '" text-anchor="end" font-size="13" fill="#55657f">' + esc(o.fmt(v)) + '</text>'; }
  var gw = iw / Math.max(1, o.groups.length), ns = o.series.length, bw = Math.min(70, gw * .7 / ns);
  o.groups.forEach(function(g, i){
    var cx = m.l + gw * i + gw / 2, x0 = cx - bw * ns / 2;
    if(g.sel) s += '<rect x="' + (cx - gw / 2 + 4) + '" y="' + m.t + '" width="' + (gw - 8) + '" height="' + ih + '" rx="8" fill="#fbf3d9"/>';
    g.vals.forEach(function(v, j){
      var bx = x0 + j * bw + 3;
      if(!isFinite(v)){ s += '<text x="' + (bx + (bw - 6) / 2) + '" y="' + (y(mn) - 6) + '" text-anchor="middle" font-size="13" fill="#55657f">-</text>'; return; }
      var top = y(Math.max(mn, v));
      s += '<rect x="' + bx + '" y="' + top + '" width="' + (bw - 6) + '" height="' + Math.max(0, y(mn) - top) + '" rx="4" fill="' + o.series[j].c + '"/>' +
        '<text x="' + (bx + (bw - 6) / 2) + '" y="' + (top - 6) + '" text-anchor="middle" font-size="14" font-weight="600" fill="#0b1f3f">' + esc(o.fmt(v, 1)) + '</text>';
    });
    s += '<text x="' + cx + '" y="' + (H - m.b + 22) + '" text-anchor="middle" font-size="15" font-weight="' + (g.sel ? 700 : 600) + '" fill="#0b1f3f">' + esc(g.label) + '</text>' +
      '<text x="' + cx + '" y="' + (H - m.b + 41) + '" text-anchor="middle" font-size="12" fill="#55657f">' + esc(g.sub) + '</text>';
  });
  return s;
}
function barsPair(o){   // แท่งคู่แนวนอน 2 ตัวชี้วัด แต่ละตัวใช้สเกลของตัวเอง
  var W = o.W, H = o.H, lw = 190, vw = 70, iw = W - lw - vw, n = o.rows.length, rh = H / Math.max(1, n), bh = Math.min(26, rh * .32), s = '';
  var mx = o.series.map(function(se){ return Math.max.apply(null, o.rows.map(function(r){ return se.v(r) || 0; }).concat([1e-9])); });
  o.rows.forEach(function(r, i){
    var y0 = i * rh + (rh - 2 * bh - 6) / 2;
    if(r.sel) s += '<rect x="0" y="' + (i * rh + 2) + '" width="' + W + '" height="' + (rh - 4) + '" rx="8" fill="#fbf3d9"/>';
    s += '<text x="8" y="' + (i * rh + rh / 2 - 2) + '" font-size="15" font-weight="600" fill="#0b1f3f">' + esc(r.label) + '</text><text x="8" y="' + (i * rh + rh / 2 + 17) + '" font-size="12" fill="#55657f">' + esc(fmtInt(r.n) + ' เที่ยว') + '</text>';
    o.series.forEach(function(se, j){
      var v = se.v(r) || 0, bw = Math.max(2, iw * v / mx[j]), yy = y0 + j * (bh + 6);
      s += '<rect x="' + lw + '" y="' + yy + '" width="' + bw + '" height="' + bh + '" rx="4" fill="' + se.c + '"/><text x="' + (lw + bw + 8) + '" y="' + (yy + bh / 2 + 5) + '" font-size="14" font-weight="600" fill="#0b1f3f">' + esc(se.f(v)) + '</text>';
    });
  });
  return s;
}
function donutSvg(cx, cy, R, r, items){
  var tot = items.reduce(function(a, b){ return a + b.v; }, 0), a0 = -Math.PI / 2, s = '';
  if(!tot) return '<circle cx="' + cx + '" cy="' + cy + '" r="' + (R + r) / 2 + '" fill="none" stroke="#dbe3f0" stroke-width="' + (R - r) + '"/>';
  items.forEach(function(it){
    if(!it.v) return;
    var a1 = a0 + it.v / tot * Math.PI * 2;
    if(it.v === tot){ s += '<circle cx="' + cx + '" cy="' + cy + '" r="' + (R + r) / 2 + '" fill="none" stroke="' + it.c + '" stroke-width="' + (R - r) + '"/>'; a0 = a1; return; }
    var lg = a1 - a0 > Math.PI ? 1 : 0, P = function(rad, a){ return (cx + rad * Math.cos(a)).toFixed(2) + ' ' + (cy + rad * Math.sin(a)).toFixed(2); };
    s += '<path d="M' + P(R, a0) + 'A' + R + ' ' + R + ' 0 ' + lg + ' 1 ' + P(R, a1) + 'L' + P(r, a1) + 'A' + r + ' ' + r + ' 0 ' + lg + ' 0 ' + P(r, a0) + 'Z" fill="' + it.c + '" stroke="#fff" stroke-width="2"/>';
    a0 = a1;
  });
  return s;
}
function info169Data(){
  var K = kpiData(), cur = K.cur, pi = prevTripsForPeriod(), ad = avgDelayMin(applyFilters()), adp = pi ? avgDelayMin(pi.trips) : null;
  var cards = [
    { l:'เที่ยวรวม', ic:'line', v:fmtInt(cur.total), sub:'AB ' + fmtInt(cur.totalAB) + ' · CC ' + fmtInt(cur.totalCC), d:K.totalD },
    { l:'Ontime %', ic:'check', v:fmtPct(cur.ontimePct), sub:fmtInt(cur.ontime) + ' เที่ยวตรงเวลา', d:K.main[0].d, g:'on', rate:cur.ontimePct },
    { l:'Delay %', ic:'clock', v:fmtPct(cur.delayPct), sub:fmtInt(cur.delay) + ' เที่ยวล่าช้า', d:K.main[1].d, g:'de', rate:cur.delayPct },
    { l:'ยังไม่กลับเข้าคลัง', ic:'hour', v:fmtInt(cur.pending), sub:fmtPct(cur.pendingPct) + ' ของเที่ยว', d:K.main[2].d },
    { l:'ล่าช้าเฉลี่ย', ic:'alert', v: ad === null ? '-' : fmtInt(ad) + ' นาที', sub:'เฉพาะเที่ยวที่ล่าช้า', d: K.prev && ad !== null && adp !== null ? deltaOf(ad, adp, 'abs', false) : null },
    { l:'บิลรวม', ic:'bill', v:fmtInt(cur.bills), sub:'เฉลี่ย ' + fmtInt(cur.avgBills) + ' บิล/คัน', d:K.stats[0].d },
    { l:'ชิ้นรวม', ic:'box', v:fmtInt(cur.pieces), sub:'เฉลี่ย ' + fmtInt(cur.avgPieces) + ' ชิ้น/คัน', d:K.stats[1].d },
    { l:'รายได้รวม', ic:'money', v:fmtBaht(cur.revenue), sub:'AB ' + fmtBaht(cur.dryRevenue) + ' · CC ' + fmtBaht(cur.coldRevenue), d:K.stats[2].d },
  ];
  var plates = bwData('bw_ontimePct')[1];
  return { K:K, cards:cards, dcs:dcStats(), trend:trendData('trend'), plates:plates, grade:showGrade() };
}
function info169(){
  var W = 1920, H = 1080, m = 30, head = 120, foot = 54, X = info169Data(), b = '', g = 16;
  // แถวการ์ด KPI 8 ใบ
  var ky = head + 20, kh = 196, cw = (W - 2 * m - 7 * g) / 8;
  X.cards.forEach(function(c, i){
    var x = m + i * (cw + g), dcol = c.d ? (c.d.up === null ? '#55657f' : c.d.up ? LIGHT.good : LIGHT.bad) : '#55657f', vf = c.v.length > 10 ? 27 : c.v.length > 7 ? 32 : 38;
    b += '<g transform="translate(' + x + ' ' + ky + ')"><rect width="' + cw + '" height="' + kh + '" rx="16" fill="#fff" stroke="#dbe3f0"/><rect y="' + (kh - 6) + '" width="' + cw + '" height="6" fill="' + (i < 5 ? '#0a2a5e' : '#d4af37') + '"/>' +
      '<circle cx="30" cy="32" r="17" fill="#0a2a5e"/>' + svgI(c.ic, 19, 21, 22, '#f0d57a') +
      '<text x="56" y="38" font-size="16" font-weight="600" fill="#55657f">' + esc(c.l) + '</text>' +
      '<text x="' + cw / 2 + '" y="98" text-anchor="middle" font-size="' + vf + '" font-weight="700" fill="#0b1f3f">' + esc(c.v) + '</text>' +
      '<text x="' + cw / 2 + '" y="128" text-anchor="middle" font-size="' + (c.sub.length > 26 ? 11.5 : 13) + '" fill="#55657f">' + esc(c.sub) + '</text>' +
      '<text x="' + cw / 2 + '" y="162" text-anchor="middle" font-size="' + (c.d ? 15 : 13) + '" font-weight="' + (c.d ? 600 : 400) + '" fill="' + dcol + '">' + esc(c.d ? c.d.txt + ' เทียบช่วงก่อน' : X.K.prev ? '–' : 'ไม่มีช่วงก่อนหน้า') + '</text>' +
      (c.g ? gradeBadge(c.g, c.rate, cw - 26, 30, 17) : '') + '</g>';
  });
  // กราฟ 2×2
  var top = ky + kh + 20, ch = (H - foot - 18 - top - g) / 2, pw = (W - 2 * m - g) / 2, IN = 56, PH = ch - IN - 12, PW = pw - 40;
  // (1) แนวโน้ม Ontime % AB / CC
  var T = X.trend, mn1 = axisMin(T.ab.concat(T.cc)), lc = lineSvg({ labels:T.labels, series:[{ color:AB_C, vals:T.ab }, { color:CC_C, vals:T.cc }], fmt:function(v){ return Math.round(v) + '%'; }, W:PW, H:PH - 22, max:100, min:mn1 });
  b += panel(m, top, pw, ch, 'แนวโน้ม Ontime % (ทอง = AB, น้ำเงิน = CC)', '<g transform="translate(20 ' + IN + ')">' + lc.s + legendSvg([{ c:AB_C, t:'AB (แห้ง)' }, { c:CC_C, t:'CC (เย็น)' }], PW, PH - 4) + '</g>', mn1 ? 'แกนเริ่มที่ ' + mn1 + '%' : '');
  // (2) Ontime % AB vs CC ราย DC
  var D = X.dcs, rates = []; D.forEach(function(r){ rates.push(r.abRate * 100, r.ccRate * 100); });
  var mn2 = axisMin(rates);
  var b2 = barsV({ W:PW, H:PH - 22, min:mn2, max:100, fmt:function(v, lab){ return lab ? v.toFixed(1) + '%' : Math.round(v) + '%'; }, series:[{ c:AB_C }, { c:CC_C }],
    groups: D.map(function(r){ return { label:r.label, sub:fmtInt(r.n) + ' เที่ยว (AB ' + fmtInt(r.k.totalAB) + ' · CC ' + fmtInt(r.k.totalCC) + ')', vals:[r.abRate * 100, r.ccRate * 100], sel:r.sel }; }) });
  b += panel(m + pw + g, top, pw, ch, 'Ontime % ราย DC: AB เทียบ CC', '<g transform="translate(20 ' + IN + ')">' + b2 + legendSvg([{ c:AB_C, t:'AB (แห้ง)' }, { c:CC_C, t:'CC (เย็น)' }], PW, PH - 4) + '</g>', (mn2 ? 'แกนเริ่มที่ ' + mn2 + '% · ' : '') + 'แสดงครบทุก DC');
  // (3) บิล/คัน กับ ชิ้น/คัน ราย DC
  var b3 = barsPair({ W:PW, H:PH - 22, rows:D, series:[{ c:'#d4af37', v:function(r){ return r.k.avgBills; }, f:function(v){ return fmtInt(v) + ' บิล/คัน'; } }, { c:'#1d57b8', v:function(r){ return r.k.avgPieces; }, f:function(v){ return fmtInt(v) + ' ชิ้น/คัน'; } }] });
  b += panel(m, top + ch + g, pw, ch, 'บิล/คัน และ ชิ้น/คัน ราย DC', '<g transform="translate(20 ' + IN + ')">' + b3 + legendSvg([{ c:'#d4af37', t:'บิล/คัน' }, { c:'#1d57b8', t:'ชิ้น/คัน' }], PW, PH - 4) + '</g>', 'แต่ละสีใช้สเกลของตัวเอง');
  // (4) โดนัท (เกรด Ontime % รายทะเบียน หรือ สถานะเที่ยว ถ้ายังไม่เปิดเกรด) + ทะเบียนแย่สุด 3 อันดับ
  var P = X.plates, items, ttl;
  if(X.grade){
    var cnt = { A:0, B:0, C:0, D:0, F:0 }; P.rows.forEach(function(r){ cnt[gradeOf('on', r.val)]++; });
    items = ['A','B','C','D','F'].map(function(k){ return { t:'เกรด ' + k, v:cnt[k], c:GRADE_C[k] }; }); ttl = 'สัดส่วนเกรด Ontime % รายทะเบียน (' + fmtInt(P.rows.length) + ' คัน)';
  } else {
    var k0 = X.K.cur; items = [{ t:'Ontime', v:k0.ontime, c:'#18864b' }, { t:'Delay', v:k0.delay, c:'#c0392b' }, { t:'ยังไม่กลับ', v:k0.pending, c:'#9aa7bb' }]; ttl = 'สัดส่วนสถานะเที่ยว (' + fmtInt(k0.total) + ' เที่ยว)';
  }
  var tot = items.reduce(function(a, c){ return a + c.v; }, 0), R = Math.min(PH / 2 - 6, 118), dx = 20 + R + 10, dy = IN + PH / 2 - 4;
  var b4 = donutSvg(dx, dy, R, R * .58, items) + '<text x="' + dx + '" y="' + (dy + 4) + '" text-anchor="middle" font-size="26" font-weight="700" fill="#0b1f3f">' + fmtInt(tot) + '</text><text x="' + dx + '" y="' + (dy + 26) + '" text-anchor="middle" font-size="13" fill="#55657f">' + (X.grade ? 'คัน' : 'เที่ยว') + '</text>';
  var lx = dx + R + 26;
  items.forEach(function(it, i){ var yy = IN + 22 + i * 30; b4 += '<rect x="' + lx + '" y="' + (yy - 12) + '" width="14" height="14" rx="3" fill="' + it.c + '"/><text x="' + (lx + 22) + '" y="' + yy + '" font-size="15" fill="#0b1f3f">' + esc(it.t) + '</text><text x="' + (lx + 180) + '" y="' + yy + '" text-anchor="end" font-size="15" font-weight="600" fill="#0b1f3f">' + fmtInt(it.v) + ' (' + (tot ? (it.v / tot * 100).toFixed(1) : '0.0') + '%)</text>'; });
  var wx = lx + 215, ww = pw - wx - 20, worst = P.rows.slice(-3).reverse();
  b4 += '<text x="' + wx + '" y="' + (IN + 8) + '" font-size="16" font-weight="600" fill="#c0392b">ทะเบียน Ontime % ต่ำสุด 3 อันดับ</text><text x="' + wx + '" y="' + (IN + 28) + '" font-size="12" fill="#55657f">เฉพาะทะเบียนที่มี ≥' + BW_MIN_TRIPS + ' เที่ยว</text>';
  if(!worst.length) b4 += '<text x="' + wx + '" y="' + (IN + 64) + '" font-size="15" fill="#55657f">ไม่มีทะเบียนที่เข้าเกณฑ์</text>';
  worst.forEach(function(r, i){
    var yy = IN + 44 + i * ((PH - 50) / 3), rh = (PH - 50) / 3 - 10;
    b4 += '<rect x="' + wx + '" y="' + yy + '" width="' + ww + '" height="' + rh + '" rx="10" fill="#fdecea"/><circle cx="' + (wx + 24) + '" cy="' + (yy + rh / 2) + '" r="14" fill="#c0392b"/><text x="' + (wx + 24) + '" y="' + (yy + rh / 2 + 5) + '" text-anchor="middle" font-size="14" font-weight="700" fill="#fff">' + (i + 1) + '</text>' +
      '<text x="' + (wx + 48) + '" y="' + (yy + rh / 2 - 3) + '" font-size="16" font-weight="600" fill="#0b1f3f">' + esc(r.name) + '</text><text x="' + (wx + 48) + '" y="' + (yy + rh / 2 + 16) + '" font-size="12" fill="#55657f">' + esc(String(r.loc).slice(0, 30)) + ' · ' + fmtInt(r.n) + ' เที่ยว</text>' +
      '<text x="' + (wx + ww - 14) + '" y="' + (yy + rh / 2 + 7) + '" text-anchor="end" font-size="20" font-weight="700" fill="#c0392b">' + fmtPct(r.val) + (X.grade ? ' · ' + gradeOf('on', r.val) : '') + '</text>';
  });
  b += panel(m + pw + g, top + ch + g, pw, ch, ttl, b4, '');
  // แถบท้าย: หมายเหตุสูตร
  var n1 = 'Ontime % = เที่ยวที่กลับถึง DC ไม่เกินเวลาตัด ÷ เที่ยวทั้งหมด · Delay % = เที่ยวที่กลับหลังเวลาตัด ÷ เที่ยวทั้งหมด · ล่าช้าเฉลี่ย = นาทีเกินเวลาตัด (นับไม่เกิน 22:00) เฉลี่ยเฉพาะเที่ยวล่าช้า · บิล/ชิ้นต่อคัน = รวม ÷ จำนวนเที่ยว',
      n2 = 'วันทำการ จันทร์–เสาร์ · เทียบช่วงก่อนด้วยจำนวนวันทำการเท่ากัน · เขียว = ดีขึ้น แดง = แย่ลง' + (X.grade ? ' · เกรด Ontime %: ' + GRADE.on.note + ' · Delay %: ' + GRADE.de.note : '') + (isNewPlan() ? ' · แผนใหม่: เฉพาะสินค้าแห้งของลูกค้าในแผน กลุ่มทันตัดตามเวลา DC กลุ่มตกตัด 20:00' : '') + ' · ข้อมูลจากรายงาน NIMEX016267';
  b += '<rect y="' + (H - foot) + '" width="' + W + '" height="' + foot + '" fill="#0a2a5e"/><rect y="' + (H - foot) + '" width="' + W + '" height="3" fill="#d4af37"/>' +
    '<text x="' + W / 2 + '" y="' + (H - foot + 22) + '" text-anchor="middle" font-size="13.5" fill="#dfe8f7">' + esc(n1) + '</text><text x="' + W / 2 + '" y="' + (H - foot + 42) + '" text-anchor="middle" font-size="13" fill="#e6d79c">' + esc(n2) + '</text>';
  return wrapSvg(W, H, sheetHead(W, head, 'h169') + b);
}
function slideSheet(k){ var W = 1600, H = 900, head = 104, foot = 40, m = 26, cw = W - 2 * m, top = head + m, cardH = H - head - foot - 2 * m, h = cardH - CARD.top - CARD.pad, p = infoPiece(k, cw - 2 * CARD.pad, { h:h, n:10 }); return wrapSvg(W, H, sheetHead(W, head, 'sg') + card(p, k, m, top, cw, cardH) + sheetFoot(W, H, foot)); }
function compose(keys){
  var W = 1240, m = 26, head = 176, foot = 46, ch = CARD.top + CARD.pad, inner = W - 2 * m - 2 * CARD.pad, y = head + m, b = '';
  keys.forEach(function(k){ var p = infoPiece(k, inner, { n:10 }); b += card(p, k, m, y, W - 2 * m, p.h + ch); y += p.h + ch + m; });
  var H = y + foot; return wrapSvg(W, H, sheetHead(W, head, 'cg') + b + sheetFoot(W, H, foot));
}
function toPng(c, scale){
  return new Promise(function(res, rej){
    if(c.W * c.H * scale * scale > 16e6) scale = Math.sqrt(16e6 / (c.W * c.H));
    var u = URL.createObjectURL(new Blob([c.svg], { type:'image/svg+xml' })), im = new Image();
    im.onload = function(){ setTimeout(function(){ var cv = document.createElement('canvas'); cv.width = Math.round(c.W * scale); cv.height = Math.round(c.H * scale); var x = cv.getContext('2d'); x.drawImage(im, 0, 0, cv.width, cv.height); URL.revokeObjectURL(u); cv.toBlob(function(b){ b ? res(b) : rej(new Error('png')); }, 'image/png'); }, 150); };
    im.onerror = rej; im.src = u;
  });
}
function blob64(b){ return new Promise(function(r){ var f = new FileReader(); f.onload = function(){ r(f.result); }; f.readAsDataURL(b); }); }

// ---------- text summary (emoji rules from the kit) ----------
var NUMS = ['1️⃣','2️⃣','3️⃣','4️⃣','5️⃣'];
function mark(d){ return !d || d.up === null ? '' : d.up ? ' ✅' : ' ⚠️'; }
function summaryText(){
  var S = scopeText(), K = kpiData(), L = ['📊 NIMEX Pickup Vehicle Dashboard', '🗓️ ' + S.gran + ' ' + S.range + (S.has ? '  |  🔁 เทียบ ' + S.cmp : '') + '  |  📍 ' + S.scope];
  var sec = function(t){ L.push(''); L.push(t); };
  if(picked.has('kpi')){
    sec('🎯 ผลสำคัญ · 🚚 ' + fmtInt(K.total) + ' เที่ยว' + (K.totalD ? ' (' + K.totalD.txt + ')' : ''));
    var E = { ontime:'⏱️', delay:'🐢', pending:'⌛' };
    K.main.forEach(function(t){ var gk = showGrade() && (t.id === 'ontime' ? 'on' : t.id === 'delay' ? 'de' : ''); L.push(E[t.id] + ' ' + t.l + ': ' + t.v + ' เที่ยว (' + t.sub.replace(' ของเที่ยว','') + ')' + (gk ? ' เกรด ' + gradeOf(gk, t.id === 'ontime' ? K.cur.ontimePct : K.cur.delayPct) : '') + (t.d ? ' ' + t.d.txt + mark(t.d) : '')); L.push('     📦 AB ' + fmtInt(t.ab) + ' · ❄️ CC ' + fmtInt(t.cc)); });
    var SE = ['🧾','📦','💰','📍','🧾','📦'];
    K.stats.forEach(function(t, i){ L.push(SE[i] + ' ' + t.l + ': ' + t.v + (t.d ? ' ' + t.d.txt + mark(t.d) : '')); });
  }
  if(picked.has('trend') || picked.has('delay')){
    var T = trendData('trend'), n = T.labels.length;
    if(n){ sec('📈 แนวโน้ม Ontime % ช่วงล่าสุด (' + T.labels[n - 1] + ')'); L.push('📦 AB ' + (isFinite(T.ab[n-1]) ? T.ab[n-1].toFixed(1) + '%' : '-') + ' · ❄️ CC ' + (isFinite(T.cc[n-1]) ? T.cc[n-1].toFixed(1) + '%' : '-')); }
  }
  if(picked.has('dc')){
    var M = dcExportModel(), R = M.rows.slice().sort(function(a,b){ return a.k.ontimePct - b.k.ontimePct; });
    sec('🏭 DC ที่ Ontime ต่ำสุด');
    R.slice(0, 3).forEach(function(r, i){ var d = r.prev ? r.k.ontimePct - r.prev.k.ontimePct : null;
      L.push(NUMS[i] + ' ' + r.label + ' (' + fmtInt(r.k.total) + ' เที่ยว): ' + fmtPct(r.k.ontimePct) + (d === null ? '' : ' ' + (Math.abs(d) < 0.0005 ? 'เท่าเดิม' : (d > 0 ? '▲ ' : '▼ ') + Math.abs(d*100).toFixed(1) + ' จุด') + (Math.abs(d) < 0.0005 ? '' : d > 0 ? ' ✅' : ' ⚠️'))); });
  }
  if(picked.has('cust')){
    var C = custRows().slice(0, 5);
    sec('🚨 ลูกค้าที่ได้รับผลกระทบสูงสุด');
    if(!C.length) L.push('ไม่มีลูกค้าที่ได้รับผลกระทบ 🎉');
    C.forEach(function(c, i){ L.push(NUMS[i] + ' ' + c.name + ' (' + c.loc + '): ' + fmtInt(c.trips) + ' เที่ยว · Delay ' + fmtInt(c.delay)); });
  }
  if(picked.has('analysis')){
    var A = analysisRows();
    sec('🔎 ผลการวิเคราะห์: ' + A.D.t + ' แย่สุดตาม ' + A.M.t.replace(/ \(.*\)/,''));
    A.rows.slice(0, 3).forEach(function(o, i){ L.push(NUMS[i] + ' ' + o.name + (anState.dim !== 'dc' ? ' (' + o.loc + ')' : '') + ': ' + A.M.f(o.val) + ' · ' + fmtInt(o.ts.length) + ' เที่ยว'); });
  }
  BW.forEach(function(M){
    if(!picked.has(M.k)) return;
    bwData(M.k).forEach(function(G){
      sec('🏆 ดีสุด/แย่สุด ' + M.t + ' ราย' + G.D.t + (M.hi ? ' (สูง = ดี)' : ' (ต่ำ = ดี)'));
      if(!G.n){ L.push('ข้อมูลไม่พอจัดอันดับ (มี ' + G.rows.length + ' รายการ)'); return; }
      var line = function(r){ var g = gradeTxt(M, r); return r.name + (G.D.id === 'plate' ? ' (' + fmtInt(r.n) + ' เที่ยว)' : '') + ': ' + bwVal(M, r) + (g ? ' เกรด ' + g : '') + (r.d ? ' ' + r.d.txt + mark(r.d) : ''); };
      G.best.forEach(function(r, i){ L.push('🟢 ดีสุด ' + (i + 1) + ' ' + line(r)); });
      G.worst.forEach(function(r, i){ L.push('🔴 แย่สุด ' + (i + 1) + ' ' + line(r)); });
    });
  });
  if(!S.has) { L.push(''); L.push('ℹ️ ไม่มีช่วงก่อนหน้าให้เทียบ'); }
  return PL(L.join('\n'));
}

// ---------- Excel ----------
function sheetsData(){
  var out = [], K = kpiData();
  var np = K.prev ? '' : 'ไม่มีช่วงก่อนหน้า';
  if(picked.has('kpi')) out.push(['KPI', [['ตัวชี้วัด','ค่า','รายละเอียด','เทียบช่วงก่อน']].concat(K.main.map(function(t){ return [t.l, t.v, t.sub + ' · AB ' + t.ab + ' · CC ' + t.cc, t.d ? t.d.txt : np]; })).concat(K.stats.map(function(t){ return [t.l, t.v, '', t.d ? t.d.txt : np]; })).concat([['เที่ยวรวม', K.total, '', K.totalD ? K.totalD.txt : np]]).concat(showGrade() ? [['เกรด Ontime %', gradeOf('on', K.cur.ontimePct), GRADE.on.note, ''], ['เกรด Delay %', gradeOf('de', K.cur.delayPct), GRADE.de.note, '']] : [])]);
  if(picked.has('trend') || picked.has('delay')){
    var T = trendData('trend'), D2 = trendData('delay');
    out.push(['แนวโน้ม', [['ช่วง','Ontime % AB','Ontime % CC','ล่าช้าเฉลี่ย AB (นาที)','ล่าช้าเฉลี่ย CC (นาที)']].concat(T.labels.map(function(l, i){ var r = function(v){ return isFinite(v) ? Math.round(v * 10) / 10 : ''; }; return [l, r(T.ab[i]), r(T.cc[i]), r(D2.ab[i]), r(D2.cc[i])]; }))]);
  }
  if(picked.has('dc')){
    var M = dcExportModel(), cols = M.cols;
    var raw = function(r, c){ if(c.d){ if(!r.prev) return ''; var x = c.d.mode === 'pct' ? diffPct(c.d.cur(r), c.d.prev(r.prev)) : c.d.cur(r) - c.d.prev(r.prev); return isFinite(x) ? Math.round(x * (c.d.mode === 'abs' ? 1 : 1000)) / (c.d.mode === 'abs' ? 1 : 10) : ''; }
      var v = c.v(r); if(c.txt) return v; if(v === null) return ''; return /Pct$/.test(c.k) ? Math.round(v * 1000) / 10 : Math.round(v * 100) / 100; };
    var hd = ['DC'].concat(cols.map(function(c){ return c.t + ((/Pct$/.test(c.k) || (c.d && c.d.mode !== 'abs')) && c.t.indexOf('%') === -1 ? ' (%)' : (c.d && c.d.mode === 'pp' ? ' (จุด)' : '')); }));
    out.push(['ราย DC', [hd].concat(M.rows.map(function(r){ return [r.label].concat(cols.map(function(c){ return raw(r, c); })); })).concat([['รวม'].concat(cols.map(function(c){ return raw(M.sum, c); }))])]);
  }
  if(picked.has('cust')) out.push(['ลูกค้าที่กระทบ', [['ลูกค้า','ภาค / DC','เที่ยวที่กระทบ','Delay','ยังไม่กลับ','รายได้ของเที่ยว (บาท)']].concat(custRows().map(function(c){ return [c.name, c.loc, c.trips, c.delay, c.pending, Math.round(c.revenue)]; }))]);
  if(picked.has('analysis')){ var A = analysisRows(); out.push(['ผลการวิเคราะห์', [['อันดับ', A.D.t, 'ภาค / DC', 'เที่ยว', 'Ontime %', 'Delay', 'Delay %', 'ล่าช้าเฉลี่ย (นาที)']].concat(A.rows.map(function(o, i){ return [i + 1, o.name, o.loc, o.ts.length, Math.round(o.k.ontimePct * 1000) / 10, o.k.delay, Math.round(o.k.delayPct * 1000) / 10, o.avgDelay === null ? '' : Math.round(o.avgDelay)]; }))]); }
  BW.forEach(function(M){
    if(!picked.has(M.k)) return;
    var gr = !!(M.g && showGrade()), rows = [['มิติ','อันดับ','ป้าย','ชื่อ','ภาค / DC','เที่ยว', M.t + (M.mode === 'pp' && M.t.indexOf('%') === -1 ? ' (%)' : '')].concat(gr ? ['เกรด'] : []).concat(['ช่วงก่อน', 'ผลต่าง', 'ดีขึ้น/แย่ลง'])];
    bwData(M.k).forEach(function(G){
      G.rows.forEach(function(r){ rows.push([G.D.t, r.rank, r.tag, r.name, r.loc, r.n, M.x(r.val)].concat(gr ? [gradeTxt(M, r)] : []).concat([r.prevVal === null ? (G.hasPrev ? '' : 'ไม่มีช่วงก่อนหน้า') : M.x(r.prevVal), r.d ? r.d.txt : '', r.d ? (r.d.up === null ? 'เท่าเดิม' : r.d.up ? 'ดีขึ้น' : 'แย่ลง') : ''])); });
      if(G.skipped) rows.push([G.D.t, '', '', 'ไม่จัดอันดับ ' + G.skipped + ' รายการ (น้อยกว่า ' + G.D.min + ' เที่ยว)', '', '', '']);
    });
    out.push([('ดีแย่ ' + M.t.replace(/[\\\/\?\*\[\]:]/g, 'ต่อ').replace(/[()]/g, '')).slice(0, 31), rows]);
  });
  return out.map(function(sh){ return [PL(sh[0]).slice(0, 31), sh[1].map(function(r){ return r.map(function(c){ return typeof c === 'string' ? PL(c) : c; }); })]; });
}

// ---------- save + share sheet ----------
function stamp(){
  var f = state.dateFrom || '', per = state.granularity === 'month' ? f.slice(0,7) : state.granularity === 'week' ? f + '-week' : f;
  return 'NIMEX-Pickup-' + per + (state.selectedDC ? '-DC' + state.selectedDC : state.selectedZone ? '-Zone' : '') + (state.productFilter ? (state.productFilter === 'แห้ง' ? '-AB' : '-CC') : '') + (isNewPlan() ? '-แผนใหม่' : '');
}
function xsay(m){ var x = document.getElementById('xmsg'); if(x) x.textContent = m; }
function saveFile(name, blob){
  if(window.__testSave) return window.__testSave(name, blob);
  var u = URL.createObjectURL(blob), a = document.createElement('a');
  a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(function(){ URL.revokeObjectURL(u); }, 4000);
  xsay('ดาวน์โหลดไฟล์แล้ว: ' + name);
}
function openShare(){
  var S = scopeText();
  document.getElementById('shareScope').textContent = S.gran + ' ' + S.range + (S.has ? ' · เทียบ ' + S.cmp : '') + ' · ' + S.scope + ' — ใช้ผลตามตัวกรองที่เลือกอยู่';
  var box = function(s){ return '<label><input type="checkbox" data-sec="' + s[0] + '"' + (picked.has(s[0]) ? ' checked' : '') + '> ' + s[1].replace('ดีสุด/แย่สุด: ', '') + '</label>'; };
  document.getElementById('secChecks').innerHTML = '<p class="checks-h">หัวข้อ</p>' + SECS.filter(function(s){ return !BWK[s[0]]; }).map(box).join('') +
    '<p class="checks-h">ดีสุด/แย่สุด ราย DC + รายทะเบียน (ทะเบียน ≥' + BW_MIN_TRIPS + ' เที่ยว)</p>' + SECS.filter(function(s){ return BWK[s[0]]; }).map(box).join('') +
    '<p class="checks-h">ตั้งค่า</p><label class="wide"><input type="checkbox" id="gradeToggle"' + (showGrade() ? ' checked' : '') + '> แสดงเกรด A–F (Ontime %, Delay %) — บันทึกลงระบบ</label>';
  document.getElementById('shareText').value = summaryText();
  xsay('');
  document.getElementById('shareModalOverlay').classList.add('open');
}
async function doExport(a){
  var keys = SECS.map(function(s){ return s[0]; }).filter(function(k){ return picked.has(k); });
  if(a === 'copy'){ var t = document.getElementById('shareText'); try{ await navigator.clipboard.writeText(t.value); xsay('คัดลอกแล้ว นำไปวางใน LINE หรือแอปอื่นได้เลย'); }catch(e){ t.select(); document.execCommand('copy'); xsay('คัดลอกแล้ว'); } return; }
  if(a === 'line'){ window.open('https://line.me/R/msg/text/?' + encodeURIComponent(document.getElementById('shareText').value), '_blank'); return; }
  if(a === 'mail'){ location.href = 'mailto:?subject=' + encodeURIComponent('NIMEX Pickup Vehicle Dashboard') + '&body=' + encodeURIComponent(document.getElementById('shareText').value); return; }
  if(!keys.length && a !== 'info'){ xsay('เลือกอย่างน้อย 1 หัวข้อก่อน (อินโฟกราฟิก 16:9 กดได้เลยไม่ต้องเลือก)'); return; }
  var btns = document.querySelectorAll('#shareModalOverlay .xbtn'); btns.forEach(function(b){ b.disabled = true; }); xsay('กำลังสร้างไฟล์…');
  try{
    if(document.fonts && document.fonts.ready) await document.fonts.ready;
    if(a === 'xlsx'){
      var wb = XLSX.utils.book_new();
      sheetsData().forEach(function(x){ var ws = XLSX.utils.aoa_to_sheet(x[1]); ws['!cols'] = x[1][0].map(function(_, i){ return { wch: i ? 16 : 30 }; }); XLSX.utils.book_append_sheet(wb, ws, x[0]); });
      saveFile(stamp() + '.xlsx', new Blob([XLSX.write(wb, { type:'array', bookType:'xlsx' })], { type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
    }
    if(a === 'png'){ saveFile(stamp() + '.png', await toPng(compose(keys), 2.5)); }
    if(a === 'info'){ saveFile(stamp() + '-Infographic-16x9.png', await toPng(info169(), 2)); }
    if(a === 'pptx'){
      if(!window.PptxGenJS) throw new Error('lib');
      var p = new PptxGenJS(); p.layout = 'LAYOUT_WIDE';
      var t = p.addSlide(); t.background = { color:'0A2A5E' };
      t.addShape(p.ShapeType.roundRect, { x:5.17, y:.8, w:3, h:2.1, fill:{ color:'FFFFFF' }, line:{ color:'FFFFFF' }, rectRadius:.12 });
      t.addImage({ data:logoSrc(), x:5.37, y:.95, w:2.6, h:1.8, sizing:{ type:'contain', w:2.6, h:1.8 } });
      t.addText('NIMEX Pickup Vehicle Dashboard', { x:0, y:3.3, w:13.33, h:.9, align:'center', color:'FFFFFF', fontFace:'Prompt', fontSize:36, bold:true });
      t.addShape(p.ShapeType.rect, { x:4.67, y:4.3, w:4, h:.04, fill:{ color:'D4AF37' }, line:{ color:'D4AF37' } });
      var S = scopeText();
      t.addText([S.gran + ' · ' + S.range, S.has ? 'เทียบ ' + S.cmp : '', S.scope].filter(Boolean).join('\n'), { x:0, y:4.5, w:13.33, h:1.4, align:'center', color:'E6D79C', fontFace:'Prompt', fontSize:18 });
      p.addSlide().addImage({ data:await blob64(await toPng(info169(), 1)), x:0, y:0, w:13.333, h:7.5 });
      for(var i = 0; i < keys.length; i++){ var u = await blob64(await toPng(slideSheet(keys[i]), 1.5)); p.addSlide().addImage({ data:u, x:0, y:0, w:13.333, h:7.5 }); }
      var buf = await p.write({ outputType:'arraybuffer' });
      saveFile(stamp() + '.pptx', new Blob([buf], { type:'application/vnd.openxmlformats-officedocument.presentationml.presentation' }));
    }
  }catch(e){ console.error(e); xsay(e && e.message === 'lib' ? 'โหลดตัวช่วยส่งออกไม่สำเร็จ ลองเปิดหน้าใหม่อีกครั้ง' : 'สร้างไฟล์ไม่สำเร็จ ลองเลือกส่วนน้อยลง'); }
  btns.forEach(function(b){ b.disabled = false; });
}
window.__nimexExport = doExport;
function wireShare(){
  document.getElementById('shareBtn').addEventListener('click', function(){ setTimeout(openShare, 0); });
  document.getElementById('secChecks').addEventListener('change', function(e){
    if(e.target.id === 'gradeToggle'){ if(window.__pickupSaveSettings) window.__pickupSaveSettings({ showGrade: e.target.checked }); document.getElementById('shareText').value = summaryText(); return; }
    var k = e.target.dataset && e.target.dataset.sec; if(!k) return; e.target.checked ? picked.add(k) : picked.delete(k); document.getElementById('shareText').value = summaryText(); });
  document.querySelectorAll('#shareModalOverlay [data-x]').forEach(function(b){ b.addEventListener('click', function(){ doExport(b.dataset.x); }); });
  document.getElementById('pngBtn').addEventListener('click', async function(){
    showToast('กำลังสร้างภาพ…');
    try{ if(document.fonts && document.fonts.ready) await document.fonts.ready; saveFile(stamp() + '.png', await toPng(compose(['kpi','trend','dc']), 2.5)); showToast('บันทึกภาพแล้ว'); }
    catch(e){ console.error(e); showToast('บันทึกภาพไม่สำเร็จ'); }
  });
}

wireShare();
return { scopeText:scopeText, kpiData:kpiData, dcExportModel:dcExportModel, sheetsData:sheetsData, summaryText:summaryText, doExport:doExport, info169:info169, bwData:bwData, picked:function(){ return picked; } };
};
