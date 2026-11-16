/* NIMEX Pickup Vehicle Dashboard — app (no data inside; data comes from Google Sheet) */

/* ===== NIMEX shell glue: layout only (tabs, segments, menu, theme, cover). No calculations here. ===== */
(function(){
  var root=document.documentElement, KEY='nimex-pickup-theme';
  var TITLES={tabDashboard:'ภาพรวมรถเข้ารับสินค้า',tabCompare:'เปรียบเทียบผล',tabTrips:'รายละเอียดรายเที่ยว',tabAnalysis:'ผลการวิเคราะห์',tabProblems:'สรุปปัญหา (Delay / ยังไม่กลับ)',tabSettings:'ตั้งค่า'};
  var $=function(id){return document.getElementById(id)};

  /* ---- theme ---- */
  try{var saved=localStorage.getItem(KEY);if(saved)root.setAttribute('data-theme',saved)}catch(e){}
  function isDark(){var t=root.getAttribute('data-theme');return t?t==='dark':window.matchMedia&&matchMedia('(prefers-color-scheme: dark)').matches}
  function chartTheme(){
    if(!window.Chart)return;
    var cs=getComputedStyle(root);
    Chart.defaults.color=cs.getPropertyValue('--muted').trim();
    Chart.defaults.borderColor=cs.getPropertyValue('--line').trim();
    Chart.defaults.font.family="'Prompt', sans-serif";
  }
  var SUN='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
  var MOON='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z"/></svg>';
  function themeIcon(){var b=$('themeBtn');if(b)b.innerHTML=isDark()?SUN:MOON}
  chartTheme();

  function rerenderCharts(){
    // re-run the app's own render by re-firing an unchanged control (values stay the same)
    var g=$('fGranularity');if(g)g.dispatchEvent(new Event('change'));
    if($('tabCompare')&&$('tabCompare').style.display!=='none'){var c=$('cmpProduct');if(c)c.dispatchEvent(new Event('change'))}
  }

  function syncSegs(){
    [['seg-group','fProduct'],['seg-mode','fGranularity']].forEach(function(p){
      var seg=$(p[0]),sel=$(p[1]);if(!seg||!sel)return;
      seg.querySelectorAll('button').forEach(function(b){b.setAttribute('aria-pressed',String(b.dataset.v===sel.value))});
    });
  }
  function currentTab(){var a=document.querySelector('.rail .main-tab.active');return a?a.dataset.tab:'tabDashboard'}
  function syncTabs(){
    var t=currentTab();
    document.body.dataset.tab=t;
    document.querySelectorAll('.rail .main-tab').forEach(function(b){if(b.dataset.tab===t)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current')});
    document.querySelectorAll('.tab [data-go]').forEach(function(b){if(b.dataset.go===t)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current')});
    var h=$('pageTitle');if(h)h.textContent=TITLES[t]||'';
  }
  function relabel(id,txt){
    var s=$(id);if(!s)return;
    var fix=function(){var o=s.options[0];if(o&&o.value===''&&o.textContent!==txt)o.textContent=txt};
    fix();new MutationObserver(fix).observe(s,{childList:true});
  }

  (document.readyState==='loading'?function(f){document.addEventListener('DOMContentLoaded',f)}:function(f){setTimeout(f,0)})(function(){
    /* cover */
    var cv=$('cover');
    if(cv){
      var close=function(){cv.remove()};
      cv.querySelector('button').onclick=close;cv.querySelector('.fg').onclick=close;cv.querySelector('button').focus();
    }
    themeIcon();
    $('themeBtn').addEventListener('click',function(){
      var next=isDark()?'light':'dark';root.setAttribute('data-theme',next);
      try{localStorage.setItem(KEY,next)}catch(e){}
      themeIcon();chartTheme();rerenderCharts();
    });

    /* segments -> original selects */
    [['seg-group','fProduct'],['seg-mode','fGranularity']].forEach(function(p){
      $(p[0]).addEventListener('click',function(e){
        var b=e.target.closest('button');if(!b)return;
        if(p[0]==='seg-mode'&&window.__nimexPeriod){window.__nimexPeriod(b.dataset.v);syncSegs();return;}
        var sel=$(p[1]);if(sel.value===b.dataset.v)return;
        sel.value=b.dataset.v;sel.dispatchEvent(new Event('change'));syncSegs();
      });
    });

    /* tabs */
    document.querySelectorAll('.rail .main-tab').forEach(function(b){b.addEventListener('click',function(){syncTabs();window.scrollTo(0,0)})});
    document.querySelectorAll('.tab [data-go]').forEach(function(b){
      b.addEventListener('click',function(){var r=document.querySelector('.rail .main-tab[data-tab="'+b.dataset.go+'"]');if(r)r.click()});
    });
    var st=$('settingsTabBtn'),stm=document.querySelector('.tab [data-go="tabSettings"]');
    var syncSettings=function(){stm.hidden=st.style.display==='none'};
    syncSettings();new MutationObserver(syncSettings).observe(st,{attributes:true,attributeFilter:['style']});

    /* more menu */
    var mb=$('moreBtn'),mm=$('moreMenu');
    var setMenu=function(open){mm.hidden=!open;mb.setAttribute('aria-expanded',String(open))};
    mb.addEventListener('click',function(e){e.stopPropagation();setMenu(mm.hidden)});
    mm.addEventListener('click',function(e){if(e.target.closest('button'))setMenu(false)});
    document.addEventListener('click',function(e){if(!mm.hidden&&!mm.contains(e.target)&&e.target!==mb)setMenu(false)});
    document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!mm.hidden){setMenu(false);mb.focus()}});

    $('logoutBtn').addEventListener('click',function(){
      try{sessionStorage.removeItem('nimex-pickup-admin');sessionStorage.removeItem('pickup-key')}catch(e){}
      location.replace(location.pathname+location.search);
    });
    relabel('fZone','ทุกภาค');relabel('fDC','ทุก DC');
    syncTabs();
    setTimeout(syncSegs,0);
  });
  // keep segments in step with any change the app makes (reset, upload, etc.)
  ['click','change'].forEach(function(ev){document.addEventListener(ev,function(){requestAnimationFrame(syncSegs)},true)});
  if(window.matchMedia)matchMedia('(prefers-color-scheme: dark)').addEventListener('change',function(){if(!root.getAttribute('data-theme')){themeIcon();chartTheme();rerenderCharts()}});
})();

;
// core.js — pure data logic for the Pickup Vehicle dashboard (no DOM deps)
// Exports via module.exports for Node testing; same file is inlined into the HTML.

const DC_CUTOFF = {
  '610': { hh: 14, mm: 30, name: 'DC พุทธมณฑลสาย 3' },
  '621': { hh: 14, mm: 30, name: 'DC รังสิต' },
  '691': { hh: 17, mm: 0,  name: 'CDC บางนา' },
};

function dcCode(dcField) {
  const m = String(dcField || '').trim().match(/^(\d+)/);
  return m ? m[1] : '';
}

function dcCutoffMinutes(dcField) {
  const code = dcCode(dcField);
  const c = DC_CUTOFF[code];
  return c ? c.hh * 60 + c.mm : null;
}

// Resolves the applicable cutoff for a DC+product combo, preferring a runtime override
// (from the dashboard's settings page) and falling back to the hardcoded defaults above.
function resolveCutoffMinutes(dcCode_, product, cutoffOverrides) {
  if (cutoffOverrides && cutoffOverrides[dcCode_]) {
    const ov = cutoffOverrides[dcCode_];
    if (product && ov[product] !== undefined && ov[product] !== null) return ov[product];
    if (ov.default !== undefined && ov.default !== null) return ov.default;
  }
  const c = DC_CUTOFF[dcCode_];
  if (c) return c.hh * 60 + c.mm;
  return 18 * 60; // fallback default for DCs with no configured cutoff at all
}

// Parses "dd/mm/yyyy  hh:mm:ss" (Buddhist year, extra spaces tolerated). Returns null if blank/unparseable.
function parseThaiDT(s) {
  if (!s) return null;
  const str = String(s).trim();
  if (!str) return null;
  const m = str.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})/);
  if (!m) return null;
  const d = parseInt(m[1], 10);
  const mo = parseInt(m[2], 10);
  const yBE = parseInt(m[3], 10);
  const hh = parseInt(m[4], 10);
  const mi = parseInt(m[5], 10);
  const ss = parseInt(m[6], 10);
  const yCE = yBE - 543;
  const dateObj = new Date(yCE, mo - 1, d, hh, mi, ss);
  const dateKey = `${yCE}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  return {
    raw: str,
    y: yCE, yBE, mo, d, hh, mi, ss,
    dateKey,
    ms: dateObj.getTime(),
    timeOfDayMin: hh * 60 + mi,
    dateObj,
  };
}

// Extracts 'แห้ง' / 'เย็น' from the ประภทลูกค้า (Y) field, e.g. "ลูกค้าเครดิต แห้ง" -> 'แห้ง'
function extractProduct(yField) {
  const s = String(yField || '');
  if (s.indexOf('แห้ง') !== -1) return 'แห้ง';
  if (s.indexOf('เย็น') !== -1) return 'เย็น';
  return '';
}

// Data-quality rule: rows are individual small-batch return pickups (รับของกลับรายย่อย) and must be
// excluded, UNLESS the customer code is exactly the one allowed exception.
function isExcludedByCustomerCode(tField) {
  const s = String(tField || '');
  if (s.indexOf('-STFW_CLAIM-') === -1) return false;
  return s !== 'NAP-STFW_CLAIM-00001';
}

function num(v) {
  const n = parseFloat(v);
  return isNaN(n) ? 0 : n;
}

// Quantity fallback logic per spec:
// dry: primary AB/AC (driver scan), fallback AD/AE (DC received) when primary has no value (0 or blank)
// cold: primary AG/AH (driver scan), fallback AI/AJ (DC received) when primary has no value (0 or blank)
function computeQty(row) {
  const abBills = num(row.ab), acItems = num(row.ac);
  const adBills = num(row.ad), aeItems = num(row.ae);
  const agBills = num(row.ag), ahItems = num(row.ah);
  const aiBills = num(row.ai), ajItems = num(row.aj);

  const dryHasPrimary = abBills !== 0 || acItems !== 0;
  const dryBills = dryHasPrimary ? abBills : adBills;
  const dryItems = dryHasPrimary ? acItems : aeItems;

  const coldHasPrimary = agBills !== 0 || ahItems !== 0;
  const coldBills = coldHasPrimary ? agBills : aiBills;
  const coldItems = coldHasPrimary ? ahItems : ajItems;

  return { dryBills, dryItems, coldBills, coldItems };
}

// Build line-item records (1 per raw row) with parsed fields.
// Rows matching the STFW_CLAIM exclusion rule are dropped entirely (they are individual small-batch
// return pickups, not part of the pickup-vehicle performance dataset).
function buildLineItems(rawRows) {
  const out = [];
  rawRows.forEach((row, idx) => {
    if (isExcludedByCustomerCode(row.t)) return;
    const qty = computeQty(row);
    const dispatch = parseThaiDT(row.c);
    const arriveDC = parseThaiDT(row.q);
    const arrivePoint = parseThaiDT(row.n);
    const leavePoint = parseThaiDT(row.p);
    const startUnload = parseThaiDT(row.r);
    const endUnload = parseThaiDT(row.s);
    out.push({
      idx,
      b: String(row.b || '').trim(),
      e: String(row.e || '').trim(),
      dc: row.g,
      dcCode: dcCode(row.g),
      customer: row.h,
      customerCode: row.t,
      plate: row.k,
      vehicleType: row.l,
      productType: extractProduct(row.y),
      route: row.u,
      revenue: num(row.v),
      dryBills: qty.dryBills, dryItems: qty.dryItems,
      coldBills: qty.coldBills, coldItems: qty.coldItems,
      dispatch, arriveDC, arrivePoint, leavePoint, startUnload, endUnload,
    });
  });
  return out;
}

// Group line items into trips by B (เลขที่จัดรถ), then assign เที่ยวที่ N per (plate + dispatch date).
// reportEndDateKey: the last date covered by the report (from row 3 of the source file). Used to decide
// whether a trip with no Q/R at all is genuinely still out (report just ended) or badly overdue (Delay).
function __todayKey() { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
// [ปรับ 16/11/2569] planOpt (แผนใหม่ เท่านั้น): { cutoff(items, dcCode) -> นาที, product(items) -> 'แห้ง'|'เย็น' } · ไม่ส่ง planOpt = คำนวณแบบเดิมทุกอย่าง
function buildTrips(lineItems, reportEndDateKey, cutoffOverrides, excludedCustomers, planOpt) {
  const byB = new Map();
  for (const li of lineItems) {
    if (!li.b) continue;
    const tk = li.b + '|' + String(li.plate || '').trim() + '|' + (li.dispatch ? li.dispatch.dateKey : '');
    if (!byB.has(tk)) byB.set(tk, []);
    byB.get(tk).push(li);
  }

  if (!reportEndDateKey) {
    let maxKey = null;
    for (const li of lineItems) {
      if (li.dispatch && (!maxKey || li.dispatch.dateKey > maxKey)) maxKey = li.dispatch.dateKey;
    }
    reportEndDateKey = maxKey;
  }

  // [ปรับ 08/11/2569] เที่ยวที่ไม่แสดง AB/CC (บิล+ชิ้นเป็น 0 ทั้งสองฝั่ง): ใช้สินค้าของเที่ยวล่าสุดก่อนหน้าของทะเบียนเดียวกัน ถ้าไม่มีประวัติ ถือเป็น AB
  const __inferred = new Map();
  {
    const pre = [];
    for (const [b, items] of byB.entries()) {
      let dv = 0, cv = 0, ms = Infinity;
      for (const i of items) { dv += i.dryBills + i.dryItems; cv += i.coldBills + i.coldItems; if (i.dispatch && i.dispatch.ms < ms) ms = i.dispatch.ms; }
      pre.push({ b, plate: items[0].plate, ms, prod: (dv > 0 || cv > 0) ? (dv >= cv ? 'แห้ง' : 'เย็น') : null });
    }
    pre.sort((a, c) => a.ms - c.ms);
    const lastByPlate = new Map();
    for (const p of pre) {
      if (p.prod) { if (p.plate) lastByPlate.set(p.plate, p.prod); continue; }
      __inferred.set(p.b, (p.plate && lastByPlate.get(p.plate)) || 'แห้ง');
    }
  }
  const trips = [];
  for (const [tkey, items] of byB.entries()) {
    const b = items[0].b;
    const dispatchItems = items.filter(i => i.dispatch);
    const dispatch = dispatchItems.length ? dispatchItems.sort((a, c) => a.dispatch.ms - c.dispatch.ms)[0].dispatch : null;

    // Return-to-DC time: Q (เวลาถึงดีซี) primary, R (เวลาที่เริ่มลงสินค้า) fallback.
    const arriveItemsQ = items.filter(i => i.arriveDC);
    let arriveDC = arriveItemsQ.length ? arriveItemsQ.sort((a, c) => c.arriveDC.ms - a.arriveDC.ms)[0].arriveDC : null;
    let arriveSynthetic = false;
    if (!arriveDC) {
      const arriveItemsR = items.filter(i => i.startUnload);
      arriveDC = arriveItemsR.length ? arriveItemsR.sort((a, c) => c.startUnload.ms - a.startUnload.ms)[0].startUnload : null;
    }
    if (!arriveDC && dispatch) {
      // Neither Q nor R exists anywhere in this trip.
      // [ปรับ 08/11/2569] ไม่มีเวลากลับเลย และวันจัดรถผ่านไปแล้ว (เทียบกับวันนี้) -> Delay; 'ยังไม่กลับ' มีได้เฉพาะเที่ยวของวันนี้
      if (dispatch.dateKey < __todayKey()) {
        // The report period has already moved past this trip's day with no return scan ever recorded -
        // treat as badly Delay, assumed arrival 20:00 on the dispatch date (no real timestamp available).
        const d = dispatch.dateObj;
        const synthDate = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 20, 0, 0);
        arriveDC = {
          raw: 'ประมาณการ 20:00 (ไม่มีข้อมูลจริง)',
          y: d.getFullYear(), yBE: d.getFullYear() + 543, mo: d.getMonth() + 1, d: d.getDate(),
          hh: 20, mi: 0, ss: 0,
          dateKey: dispatch.dateKey,
          ms: synthDate.getTime(),
          timeOfDayMin: 20 * 60,
          dateObj: synthDate,
        };
        arriveSynthetic = true;
      }
      // else: dispatch date is the report's last day (or later) - vehicle is still genuinely out.
      // Leave arriveDC as null; status resolves to 'pending' below.
    }
    if (!dispatch && !arriveDC) continue; // nothing usable at all - drop this record

    const customers = new Set(items.map(i => i.customer).filter(Boolean));
    const routes = new Set(items.map(i => i.route).filter(Boolean));
    const productTypes = new Set(items.map(i => i.productType).filter(Boolean));

    const dc = items[0].dc;
    const dcCodeV = items[0].dcCode;
    const plate = items[0].plate;
    const vehicleType = items[0].vehicleType;

    let revenue = 0, dryBills = 0, dryItems = 0, coldBills = 0, coldItems = 0, bills = 0, pieces = 0;
    for (const i of items) {
      revenue += i.revenue;
      dryBills += i.dryBills; dryItems += i.dryItems;
      coldBills += i.coldBills; coldItems += i.coldItems;
    }
    bills = dryBills + coldBills;
    pieces = dryItems + coldItems;

    // Dominant product type for trips carrying a mix of AB (dry) and CC (cold): whichever has the
    // larger combined bills+items volume wins; ties/empty fall back to whichever side is non-zero.
    const dryVolume = dryBills + dryItems, coldVolume = coldBills + coldItems;
    let dominantProduct = null, productInferred = false;
    if (dryVolume > 0 || coldVolume > 0) {
      dominantProduct = dryVolume >= coldVolume ? 'แห้ง' : 'เย็น';
    } else {
      dominantProduct = __inferred.get(tkey) || 'แห้ง';
      productInferred = true;
      productTypes.clear(); productTypes.add(dominantProduct);
    }
    // แผนใหม่: ช่อง AB/CC ใช้แทนกลุ่มลูกค้า (แห้ง = กลุ่มทัน Cut off, เย็น = กลุ่มตก Cut off)
    if (planOpt) { dominantProduct = planOpt.product(items); productInferred = false; productTypes.clear(); productTypes.add(dominantProduct); }

    // status
    let status = 'pending'; // ยังไม่กลับเข้าคลัง
    const cutoffMin = planOpt ? planOpt.cutoff(items, dcCodeV) : resolveCutoffMinutes(dcCodeV, dominantProduct, cutoffOverrides);
    let delayMinutes = null;
    if (dispatch && arriveDC) {
      if (arriveDC.dateKey === dispatch.dateKey) {
        if (cutoffMin !== null) {
          status = arriveDC.timeOfDayMin <= cutoffMin ? 'ontime' : 'delay';
          delayMinutes = (status === 'delay') ? (arriveDC.timeOfDayMin - cutoffMin) : null;
        }
      } else if (arriveDC.dateKey < dispatch.dateKey) {
        // [ปรับ 08/11/2569] กลับเข้า DC ก่อนวันจัดรถ (ข้อมูลคลาดเคลื่อน) -> ถือว่า Ontime
        status = 'ontime';
      } else {
        // Returned, but on a later day than dispatch - this is not "still out", it is Delay.
        // Compute delay minutes across the day boundary using full timestamps, not just time-of-day.
        status = 'delay';
        if (cutoffMin !== null) {
          const cutoffDateObj = new Date(dispatch.dateObj.getFullYear(), dispatch.dateObj.getMonth(), dispatch.dateObj.getDate(), Math.floor(cutoffMin / 60), cutoffMin % 60, 0);
          delayMinutes = Math.round((arriveDC.dateObj.getTime() - cutoffDateObj.getTime()) / 60000);
        }
      }
    }

    // แผนใหม่: เที่ยวที่ไม่มีเวลากลับเลย (ประมาณการ 20:00) นับเป็น Delay เสมอ แม้กลุ่มตกตัดที่ 20:00
    if (planOpt && arriveSynthetic && status === 'ontime') { status = 'delay'; delayMinutes = null; }

    // [ปรับ 08/11/2569] นาทีล่าช้านับได้ไม่เกิน 22:00 น. ของวันจัดรถ (เพดาน = 22:00 - เวลาตัด)
    if (status === 'delay' && delayMinutes !== null && cutoffMin !== null) {
      delayMinutes = Math.min(delayMinutes, Math.max(0, 22 * 60 - cutoffMin));
    }

    // Customer late-return exemption: if any customer on this trip has an agreed late-return
    // arrangement, the whole trip is treated as Ontime instead of Delay/Pending.
    const hasExemptCustomer = excludedCustomers && excludedCustomers.size &&
      items.some(i => i.customer && excludedCustomers.has(i.customer));
    if (hasExemptCustomer && status !== 'ontime') {
      status = 'ontime';
      delayMinutes = null;
    }

    trips.push({
      b, key: tkey, dc, dcCode: dcCodeV, plate, vehicleType,
      dateKey: dispatch ? dispatch.dateKey : null,
      dispatch, arriveDC, arriveSynthetic,
      pickupPoints: customers.size,
      customers: Array.from(customers),
      routes: Array.from(routes),
      productTypes: Array.from(productTypes),
      dominantProduct, productInferred,
      revenue, dryBills, dryItems, coldBills, coldItems, bills, pieces,
      status, delayMinutes,
      lineItemIdx: items.map(i => i.idx),
      lineCount: items.length,
    });
  }

  // assign เที่ยวที่ N by plate + dateKey, ordered by dispatch time
  const byPlateDate = new Map();
  for (const t of trips) {
    if (!t.plate || !t.dateKey) continue;
    const key = t.plate + '|' + t.dateKey;
    if (!byPlateDate.has(key)) byPlateDate.set(key, []);
    byPlateDate.get(key).push(t);
  }
  for (const group of byPlateDate.values()) {
    group.sort((a, c) => (a.dispatch ? a.dispatch.ms : 0) - (c.dispatch ? c.dispatch.ms : 0));
    group.forEach((t, i) => { t.tripNo = i + 1; t.tripGroupSize = group.length; });
  }
  trips.forEach(t => { if (t.tripNo === undefined) { t.tripNo = 1; t.tripGroupSize = 1; } });

  // sort trips by dispatch time ascending for stable default display
  trips.sort((a, c) => (a.dispatch ? a.dispatch.ms : 0) - (c.dispatch ? c.dispatch.ms : 0));

  return trips;
}

function isoWeekKey(dateObj) {
  // returns e.g. "2026-W37"
  const d = new Date(Date.UTC(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate()));
  const dayNum = (d.getUTCDay() + 6) % 7; // Mon=0
  d.setUTCDate(d.getUTCDate() - dayNum + 3);
  const firstThursday = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  const week = 1 + Math.round(((d - firstThursday) / 86400000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

window.Core = {
  DC_CUTOFF, dcCode, dcCutoffMinutes, resolveCutoffMinutes, parseThaiDT, num, computeQty,
  buildLineItems, buildTrips, isoWeekKey,
};

;
(function(){
'use strict';

var THAI_MONTHS_ABBR = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
var STATUS_LABEL = { ontime:'Ontime', delay:'Delay', pending:'ยังไม่กลับเข้าคลัง', 'no-cutoff':'ไม่มีเวลาอ้างอิง' };
var STATUS_COLOR = { ontime:'#2F6F5E', delay:'#D64545', pending:'#64748B', 'no-cutoff':'#1D5FCC' };
var DC_PALETTE = ['#1D5FCC','#5B8DEF','#0B2A4A','#7FA8E8','#274B6D','#9FC1F2'];
var PRODUCT_LABEL = { 'แห้ง':'AB', 'เย็น':'CC' };
var PRODUCT_COLOR = { 'แห้ง':'#C2540A', 'เย็น':'#0B4F9C' };
var DC_DASH = [[], [6,3], [2,2], [8,3,2,3], [1,1], [10,2]];

var SHARE_ITEMS = [
  { key:'total',    icon:'🚚', label:'เที่ยวรถทั้งหมด' },
  { key:'ontime',   icon:'✅', label:'ตรงเวลา (Ontime)' },
  { key:'delay',    icon:'⏰', label:'ล่าช้า (Delay)' },
  { key:'pending',  icon:'⌛', label:'ยังไม่กลับเข้าคลัง' },
  { key:'ab',       icon:'📦', label:'สินค้า AB (แห้ง)' },
  { key:'cc',       icon:'❄️', label:'สินค้า CC (เย็น)' },
  { key:'points',   icon:'📍', label:'จุดเข้ารับเฉลี่ย/เที่ยว' },
  { key:'revenue',  icon:'💰', label:'รายได้รวม' },
];

var state = {
  rawRows: [],
  lineItems: [],
  trips: [],
  dcList: [],
  vehicleTypes: [],
  zoneList: [],
  selectedZone: '',
  selectedDC: '',
  dcGroupFilter: '',
  tripGroupFilter: '',
  productFilter: '',
  dateFrom: null,
  dateTo: null,
  granularity: 'day',
  delayChartDetailed: false,
  cmpBeforeFrom: null, cmpBeforeTo: null, cmpAfterFrom: null, cmpAfterTo: null,
  cmpZone: '', cmpDC: '', cmpProduct: '',
  statusFilter: new Set(['ontime','delay','pending']),
  tableStatusFilter: new Set(['ontime','delay','pending']),
  tableSearch: '',
  sortKey: 'dateKey',
  sortDir: 'desc',
  page: 1,
  pageSize: 25,
  viewOnly: false,
  isAdmin: false,
  expandedTrip: null,
  expandedZone: null,
  excludedCustomers: new Set(),   // applied (in-effect)
  draftExcludedCustomers: [],     // staged for editing in Settings tab
  draftDcCutoffs: {},             // staged { dcCode: { 'แห้ง':'HH:MM', 'เย็น':'HH:MM' } }
  shareSelected: new Set(SHARE_ITEMS.map(function(i){return i.key;})),
};

var charts = {};

// ---------- formatting helpers ----------
function fmtInt(n){ return Math.round(n||0).toLocaleString('th-TH'); }
function fmtBaht(n){ return '฿' + Math.round(n||0).toLocaleString('th-TH'); }
function fmtPct(n){ return (isFinite(n) ? (n*100).toFixed(1) : '0.0') + '%'; }
function pad2(n){ return String(n).padStart(2,'0'); }

function dateKeyToLabel(dateKey){
  if(!dateKey) return '-';
  var parts = dateKey.split('-').map(Number);
  var y = parts[0], m = parts[1], d = parts[2];
  return d + ' ' + THAI_MONTHS_ABBR[m-1] + ' ' + String((y+543)).slice(2);
}
function dateKeyToFullLabel(dateKey){
  if(!dateKey) return '-';
  var parts = dateKey.split('-').map(Number);
  var y = parts[0], m = parts[1], d = parts[2];
  return d + ' ' + THAI_MONTHS_ABBR[m-1] + ' ' + (y+543);
}

function dcShortLabel(full){
  return String(full||'').replace(/^\d+\s*/, '').replace(/^CDC\s*/,'').replace(/^DC\s*/,'').trim() || full;
}

function mondayOf(d){
  var dt = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  var day = dt.getDay();
  var diff = (day === 0 ? -6 : 1 - day);
  dt.setDate(dt.getDate() + diff);
  return dt;
}
function toDateKey(d){ return d.getFullYear() + '-' + pad2(d.getMonth()+1) + '-' + pad2(d.getDate()); }

function bucketOf(trip, granularity){
  if(!trip.dispatch) return null;
  var d = trip.dispatch.dateObj;
  if(granularity === 'hour'){
    var hh = trip.dispatch.hh;
    return { key: pad2(hh)+':00', label: pad2(hh)+':00', order: hh };
  }
  if(granularity === 'day'){
    if(d.getDay() === 0) return null; // Sunday is a day off - excluded from the working-day trend view
    return { key: trip.dateKey, label: dateKeyToLabel(trip.dateKey), order: trip.dispatch.ms };
  }
  if(granularity === 'week'){
    var mon = mondayOf(d);
    var sun = new Date(mon); sun.setDate(sun.getDate()+6);
    var label;
    if(mon.getMonth() === sun.getMonth()){
      label = mon.getDate() + '-' + sun.getDate() + ' ' + THAI_MONTHS_ABBR[mon.getMonth()];
    } else {
      label = mon.getDate() + ' ' + THAI_MONTHS_ABBR[mon.getMonth()] + '-' + sun.getDate() + ' ' + THAI_MONTHS_ABBR[sun.getMonth()];
    }
    return { key: toDateKey(mon), label: label, order: mon.getTime() };
  }
  var key = d.getFullYear() + '-' + pad2(d.getMonth()+1);
  var label = THAI_MONTHS_ABBR[d.getMonth()] + ' ' + (d.getFullYear()+543);
  return { key: key, label: label, order: new Date(d.getFullYear(), d.getMonth(), 1).getTime() };
}

function groupByBucket(trips, granularity){
  if(granularity === 'hour'){
    var hourMap = [];
    for(var h=0; h<24; h++) hourMap.push({ key: pad2(h)+':00', label: pad2(h)+':00', order: h, trips: [] });
    trips.forEach(function(t){
      if(!t.dispatch) return;
      hourMap[t.dispatch.hh].trips.push(t);
    });
    return hourMap;
  }
  var map = new Map();
  trips.forEach(function(t){
    var b = bucketOf(t, granularity);
    if(!b) return;
    if(!map.has(b.key)) map.set(b.key, { key:b.key, label:b.label, order:b.order, trips:[] });
    map.get(b.key).trips.push(t);
  });
  return Array.from(map.values()).sort(function(a,c){ return a.order - c.order; });
}

function effectiveGranularity(){
  return state.granularity; // [ปรับ 08/11/2569] กราฟแสดงช่วงก่อนหน้าด้วย จึงไม่สลับเป็นรายชั่วโมง
}

// ---------- data loading ----------
var SETTINGS_KEY = 'pickupDashboard.settings.v1';

function pad2Min(n){ return String(n).padStart(2,'0'); }
function minutesToTimeStr(min){ if(min===null||min===undefined) return '18:00'; var h=Math.floor(min/60), m=min%60; return pad2Min(h)+':'+pad2Min(m); }
function timeStrToMinutes(str){ if(!str) return null; var p=str.split(':').map(Number); return p[0]*60+(p[1]||0); }

function buildDefaultDcCutoffs(){
  var out = {};
  Object.keys(DC_DIRECTORY).forEach(function(code){
    var known = window.Core.DC_CUTOFF[code];
    var min = known ? (known.hh*60+known.mm) : 18*60;
    out[code] = { 'แห้ง': minutesToTimeStr(min), 'เย็น': minutesToTimeStr(min) };
  });
  return out;
}

function loadSettings(){
  var defaults = { excludedCustomers: [], dcCutoffs: buildDefaultDcCutoffs() };
  try{
    var parsed = (window.__PICKUP_DATA && window.__PICKUP_DATA.settings) || null;
    if(!parsed || (!parsed.excludedCustomers && !parsed.dcCutoffs)) return defaults;
    return {
      excludedCustomers: Array.isArray(parsed.excludedCustomers) ? parsed.excludedCustomers : [],
      dcCutoffs: Object.assign({}, defaults.dcCutoffs, parsed.dcCutoffs || {}),
    };
  } catch(e){ console.error('[dashboard] loadSettings failed:', e); return defaults; }
}

function saveSettings(settings){
  try{ if(window.__pickupSaveSettings) window.__pickupSaveSettings({ excludedCustomers: settings.excludedCustomers, dcCutoffs: settings.dcCutoffs }); }
  catch(e){ console.error('[dashboard] saveSettings failed:', e); }
}

function applySettingsToRuntime(settings){
  state.excludedCustomers = new Set(settings.excludedCustomers);
  CUTOFF_OVERRIDES = {};
  Object.keys(settings.dcCutoffs || {}).forEach(function(code){
    var row = settings.dcCutoffs[code];
    CUTOFF_OVERRIDES[code] = {
      'แห้ง': timeStrToMinutes(row['แห้ง']),
      'เย็น': timeStrToMinutes(row['เย็น']),
    };
  });
}

var ZONE_LOOKUP = {};
var DC_DIRECTORY = {}; // { dcCode: { name, zone } } - full list from Index.xlsx, not just DCs present in loaded data
var REPORT_END_DATE_KEY = null;
var CUTOFF_OVERRIDES = {}; // { dcCode: { 'แห้ง': minutes, 'เย็น': minutes } } - applied (in-effect) settings

// ===================== [ปรับ 16/11/2569] แผนเดิม / แผนใหม่ =====================
// แผนใหม่ = วัดเฉพาะสินค้าแห้งของลูกค้าในแผน (แท็บ Plan ใน Google Sheet) แบ่ง 2 กลุ่มตามที่แผนระบุ
//   กลุ่มทัน Cut off : เวลาตัดของ DC เดิม (ตามหน้าตั้งค่า) · กลุ่มตก Cut off : 20:00
//   1 เที่ยวอยู่กลุ่มทัน ถ้ามีลูกค้ากลุ่มทันอย่างน้อย 1 ราย · เที่ยวที่ไม่มีเวลากลับเลย = Delay
//   ช่อง AB/CC ทุกจุดแสดงเป็น กลุ่มทัน/กลุ่มตก · ลูกค้า AB นอกแผน และสินค้า CC ไม่นับ (ดูรายชื่อที่ ตั้งค่า → แผนลูกค้า)
var PLAN_START = '2026-11-16', PLAN_LATE_CUTOFF = 20 * 60;
var PLAN = { rows: [], map: new Map() };
function planNormCode(v){ return String(v === null || v === undefined ? '' : v).trim().replace(/\.0+$/, '').toUpperCase(); }
function planGroupOf(v){ return String(v || '').indexOf('ทัน') !== -1 ? 'ทัน' : 'ตก'; }
function loadPlan(rows){
  PLAN.rows = (rows || []).filter(function(r){ return r && r[1] !== '' && r[1] !== null && r[1] !== undefined; }).map(function(r){
    return { dc:String(r[0] || '').trim(), dcCode:dcCode(r[0]), code:planNormCode(r[1]), name:String(r[2] || ''), sub:String(r[3] || ''), district:String(r[4] || ''),
      zone:String(r[5] || ''), ctype:String(r[6] || ''), vtype:String(r[7] || ''), group:planGroupOf(r[8]), time:String(r[9] || '') };
  });
  PLAN.map = new Map(); PLAN.rows.forEach(function(p){ PLAN.map.set(p.dcCode + '|' + p.code, p); });
}
function planRowsOut(){ return PLAN.rows.map(function(p){ return [p.dc, p.code, p.name, p.sub, p.district, p.zone, p.ctype, p.vtype, p.group + ' Cut off', p.time]; }); }
function isNewPlan(){ return state.planMode === 'new' && PLAN.rows.length > 0; }
window.__pickupIsNewPlan = isNewPlan;
function planIsAB(li){ return li.productType === 'แห้ง' || (!li.productType && (li.dryBills + li.dryItems) > 0); }
function planOf(li){ return PLAN.map.get(li.dcCode + '|' + planNormCode(li.customerCode)) || null; }
function planLineItems(){
  var out = [];
  state.allLineItems.forEach(function(li){
    if(!planIsAB(li)) return;
    var p = planOf(li); if(!p) return;
    var c = Object.assign({}, li); c.plan = p;
    if(p.group === 'ตก'){ c.coldBills = li.dryBills; c.coldItems = li.dryItems; c.dryBills = 0; c.dryItems = 0; c.productType = 'เย็น'; }
    else { c.coldBills = 0; c.coldItems = 0; c.productType = 'แห้ง'; }
    out.push(c);
  });
  return out;
}
var PLAN_OPT = {
  product: function(items){ return items.some(function(i){ return i.plan && i.plan.group === 'ทัน'; }) ? 'แห้ง' : 'เย็น'; },
  cutoff: function(items, dc){ return PLAN_OPT.product(items) === 'แห้ง' ? resolveCutoffMinutes(dc, 'แห้ง', CUTOFF_OVERRIDES) : PLAN_LATE_CUTOFF; },
};
// ลูกค้า AB ที่ไม่อยู่ในแผน (รอผู้ดูแลระบุ) — ไม่นับในแผนใหม่
function planOutside(){
  var m = new Map();
  (state.allLineItems || []).forEach(function(li){
    if(!planIsAB(li) || planOf(li) || !li.dcCode) return;
    var k = li.dcCode + '|' + planNormCode(li.customerCode);
    if(!m.has(k)) m.set(k, { dc:li.dc, dcCode:li.dcCode, code:planNormCode(li.customerCode), name:li.customer || '', lines:0, bills:0, items:0, first:null, last:null });
    var o = m.get(k); o.lines++; o.bills += li.dryBills; o.items += li.dryItems;
    var d = li.dispatch && li.dispatch.dateKey; if(d){ if(!o.first || d < o.first) o.first = d; if(!o.last || d > o.last) o.last = d; }
  });
  return Array.from(m.values()).sort(function(a, b){ return b.lines - a.lines; });
}
// ป้ายกำกับ: แผนใหม่แสดง AB/CC เป็น กลุ่มทัน/กลุ่มตก (เฉพาะคำ AB/CC ที่ยืนเดี่ยว ไม่แตะรหัสลูกค้า เช่น BKK-CC-0001)
function planLabel(s){
  if(!isNewPlan() || typeof s !== 'string' || (s.indexOf('AB') === -1 && s.indexOf('CC') === -1 && s.indexOf('แห้ง') === -1 && s.indexOf('เย็น') === -1)) return s;
  return s.replace(/AB แห้ง/g, 'กลุ่มทัน').replace(/CC เย็น/g, 'กลุ่มตก').replace(/ประเภทสินค้า AB และ CC/g, 'กลุ่มทัน และ กลุ่มตก')
    .replace(/สินค้า AB \(แห้ง\)/g, 'กลุ่มทัน Cut off').replace(/สินค้า CC \(เย็น\)/g, 'กลุ่มตก Cut off')
    .replace(/AB \(แห้ง\)/g, 'กลุ่มทัน').replace(/CC \(เย็น\)/g, 'กลุ่มตก').replace(/สินค้า AB/g, 'กลุ่มทัน').replace(/สินค้า CC/g, 'กลุ่มตก')
    .replace(/(^|[\s(·\/:|,"'>])AB(?=$|[\s)·\/:|,"'<]|\d)/g, '$1กลุ่มทัน').replace(/(^|[\s(·\/:|,"'>])CC(?=$|[\s)·\/:|,"'<]|\d)/g, '$1กลุ่มตก');
}
window.__pickupPlanLabel = planLabel;
function planLabelRows(rows){ if(!isNewPlan()) return rows; return rows.map(function(r){ var o = {}; Object.keys(r).forEach(function(k){ o[planLabel(k)] = typeof r[k] === 'string' ? planLabel(r[k]) : r[k]; }); return o; }); }
var __planTextOrig = new WeakMap();
function planRelabelDom(root){
  root = root || document.getElementById('appRoot') || document.body;
  var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null), n, on = isNewPlan();
  while((n = w.nextNode())){
    var pe = n.parentNode; if(pe && (pe.nodeName === 'SCRIPT' || pe.nodeName === 'STYLE' || pe.nodeName === 'TEXTAREA' || (pe.closest && pe.closest('#tabSettings')))) continue;   // หน้าตั้งค่ายังเป็น AB/CC (เวลาตัดตามสินค้า)
    var orig = __planTextOrig.get(n);
    if(on){ var src = orig !== undefined ? orig : n.nodeValue, nv = planLabel(src); if(nv !== src){ if(orig === undefined) __planTextOrig.set(n, src); if(n.nodeValue !== nv) n.nodeValue = nv; } }
    else if(orig !== undefined){ n.nodeValue = orig; __planTextOrig.delete(n); }
  }
}
var __planObs = null;
function planObserve(){
  if(__planObs || typeof MutationObserver === 'undefined') return;
  var busy = false;
  __planObs = new MutationObserver(function(muts){
    if(busy || !isNewPlan()) return; busy = true;
    try{ muts.forEach(function(m){ if(m.type === 'characterData') planRelabelDom(m.target.parentNode || document.body); else m.addedNodes.forEach(function(nd){ if(nd.nodeType === 3) planRelabelDom(nd.parentNode); else if(nd.nodeType === 1) planRelabelDom(nd); }); }); }
    finally { busy = false; }
  });
  __planObs.observe(document.getElementById('appRoot') || document.body, { childList:true, subtree:true, characterData:true });
}

function rebuildTripsFromLineItems(){
  if(!state.allLineItems) state.allLineItems = state.lineItems || [];
  var opt = null;
  if(isNewPlan()){ state.lineItems = planLineItems(); opt = PLAN_OPT; } else state.lineItems = state.allLineItems;
  state.trips = window.Core.buildTrips(state.lineItems, REPORT_END_DATE_KEY, CUTOFF_OVERRIDES, state.excludedCustomers, opt);
  state.trips.forEach(function(t){ t.zone = ZONE_LOOKUP[t.dcCode] || 'ไม่ระบุภาค'; });
  state.lineItemTripMap = new Map();
  state.trips.forEach(function(t){ t.lineItemIdx.forEach(function(idx){ state.lineItemTripMap.set(idx, t); }); });

  var dcMap = new Map();
  var zoneSet = new Set();
  state.trips.forEach(function(t){
    if(!t.dc) return;
    if(!dcMap.has(t.dcCode)) dcMap.set(t.dcCode, { code:t.dcCode, full:t.dc, label:dcShortLabel(t.dc), zone:t.zone });
    zoneSet.add(t.zone);
  });
  state.dcList = Array.from(dcMap.values()).sort(function(a,b){ return a.code.localeCompare(b.code); });
  state.zoneList = Array.from(zoneSet).sort();

  var vtSet = new Set();
  state.trips.forEach(function(t){ if(t.vehicleType) vtSet.add(t.vehicleType); });
  state.vehicleTypes = Array.from(vtSet).sort();
}

var ALLOWED_DC_CODES = ['610','621','691']; // BKK scope only, per ops requirement
var ADMIN_PASSWORD_HASH = ''; // SHA-256 of the admin password (client-side gate only)
var ADMIN_SESSION_KEY = 'nimex-pickup-admin';
function __sha256(ascii){function r(v,a){return(v>>>a)|(v<<(32-a))}var mp=Math.pow,mw=mp(2,32),res='',w=[],bl=ascii.length*8,h=__sha256.h=__sha256.h||[],k=__sha256.k=__sha256.k||[],pl=k.length,ic={};for(var c=2;pl<64;c++){if(!ic[c]){for(var i=0;i<313;i+=c)ic[i]=c;h[pl]=(mp(c,.5)*mw)|0;k[pl++]=(mp(c,1/3)*mw)|0}}ascii=unescape(encodeURIComponent(ascii));bl=ascii.length*8;ascii+='\x80';while(ascii.length%64-56)ascii+='\x00';for(i=0;i<ascii.length;i++){var j=ascii.charCodeAt(i);w[i>>2]|=j<<((3-i)%4)*8}w[w.length]=((bl/mw)|0);w[w.length]=(bl);var hh=h.slice(0,8);for(j=0;j<w.length;){var ww=w.slice(j,j+=16),oh=hh;hh=hh.slice(0,8);for(i=0;i<64;i++){var w15=ww[i-15],w2=ww[i-2],a=hh[0],e=hh[4],t1=hh[7]+(r(e,6)^r(e,11)^r(e,25))+((e&hh[5])^((~e)&hh[6]))+k[i]+(ww[i]=(i<16)?ww[i]:(ww[i-16]+(r(w15,7)^r(w15,18)^(w15>>>3))+ww[i-7]+(r(w2,17)^r(w2,19)^(w2>>>10)))|0),t2=(r(a,2)^r(a,13)^r(a,22))+((a&hh[1])^(a&hh[2])^(hh[1]&hh[2]));hh=[(t1+t2)|0].concat(hh);hh[4]=(hh[4]+t1)|0}for(i=0;i<8;i++)hh[i]=(hh[i]+oh[i])|0}for(i=0;i<8;i++){for(j=3;j+1;j--){var b=(hh[i]>>(j*8))&255;res+=((b<16)?0:'')+b.toString(16)}}return res}

function processRawRows(rawRows){
  rawRows = rawRows.filter(function(r){
    var m = String(r.g||'').trim().match(/^(\d+)/);
    var code = m ? m[1] : '';
    return ALLOWED_DC_CODES.indexOf(code) !== -1;
  });
  state.rawRows = rawRows;
  state.allLineItems = window.Core.buildLineItems(rawRows);
  rebuildTripsFromLineItems();
  state.selectedZone = '';
  state.selectedDC = '';
  state.expandedZone = null;

  var dates = state.trips.filter(function(t){return t.dispatch;}).map(function(t){ return t.dateKey; });
  if(dates.length){
    state.dateFrom = dates.reduce(function(a,b){ return a<b?a:b; });
    state.dateTo = dates.reduce(function(a,b){ return a>b?a:b; });
  } else {
    state.dateFrom = null; state.dateTo = null;
  }
  state.productFilter = '';
  state.statusFilter = new Set(['ontime','delay','pending']);
  state.tableStatusFilter = new Set(['ontime','delay','pending']);
  state.page = 1;
}

// ---------- filtering ----------
function tripMatchesNonDateFilters(t){
  var f = state;
  if(f.selectedZone && t.zone !== f.selectedZone) return false;
  if(f.selectedDC && t.dcCode !== f.selectedDC) return false;
  if(f.dcGroupFilter === 'exclude691' && t.dcCode === '691') return false;
  if(f.tripGroupFilter === 'single' && t.tripGroupSize !== 1) return false;
  if(f.tripGroupFilter === 'multi' && t.tripGroupSize <= 1) return false;
  if(f.productFilter){
    if(!t.productTypes.length || t.productTypes.indexOf(f.productFilter) === -1) return false;
  }
  return true;
}

function tripsInRange(dateFrom, dateTo){
  return state.trips.filter(function(t){
    if(!tripMatchesNonDateFilters(t)) return false;
    if(dateFrom && (!t.dateKey || t.dateKey < dateFrom)) return false;
    if(dateTo && (!t.dateKey || t.dateKey > dateTo)) return false;
    var s = (t.status === 'no-cutoff') ? 'pending' : t.status;
    if(!state.statusFilter.has(s)) return false;
    return true;
  });
}

function applyFilters(){
  return tripsInRange(state.dateFrom, state.dateTo);
}

// Trip-detail table has its own independent status filter (does not affect KPIs/charts above).
function tripsInRangeForTable(dateFrom, dateTo){
  return state.trips.filter(function(t){
    if(!tripMatchesNonDateFilters(t)) return false;
    if(dateFrom && (!t.dateKey || t.dateKey < dateFrom)) return false;
    if(dateTo && (!t.dateKey || t.dateKey > dateTo)) return false;
    return true;
  });
}

// ---------- aggregate metrics (reused by KPI / compare / share) ----------
function productDashStyle(product){ return product === 'เย็น' ? [6,3] : []; }

function computeKPISet(trips){
  var total = trips.length;
  var counts = { ontime:0, delay:0, pending:0, 'no-cutoff':0 };
  var byProdStatus = { ontime:{'แห้ง':0,'เย็น':0}, delay:{'แห้ง':0,'เย็น':0}, pending:{'แห้ง':0,'เย็น':0} };
  var dryBills=0, dryItems=0, coldBills=0, coldItems=0, pointsSum=0, billsSum=0, piecesSum=0, revenue=0;
  var dryPointsSum=0, coldPointsSum=0, dryCount=0, coldCount=0, dryRevenue=0, coldRevenue=0;
  trips.forEach(function(t){
    var s = (t.status === 'no-cutoff') ? 'pending' : t.status;
    counts[t.status] = (counts[t.status]||0) + 1;
    if(byProdStatus[s] && t.dominantProduct){ byProdStatus[s][t.dominantProduct]++; }
    dryBills += t.dryBills; dryItems += t.dryItems;
    coldBills += t.coldBills; coldItems += t.coldItems;
    pointsSum += t.pickupPoints; billsSum += t.bills; piecesSum += t.pieces;
    revenue += t.revenue;
    if(t.dominantProduct === 'แห้ง'){ dryPointsSum += t.pickupPoints; dryCount++; dryRevenue += t.revenue; }
    else if(t.dominantProduct === 'เย็น'){ coldPointsSum += t.pickupPoints; coldCount++; coldRevenue += t.revenue; }
  });
  var pendingAll = counts.pending + (counts['no-cutoff']||0);
  return {
    total: total,
    ontime: counts.ontime, delay: counts.delay, pending: pendingAll,
    ontimeAB: byProdStatus.ontime['แห้ง'], ontimeCC: byProdStatus.ontime['เย็น'],
    delayAB: byProdStatus.delay['แห้ง'], delayCC: byProdStatus.delay['เย็น'],
    pendingAB: byProdStatus.pending['แห้ง'], pendingCC: byProdStatus.pending['เย็น'],
    totalAB: byProdStatus.ontime['แห้ง']+byProdStatus.delay['แห้ง']+byProdStatus.pending['แห้ง'],
    totalCC: byProdStatus.ontime['เย็น']+byProdStatus.delay['เย็น']+byProdStatus.pending['เย็น'],
    dryBills: dryBills, dryItems: dryItems, coldBills: coldBills, coldItems: coldItems,
    dryRevenue: dryRevenue, coldRevenue: coldRevenue,
    revenue: revenue, pieces: piecesSum, bills: billsSum,
    avgPoints: total ? pointsSum/total : 0,
    avgBills: total ? billsSum/total : 0,
    avgPieces: total ? piecesSum/total : 0,
    avgPointsAB: dryCount ? dryPointsSum/dryCount : 0,
    avgPointsCC: coldCount ? coldPointsSum/coldCount : 0,
    avgBillsAB: dryCount ? dryBills/dryCount : 0,
    avgBillsCC: coldCount ? coldBills/coldCount : 0,
    avgPiecesAB: dryCount ? dryItems/dryCount : 0,
    avgPiecesCC: coldCount ? coldItems/coldCount : 0,
    ontimePct: total ? counts.ontime/total : 0,
    delayPct: total ? counts.delay/total : 0,
    pendingPct: total ? pendingAll/total : 0,
  };
}

function diffPct(a,b){
  if(!b) return (a>0 ? Infinity : 0);
  return (a-b)/b;
}
function diffClass(d){ if(!isFinite(d) || Math.abs(d) < 0.001) return 'flat'; return d>0 ? 'up' : 'down'; }
// Some metrics are "better when lower" (trip count / Delay / Pending - fewer is good = green).
// Everything else defaults to "better when higher" (Ontime, revenue, bills, pieces).
var LOWER_IS_BETTER = { total:true, totalAB:true, totalCC:true, delay:true, delayAB:true, delayCC:true, pending:true, pendingAB:true, pendingCC:true };
function metricDiffClass(metricKey, d){
  if(!isFinite(d) || Math.abs(d) < 0.001) return 'flat';
  var isIncrease = d > 0;
  var lowerIsBetter = !!LOWER_IS_BETTER[metricKey];
  var isGood = lowerIsBetter ? !isIncrease : isIncrease;
  return isGood ? 'up' : 'down';
}
function diffLabel(d){
  if(!isFinite(d)) return '▲ ใหม่';
  if(Math.abs(d) < 0.001) return '– ไม่เปลี่ยนแปลง';
  var arrow = d>0 ? '▲' : '▼';
  return arrow + ' ' + Math.abs(d*100).toFixed(1) + '% เทียบช่วงที่เลือก';
}

// ---------- KPI ----------
function renderKPIs(trips){
  var k = computeKPISet(trips);
  document.querySelectorAll('.kpi-card[data-status]').forEach(function(card){
    card.classList.toggle('status-off', !state.statusFilter.has(card.dataset.status));
  });
  document.querySelectorAll('.status-filter-chip:not(.table-status-filter-chip)').forEach(function(chip){
    chip.classList.toggle('active', state.statusFilter.has(chip.dataset.status));
  });
  document.getElementById('kpiGrandTotal').textContent = fmtInt(k.total);

  document.getElementById('kpiOntime').textContent = fmtInt(k.ontime);
  document.getElementById('kpiOntimeSub').textContent = k.total ? fmtPct(k.ontimePct) + ' ของเที่ยวทั้งหมด' : '\u00a0';
  document.getElementById('kpiOntimeAB').textContent = fmtInt(k.ontimeAB);
  document.getElementById('kpiOntimeCC').textContent = fmtInt(k.ontimeCC);

  document.getElementById('kpiDelay').textContent = fmtInt(k.delay);
  document.getElementById('kpiDelaySub').textContent = k.total ? fmtPct(k.delayPct) + ' ของเที่ยวทั้งหมด' : '\u00a0';
  document.getElementById('kpiDelayAB').textContent = fmtInt(k.delayAB);
  document.getElementById('kpiDelayCC').textContent = fmtInt(k.delayCC);

  document.getElementById('kpiPending').textContent = fmtInt(k.pending);
  document.getElementById('kpiPendingSub').textContent = k.total ? fmtPct(k.pendingPct) + ' ของเที่ยวทั้งหมด' : '\u00a0';
  document.getElementById('kpiPendingAB').textContent = fmtInt(k.pendingAB);
  document.getElementById('kpiPendingCC').textContent = fmtInt(k.pendingCC);

  document.getElementById('kpiBills').textContent = fmtInt(k.bills);
  document.getElementById('kpiBillsAB').textContent = fmtInt(k.dryBills);
  document.getElementById('kpiBillsCC').textContent = fmtInt(k.coldBills);
  document.getElementById('kpiPieces').textContent = fmtInt(k.pieces);
  document.getElementById('kpiPiecesAB').textContent = fmtInt(k.dryItems);
  document.getElementById('kpiPiecesCC').textContent = fmtInt(k.coldItems);
  document.getElementById('kpiRevenue').textContent = fmtBaht(k.revenue);
  document.getElementById('kpiRevenueAB').textContent = fmtBaht(k.dryRevenue);
  document.getElementById('kpiRevenueCC').textContent = fmtBaht(k.coldRevenue);
  document.getElementById('kpiAvgPoints').textContent = fmtInt(k.avgPoints);
  document.getElementById('kpiAvgPointsAB').textContent = fmtInt(k.avgPointsAB);
  document.getElementById('kpiAvgPointsCC').textContent = fmtInt(k.avgPointsCC);
  document.getElementById('kpiAvgBills').textContent = fmtInt(k.avgBills);
  document.getElementById('kpiAvgBillsAB').textContent = fmtInt(k.avgBillsAB);
  document.getElementById('kpiAvgBillsCC').textContent = fmtInt(k.avgBillsCC);
  document.getElementById('kpiAvgPieces').textContent = fmtInt(k.avgPieces);
  document.getElementById('kpiAvgPiecesAB').textContent = fmtInt(k.avgPiecesAB);
  document.getElementById('kpiAvgPiecesCC').textContent = fmtInt(k.avgPiecesCC);

  return k;
}

// ---------- charts ----------
function ensureChart(id, config){
  if(typeof Chart === 'undefined'){ console.error('[dashboard] Chart.js not available, skipping ' + id); return null; }
  var el = document.getElementById(id);
  if(!el) return null;
  var ctx = el.getContext('2d');
  if(charts[id]) charts[id].destroy();
  if(DRILL_IDS[id]){ config.options = config.options || {}; config.options.onClick = function(e, els, ch){ if(els && els.length) drillByLabel(ch.data.labels[els[0].index]); }; config.options.onHover = function(e, els){ if(e.native && e.native.target) e.native.target.style.cursor = els.length ? 'pointer' : 'default'; }; }
  if(isNewPlan() && config.data){   // แผนใหม่: ชื่อชุดข้อมูล AB/CC -> กลุ่มทัน/กลุ่มตก
    (config.data.datasets || []).forEach(function(d){ if(typeof d.label === 'string') d.label = planLabel(d.label); });
    if(!DRILL_IDS[id] && Array.isArray(config.data.labels)) config.data.labels = config.data.labels.map(planLabel);
  }
  charts[id] = new Chart(ctx, config);
  return charts[id];
}

function baseFont(){ return { family: "'IBM Plex Sans Thai', sans-serif", size: 11 }; }

function renderOntimeTrend(trips){
  var buckets = groupByBucket(trips, effectiveGranularity());
  var labels = buckets.map(function(b){ return b.label; });

  function pctSeries(product){
    return buckets.map(function(b){
      var group = b.trips.filter(function(t){ return t.dominantProduct === product; });
      var n = group.length;
      if(!n) return null;
      var count = group.filter(function(t){ return t.status==='ontime'; }).length;
      return +(count/n*100).toFixed(1);
    });
  }

  ensureChart('chartOntimeTrend', {
    type:'line',
    data:{ labels: labels, datasets:[
      { label:'Ontime% (AB)', data: pctSeries('แห้ง'), borderColor: PRODUCT_COLOR['แห้ง'], backgroundColor: PRODUCT_COLOR['แห้ง'], tension:.25, pointRadius:3, spanGaps:true },
      { label:'Ontime% (CC)', data: pctSeries('เย็น'), borderColor: PRODUCT_COLOR['เย็น'], backgroundColor: PRODUCT_COLOR['เย็น'], tension:.25, pointRadius:3, spanGaps:true },
    ]},
    options:{ responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{ position:'bottom', labels:{ font: baseFont(), boxWidth:16 } } },
      scales:{ y:{ min:0, max:100, ticks:{ font: baseFont(), callback:function(v){return v+'%';} } }, x:{ ticks:{ font: baseFont() } } }
    }
  });
}

function renderDelayMinutesChart(trips){
  var delayTrips = trips.filter(function(t){ return t.status === 'delay' && t.delayMinutes !== null; });
  var buckets = groupByBucket(delayTrips, effectiveGranularity());
  var labels = buckets.map(function(b){ return b.label; });
  var datasets = [];

  if(!state.delayChartDetailed){
    ['แห้ง','เย็น'].forEach(function(product){
      datasets.push({
        label: PRODUCT_LABEL[product],
        data: buckets.map(function(b){
          var group = b.trips.filter(function(t){ return t.dominantProduct===product; });
          if(!group.length) return null;
          return +(group.reduce(function(s,t){ return s+t.delayMinutes; },0)/group.length).toFixed(0);
        }),
        borderColor: PRODUCT_COLOR[product],
        backgroundColor: PRODUCT_COLOR[product],
        tension:.25, pointRadius:3, spanGaps:true,
      });
    });
  } else {
    state.dcList.filter(function(d){ return !state.selectedDC || state.selectedDC === d.code; }).forEach(function(dc, i){
      ['แห้ง','เย็น'].forEach(function(product){
        datasets.push({
          label: dc.label + ' · ' + PRODUCT_LABEL[product],
          data: buckets.map(function(b){
            var group = b.trips.filter(function(t){ return t.dcCode===dc.code && t.dominantProduct===product; });
            if(!group.length) return null;
            return +(group.reduce(function(s,t){ return s+t.delayMinutes; },0)/group.length).toFixed(0);
          }),
          borderColor: PRODUCT_COLOR[product],
          backgroundColor: PRODUCT_COLOR[product],
          borderDash: DC_DASH[i % DC_DASH.length],
          tension:.25, pointRadius:3, spanGaps:true,
        });
      });
    });
  }

  ensureChart('chartDelayMinutes', {
    type:'line',
    data:{ labels: labels, datasets: datasets },
    options:{ responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{ position:'bottom', labels:{ font: baseFont(), boxWidth:16 } } },
      scales:{ y:{ ticks:{ font: baseFont(), callback:function(v){return v+' นาที';} } }, x:{ ticks:{ font: baseFont() } } }
    }
  });
}

function renderRevenuePieces(trips){
  var buckets = groupByBucket(trips, effectiveGranularity());
  var labels = buckets.map(function(b){ return b.label; });
  function sumBy(field, product){
    return buckets.map(function(b){
      var group = b.trips.filter(function(t){ return t.dominantProduct === product; });
      if(!group.length) return null; // no data at all for this point - leave a gap, not a false zero
      return group.reduce(function(s,t){ return s+t[field]; },0);
    });
  }
  ensureChart('chartRevenuePieces', {
    type:'line',
    data:{ labels: labels, datasets:[
      { label:'รายได้ AB (บาท)', data: sumBy('revenue','แห้ง'), borderColor: PRODUCT_COLOR['แห้ง'], backgroundColor: PRODUCT_COLOR['แห้ง'], yAxisID:'y', tension:.25, pointRadius:3, spanGaps:true },
      { label:'รายได้ CC (บาท)', data: sumBy('revenue','เย็น'), borderColor: PRODUCT_COLOR['เย็น'], backgroundColor: PRODUCT_COLOR['เย็น'], yAxisID:'y', tension:.25, pointRadius:3, spanGaps:true },
    ]},
    options:{ responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{ position:'bottom', labels:{ font: baseFont(), boxWidth:16 } } },
      scales:{
        y:{ position:'left', ticks:{ font: baseFont(), callback:function(v){ return '฿'+(v/1000).toFixed(0)+'k'; } } },
        x:{ ticks:{ font: baseFont() } }
      }
    }
  });
}

// ---------- table ----------
function tripArriveTimeLabel(t){
  if(!t.arriveDC) return '-';
  var s = pad2(t.arriveDC.hh) + ':' + pad2(t.arriveDC.mi);
  if(t.dateKey && t.arriveDC.dateKey !== t.dateKey) s += ' (+1d)';
  return s;
}

function sortTrips(trips){
  var key = state.sortKey, dir = state.sortDir === 'asc' ? 1 : -1;
  var arr = trips.slice();
  arr.sort(function(a,b){
    var av, bv;
    if(key === 'arriveDCTime'){ av = a.arriveDC?a.arriveDC.ms:-Infinity; bv = b.arriveDC?b.arriveDC.ms:-Infinity; }
    else if(key === 'dateKey'){ av = a.dispatch?a.dispatch.ms:-Infinity; bv = b.dispatch?b.dispatch.ms:-Infinity; }
    else if(key === 'dc'){ av = a.dc||''; bv = b.dc||''; }
    else if(key === 'status'){ av = a.status; bv = b.status; }
    else { av = a[key]; bv = b[key]; }
    if(av < bv) return -1*dir;
    if(av > bv) return 1*dir;
    return 0;
  });
  return arr;
}

function tableFilteredTrips(baseTrips){
  var q = state.tableSearch.toLowerCase();
  return baseTrips.filter(function(t){
    var s = (t.status === 'no-cutoff') ? 'pending' : t.status;
    if(!state.tableStatusFilter.has(s)) return false;
    if(!q) return true;
    var hay = (t.plate + ' ' + t.customers.join(' ') + ' ' + t.routes.join(' ')).toLowerCase();
    return hay.indexOf(q) !== -1;
  });
}

function renderTable(baseTrips){
  document.querySelectorAll('.table-status-filter-chip').forEach(function(chip){
    chip.classList.toggle('active', state.tableStatusFilter.has(chip.dataset.status));
  });
  var filtered = tableFilteredTrips(baseTrips);
  var sorted = sortTrips(filtered);
  var totalPages = Math.max(1, Math.ceil(sorted.length / state.pageSize));
  if(state.page > totalPages) state.page = totalPages;
  var start = (state.page-1)*state.pageSize;
  var pageRows = sorted.slice(start, start+state.pageSize);

  var tbody = document.getElementById('tableBody');
  tbody.innerHTML = '';
  document.getElementById('emptyState').style.display = sorted.length ? 'none' : 'block';

  pageRows.forEach(function(t){
    var tr = document.createElement('tr');
    tr.innerHTML =
      '<td>' + dateKeyToLabel(t.dateKey) + '</td>' +
      '<td>' + dcShortLabel(t.dc) + '</td>' +
      '<td class="mono">' + (t.plate||'-') + '</td>' +
      '<td>' + t.tripNo + '</td>' +
      '<td>' + (t.vehicleType||'-') + '</td>' +
      '<td>' + (t.dominantProduct ? '<span class="product-tag tag-'+(t.dominantProduct==='แห้ง'?'ab':'cc')+(t.productInferred?' inferred" title="เที่ยวนี้ไม่มีข้อมูลบิล/ชิ้น ใช้สินค้าจากประวัติทะเบียน (ไม่มีประวัติ = AB)':'')+'">'+PRODUCT_LABEL[t.dominantProduct]+(t.productInferred?'*':'')+'</span>' : '-') + '</td>' +
      '<td>' + t.pickupPoints + '</td>' +
      '<td class="tabnum">' + fmtInt(t.bills) + '</td>' +
      '<td class="tabnum">' + fmtInt(t.pieces) + '</td>' +
      '<td class="tabnum">' + fmtBaht(t.revenue) + '</td>' +
      '<td class="mono">' + tripArriveTimeLabel(t) + '</td>' +
      '<td><span class="status-tag ' + t.status + '">' + STATUS_LABEL[t.status] + '</span></td>';
    tr.addEventListener('click', function(){
      state.expandedTrip = (state.expandedTrip === t.key) ? null : t.key;
      renderTable(baseTrips);
    });
    tbody.appendChild(tr);

    if(state.expandedTrip === t.key){
      var dtr = document.createElement('tr');
      dtr.className = 'detail-row';
      var td = document.createElement('td');
      td.colSpan = 12;
      var pillsHtml = t.customers.map(function(c){ return '<div class="detail-pill"><b>'+c+'</b>จุดเข้ารับ</div>'; }).join('');
      td.innerHTML =
        '<div style="margin-bottom:8px;font-size:11.5px;color:#5B6156;"><b>เลขที่จัดรถ:</b> <span class="mono">'+t.b+'</span> · <b>เส้นทาง:</b> '+(t.routes.join(', ')||'-')+' · <b>ประเภทรถ:</b> '+t.vehicleType+'</div>' +
        '<div style="margin-bottom:8px;font-size:11.5px;color:#5B6156;"><b>AB (แห้ง):</b> '+fmtInt(t.dryBills)+' บิล / '+fmtInt(t.dryItems)+' ชิ้น &nbsp;·&nbsp; <b>CC (เย็น):</b> '+fmtInt(t.coldBills)+' บิล / '+fmtInt(t.coldItems)+' ชิ้น</div>' +
        '<div class="detail-list">'+pillsHtml+'</div>';
      dtr.appendChild(td);
      tbody.appendChild(dtr);
    }
  });

  document.getElementById('tableMeta').textContent = 'พบ ' + fmtInt(sorted.length) + ' เที่ยว';

  var pag = document.getElementById('pagination');
  pag.innerHTML = '';
  var prevBtn = document.createElement('button');
  prevBtn.textContent = '‹ ก่อนหน้า';
  prevBtn.disabled = state.page<=1;
  prevBtn.onclick = function(){ state.page--; renderTable(baseTrips); };
  var nextBtn = document.createElement('button');
  nextBtn.textContent = 'ถัดไป ›';
  nextBtn.disabled = state.page>=totalPages;
  nextBtn.onclick = function(){ state.page++; renderTable(baseTrips); };
  var info = document.createElement('span');
  info.textContent = 'หน้า ' + state.page + ' / ' + totalPages;
  pag.appendChild(prevBtn); pag.appendChild(info); pag.appendChild(nextBtn);

  document.querySelectorAll('#dataTable thead th').forEach(function(th){
    th.classList.toggle('sorted', th.dataset.key === state.sortKey);
  });

  return sorted;
}

var lastFilteredForExport = [];
var lastPrimaryKpi = null;

// ---------- share summary ----------
function buildShareChecklist(){
  var wrap = document.getElementById('shareCheckList');
  wrap.innerHTML = '';
  SHARE_ITEMS.forEach(function(item){
    var label = document.createElement('label');
    label.className = 'share-check-item';
    var checked = state.shareSelected.has(item.key) ? 'checked' : '';
    label.innerHTML = '<input type="checkbox" data-key="'+item.key+'" '+checked+'><span class="ic">'+item.icon+'</span><span>'+item.label+'</span>';
    label.querySelector('input').addEventListener('change', function(e){
      if(e.target.checked) state.shareSelected.add(item.key); else state.shareSelected.delete(item.key);
      renderSharePreview();
    });
    wrap.appendChild(label);
  });
}

function buildShareText(){
  if(!lastPrimaryKpi) return '';
  var k = lastPrimaryKpi;
  var rangeLabel = state.dateFrom ? dateKeyToFullLabel(state.dateFrom) + ' – ' + dateKeyToFullLabel(state.dateTo) : '-';
  var dcLabel = state.selectedDC ? (state.dcList.find(function(d){return d.code===state.selectedDC;})||{}).label : 'ทุก DC';
  var lines = [];
  lines.push('📋 สรุปงานรถเข้ารับสินค้า');
  lines.push('📅 ช่วงข้อมูล: ' + rangeLabel);
  lines.push('🏭 DC: ' + dcLabel);
  lines.push('');
  SHARE_ITEMS.forEach(function(item){
    if(!state.shareSelected.has(item.key)) return;
    var line = '';
    switch(item.key){
      case 'total': line = item.icon+' เที่ยวรถทั้งหมด: '+fmtInt(k.total)+' เที่ยว'; break;
      case 'ontime': line = item.icon+' ตรงเวลา (Ontime): '+fmtInt(k.ontime)+' เที่ยว ('+fmtPct(k.ontimePct)+')'; break;
      case 'delay': line = item.icon+' ล่าช้า (Delay): '+fmtInt(k.delay)+' เที่ยว ('+fmtPct(k.delayPct)+')'; break;
      case 'pending': line = item.icon+' ยังไม่กลับเข้าคลัง: '+fmtInt(k.pending)+' เที่ยว ('+fmtPct(k.pendingPct)+')'; break;
      case 'ab': line = item.icon+' AB (แห้ง): '+fmtInt(k.dryBills)+' บิล / '+fmtInt(k.dryItems)+' ชิ้น'; break;
      case 'cc': line = item.icon+' CC (เย็น): '+fmtInt(k.coldBills)+' บิล / '+fmtInt(k.coldItems)+' ชิ้น'; break;
      case 'points': line = item.icon+' จุดเข้ารับเฉลี่ย/เที่ยว: '+k.avgPoints.toFixed(1)+' จุด'; break;
      case 'revenue': line = item.icon+' รายได้รวม: '+fmtBaht(k.revenue); break;
    }
    if(line) lines.push(line);
  });
  return lines.join('\n');
}

function renderSharePreview(){
  var text = buildShareText();
  document.getElementById('sharePreview').textContent = text || 'ไม่มีข้อมูลให้สรุป';
}

// ---------- zone summary ----------
function renderZoneSummary(trips){
  var zoneMap = new Map();
  trips.forEach(function(t){
    if(!zoneMap.has(t.zone)) zoneMap.set(t.zone, []);
    zoneMap.get(t.zone).push(t);
  });
  var zones = Array.from(zoneMap.keys()).sort();
  var tbody = document.getElementById('zoneTableBody');
  tbody.innerHTML = '';
  document.getElementById('zoneEmptyState').style.display = zones.length ? 'none' : 'block';

  zones.forEach(function(zone){
    var zTrips = zoneMap.get(zone);
    var k = computeKPISet(zTrips);
    var tr = document.createElement('tr');
    tr.innerHTML =
      '<td><b>' + zone + '</b></td>' +
      '<td class="tabnum">' + fmtInt(k.total) + '</td>' +
      '<td class="tabnum" style="color:var(--go);">' + fmtInt(k.ontime) + '</td>' +
      '<td class="tabnum" style="color:var(--stop);">' + fmtInt(k.delay) + '</td>' +
      '<td class="tabnum" style="color:var(--wait);">' + fmtInt(k.pending) + '</td>' +
      '<td class="tabnum">' + fmtBaht(k.revenue) + '</td>';
    tr.addEventListener('click', function(){
      state.expandedZone = (state.expandedZone === zone) ? null : zone;
      renderZoneSummary(trips);
    });
    tbody.appendChild(tr);

    if(state.expandedZone === zone){
      var dcMapInZone = new Map();
      zTrips.forEach(function(t){
        if(!dcMapInZone.has(t.dcCode)) dcMapInZone.set(t.dcCode, { label: dcShortLabel(t.dc), trips: [] });
        dcMapInZone.get(t.dcCode).trips.push(t);
      });
      var dtr = document.createElement('tr');
      dtr.className = 'detail-row';
      var td = document.createElement('td');
      td.colSpan = 6;
      var dcRows = Array.from(dcMapInZone.values()).sort(function(a,b){ return b.trips.length - a.trips.length; }).map(function(d){
        var dk = computeKPISet(d.trips);
        return '<tr>' +
          '<td><b>'+d.label+'</b></td>' +
          '<td class="tabnum">'+fmtInt(dk.total)+'</td>' +
          '<td class="tabnum" style="color:var(--go);">'+fmtInt(dk.ontime)+' ('+fmtPct(dk.ontimePct)+')</td>' +
          '<td class="tabnum" style="color:var(--stop);">'+fmtInt(dk.delay)+' ('+fmtPct(dk.delayPct)+')</td>' +
          '<td class="tabnum" style="color:var(--wait);">'+fmtInt(dk.pending)+' ('+fmtPct(dk.pendingPct)+')</td>' +
          '<td class="tabnum"><span class="product-ab">AB '+fmtInt(dk.dryBills)+'/'+fmtInt(dk.dryItems)+'</span> · <span class="product-cc">CC '+fmtInt(dk.coldBills)+'/'+fmtInt(dk.coldItems)+'</span></td>' +
          '<td class="tabnum">'+fmtBaht(dk.revenue)+'</td>' +
          '<td class="tabnum">'+fmtInt(dk.avgPoints)+'</td>' +
        '</tr>';
      }).join('');
      td.innerHTML =
        '<table class="compare"><thead><tr>' +
        '<th>DC</th><th>เที่ยว</th><th>Ontime</th><th>Delay</th><th>ยังไม่กลับ</th><th>บิล/ชิ้น (AB · CC)</th><th>รายได้</th><th>จุดเข้ารับเฉลี่ย</th>' +
        '</tr></thead><tbody>' + dcRows + '</tbody></table>';
      dtr.appendChild(td);
      tbody.appendChild(dtr);
    }
  });
}

// ---------- problems tab ----------
var HOUR_BUCKETS = [
  { label: '00:00-05:59', min:0, max:5 },
  { label: '06:00-11:59', min:6, max:11 },
  { label: '12:00-17:59', min:12, max:17 },
  { label: '18:00-23:59', min:18, max:23 },
];

function scopeTripsIgnoringStatus(){
  return state.trips.filter(function(t){
    if(!tripMatchesNonDateFilters(t)) return false;
    if(state.dateFrom && (!t.dateKey || t.dateKey < state.dateFrom)) return false;
    if(state.dateTo && (!t.dateKey || t.dateKey > state.dateTo)) return false;
    return true;
  });
}

function getProblemTrips(){
  return scopeTripsIgnoringStatus().filter(function(t){
    return t.status === 'delay' || t.status === 'pending' || t.status === 'no-cutoff';
  });
}

function rateTable(trips, keyFn){
  var map = new Map();
  trips.forEach(function(t){
    var k = keyFn(t) || 'ไม่ระบุ';
    if(!map.has(k)) map.set(k, { total:0, delay:0 });
    var row = map.get(k);
    row.total++;
    if(t.status === 'delay') row.delay++;
  });
  return Array.from(map.entries()).map(function(e){
    return { label: e[0], total: e[1].total, delay: e[1].delay, rate: e[1].total ? e[1].delay/e[1].total : 0 };
  }).sort(function(a,b){ return b.rate - a.rate; });
}

function hourBucketLabel(hh){
  var b = HOUR_BUCKETS.find(function(hb){ return hh >= hb.min && hh <= hb.max; });
  return b ? b.label : 'ไม่ระบุ';
}

// Dedicated 3-band scheme for the DC return-time root-cause analysis, per ops request.
// Anything earlier than 13:00 folds into the first band.
function returnTimeBandLabel(hh){
  if(hh < 15) return '13:00-14:59';
  if(hh < 17) return '15:00-16:59';
  return '17:00-21:59';
}

function renderProblemsTab(){
  var scopeTrips = scopeTripsIgnoringStatus();
  var problemTrips = getProblemTrips();

  var problemRevenue = problemTrips.reduce(function(s,t){ return s+t.revenue; },0);
  document.getElementById('probKpiTrips').textContent = fmtInt(problemTrips.length);
  document.getElementById('probKpiRevenue').textContent = fmtBaht(problemRevenue);

  // full secondary KPI row (same shape as main dashboard) computed over problem trips only
  var pk = computeKPISet(problemTrips);
  document.getElementById('probKpiBills').textContent = fmtInt(pk.bills);
  document.getElementById('probKpiBillsAB').textContent = fmtInt(pk.dryBills);
  document.getElementById('probKpiBillsCC').textContent = fmtInt(pk.coldBills);
  document.getElementById('probKpiPieces').textContent = fmtInt(pk.pieces);
  document.getElementById('probKpiPiecesAB').textContent = fmtInt(pk.dryItems);
  document.getElementById('probKpiPiecesCC').textContent = fmtInt(pk.coldItems);
  document.getElementById('probKpiRevenue2').textContent = fmtBaht(pk.revenue);
  document.getElementById('probKpiRevenueAB').textContent = fmtBaht(pk.dryRevenue);
  document.getElementById('probKpiRevenueCC').textContent = fmtBaht(pk.coldRevenue);
  document.getElementById('probKpiAvgPoints').textContent = fmtInt(pk.avgPoints);
  document.getElementById('probKpiAvgPointsAB').textContent = fmtInt(pk.avgPointsAB);
  document.getElementById('probKpiAvgPointsCC').textContent = fmtInt(pk.avgPointsCC);
  document.getElementById('probKpiAvgBills').textContent = fmtInt(pk.avgBills);
  document.getElementById('probKpiAvgBillsAB').textContent = fmtInt(pk.avgBillsAB);
  document.getElementById('probKpiAvgBillsCC').textContent = fmtInt(pk.avgBillsCC);
  document.getElementById('probKpiAvgPieces').textContent = fmtInt(pk.avgPieces);
  document.getElementById('probKpiAvgPiecesAB').textContent = fmtInt(pk.avgPiecesAB);
  document.getElementById('probKpiAvgPiecesCC').textContent = fmtInt(pk.avgPiecesCC);

  // customer aggregation at line-item level (accurate per-customer bills/pieces/revenue)
  var custMap = new Map();
  state.lineItems.forEach(function(li){
    var trip = state.lineItemTripMap.get(li.idx);
    if(!trip) return;
    if(!tripMatchesNonDateFilters(trip)) return;
    if(state.dateFrom && (!trip.dateKey || trip.dateKey < state.dateFrom)) return;
    if(state.dateTo && (!trip.dateKey || trip.dateKey > state.dateTo)) return;
    if(!(trip.status === 'delay' || trip.status === 'pending' || trip.status === 'no-cutoff')) return;
    var name = li.customer || 'ไม่ระบุชื่อ';
    if(state.excludedCustomers.has(name)) return; // customer has an agreed late-return exemption - not a problem to report
    if(!custMap.has(name)) custMap.set(name, { customer:name, bills:0, pieces:0, revenue:0, trips:new Set(), hasDelay:false, hasPending:false });
    var c = custMap.get(name);
    c.bills += li.dryBills + li.coldBills;
    c.pieces += li.dryItems + li.coldItems;
    c.revenue += li.revenue;
    c.trips.add(trip.key);
    if(trip.status === 'delay') c.hasDelay = true; else c.hasPending = true;
  });
  document.getElementById('probKpiCustomers').textContent = fmtInt(custMap.size);
  safeRun('renderProblemDeltas', function(){ renderProblemDeltas(); });

  var custList = Array.from(custMap.values())
    .filter(function(c){ return c.bills > 0 || c.pieces > 0 || c.revenue > 0; })
    .sort(function(a,b){ return b.revenue - a.revenue; });
  var q = (document.getElementById('probSearch').value || '').toLowerCase();
  if(q) custList = custList.filter(function(c){ return c.customer.toLowerCase().indexOf(q) !== -1; });

  var tbody = document.getElementById('probTableBody');
  tbody.innerHTML = '';
  document.getElementById('probEmptyState').style.display = custList.length ? 'none' : 'block';
  custList.forEach(function(c){
    var statusLabel = c.hasDelay && c.hasPending ? 'Delay + ยังไม่กลับ' : (c.hasDelay ? 'Delay' : 'ยังไม่กลับเข้าคลัง');
    var statusClass = c.hasDelay ? 'delay' : 'pending';
    var tr = document.createElement('tr');
    tr.innerHTML =
      '<td><b>'+c.customer+'</b></td>' +
      '<td class="tabnum">'+fmtInt(c.trips.size)+'</td>' +
      '<td class="tabnum">'+fmtInt(c.bills)+'</td>' +
      '<td class="tabnum">'+fmtInt(c.pieces)+'</td>' +
      '<td class="tabnum">'+fmtBaht(c.revenue)+'</td>' +
      '<td><span class="status-tag '+statusClass+'">'+statusLabel+'</span></td>';
    tr.addEventListener('click', function(){
      var next = tr.nextElementSibling;
      if(next && next.classList.contains('detail-row')){ next.remove(); return; }
      document.querySelectorAll('#probTableBody .detail-row').forEach(function(r){ r.remove(); });
      var dtr = document.createElement('tr');
      dtr.className = 'detail-row';
      var td = document.createElement('td');
      td.colSpan = 6;
      var tripRows = Array.from(c.trips).map(function(b){ return state.trips.find(function(t){ return t.key===b; }); }).filter(Boolean);
      td.innerHTML = '<div class="detail-list">' + tripRows.map(function(t){
        return '<div class="detail-pill"><b>'+dateKeyToLabel(t.dateKey)+' · '+dcShortLabel(t.dc)+'</b>' +
          'ทะเบียน '+t.plate+' · '+STATUS_LABEL[t.status]+' · '+fmtBaht(t.revenue)+'</div>';
      }).join('') + '</div>';
      dtr.appendChild(td);
      tr.parentNode.insertBefore(dtr, tr.nextSibling);
    });
    tbody.appendChild(tr);
  });
  document.getElementById('probTableMeta').textContent = 'พบ ' + fmtInt(custList.length) + ' ลูกค้า';

  // root cause breakdowns
  var byDC = rateTable(scopeTrips, function(t){ return dcShortLabel(t.dc); });
  var byReturnTime = rateTable(scopeTrips.filter(function(t){ return t.arriveDC; }), function(t){ return returnTimeBandLabel(t.arriveDC.hh); });
  var delayOnly = scopeTrips.filter(function(t){ return t.status === 'delay' && t.arriveDC; });
  var delayDensityMap = new Map();
  delayOnly.forEach(function(t){
    var k = returnTimeBandLabel(t.arriveDC.hh);
    delayDensityMap.set(k, (delayDensityMap.get(k)||0) + 1);
  });
  var delayDensity = Array.from(delayDensityMap.entries()).map(function(e){
    return { label: e[0], count: e[1], share: delayOnly.length ? e[1]/delayOnly.length : 0 };
  }).sort(function(a,b){ return b.count - a.count; });

  function fillRateTable(tbodyId, rows){
    var tb = document.querySelector('#'+tbodyId+' tbody');
    tb.innerHTML = rows.map(function(r){
      return '<tr><td>'+r.label+'</td><td class="tabnum">'+fmtInt(r.total)+'</td>' +
        '<td class="diffcell tabnum '+(r.rate>=0.5?'down':(r.rate>=0.25?'flat':'up'))+'">'+fmtPct(r.rate)+'</td></tr>';
    }).join('');
  }
  fillRateTable('probByDCTable', byDC);
  fillRateTable('probByVehicleTable', byReturnTime);

  var tbDensity = document.querySelector('#probByHourTable tbody');
  tbDensity.innerHTML = delayDensity.map(function(r){
    return '<tr><td>'+r.label+'</td><td class="tabnum">'+fmtInt(r.count)+'</td>' +
      '<td class="diffcell tabnum '+(r.share>=0.4?'down':(r.share>=0.2?'flat':'up'))+'">'+fmtPct(r.share)+'</td></tr>';
  }).join('');

  var insightParts = [];
  if(byDC.length) insightParts.push('DC ที่มีอัตราล่าช้าสูงสุดคือ <b>'+byDC[0].label+'</b> ('+fmtPct(byDC[0].rate)+' จาก '+fmtInt(byDC[0].total)+' เที่ยว)');
  if(byReturnTime.length) insightParts.push('ช่วงเวลากลับเข้า DC ที่มีอัตราล่าช้าสูงสุดคือ <b>'+byReturnTime[0].label+' น.</b> ('+fmtPct(byReturnTime[0].rate)+')');
  if(delayDensity.length) insightParts.push('เที่ยว Delay กระจุกตัวมากที่สุดในช่วง <b>'+delayDensity[0].label+' น.</b> (คิดเป็น '+fmtPct(delayDensity[0].share)+' ของเที่ยว Delay ทั้งหมด)');
  document.getElementById('probInsightText').innerHTML = insightParts.length
    ? insightParts.join(' · ') + ' — ควรตรวจสอบปัจจัยเหล่านี้เป็นลำดับแรก'
    : 'ไม่มีข้อมูลเพียงพอสำหรับการวิเคราะห์ในตัวกรองปัจจุบัน';
}

function exportProblemCustomers(){
  if(typeof XLSX === 'undefined'){ showToast('ไม่พบไลบรารี Excel export'); return; }
  var rows = [];
  document.querySelectorAll('#probTableBody tr:not(.detail-row)').forEach(function(tr){
    var cells = tr.querySelectorAll('td');
    if(!cells.length) return;
    rows.push({
      'ลูกค้า': cells[0].textContent,
      'จำนวนเที่ยวที่กระทบ': cells[1].textContent,
      'บิล': cells[2].textContent,
      'กล่อง/ชิ้น': cells[3].textContent,
      'มูลค่า (บาท)': cells[4].textContent,
      'สถานะหลัก': cells[5].textContent,
    });
  });
  rows = planLabelRows(rows);
  var ws = XLSX.utils.json_to_sheet(rows);
  var wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'CustomersAffected');
  XLSX.writeFile(wb, 'ลูกค้าที่ได้รับผลกระทบ.xlsx');
  showToast('ส่งออกไฟล์แล้ว');
}

// ---------- comparison tab ----------
function diffLabelShort(d){
  if(!isFinite(d)) return '▲ ใหม่';
  if(Math.abs(d) < 0.001) return '– เท่าเดิม';
  return (d>0?'▲ ':'▼ ') + Math.abs(d*100).toFixed(1) + '%';
}

function populateSelect(id, list, getVal, getLabel, current){
  var sel = document.getElementById(id);
  sel.innerHTML = '<option value="">ทั้งหมด</option>';
  list.forEach(function(item){
    var o = document.createElement('option');
    o.value = getVal(item); o.textContent = getLabel(item);
    sel.appendChild(o);
  });
  sel.value = current || '';
}

function cmpTripsInRange(from, to){
  return state.trips.filter(function(t){
    if(state.cmpZone && t.zone !== state.cmpZone) return false;
    if(state.cmpDC && t.dcCode !== state.cmpDC) return false;
    if(state.cmpProduct && (!t.productTypes.length || t.productTypes.indexOf(state.cmpProduct) === -1)) return false;
    if(from && (!t.dateKey || t.dateKey < from)) return false;
    if(to && (!t.dateKey || t.dateKey > to)) return false;
    return true;
  });
}

function setComparePreset(kind){
  return setComparePresetEqual(kind); // [ปรับ 08/11/2569] วันทำการเท่ากัน
  var dateKeys = Array.from(new Set(state.trips.filter(function(t){return t.dateKey;}).map(function(t){return t.dateKey;}))).sort();
  if(!dateKeys.length) return;
  var latest = dateKeys[dateKeys.length-1];
  var latestDate = parseDateKeyLocal(latest);

  if(kind === 'yday'){
    var prevKey = dateKeys.length>1 ? dateKeys[dateKeys.length-2] : latest;
    state.cmpBeforeFrom = prevKey; state.cmpBeforeTo = prevKey;
    state.cmpAfterFrom = latest; state.cmpAfterTo = latest;
  } else if(kind === 'week'){
    var curMon = mondayOf(latestDate);
    var curSun = new Date(curMon); curSun.setDate(curSun.getDate()+6);
    var prevMon = new Date(curMon); prevMon.setDate(prevMon.getDate()-7);
    var prevSun = new Date(curMon); prevSun.setDate(prevSun.getDate()-1);
    state.cmpBeforeFrom = toDateKey(prevMon); state.cmpBeforeTo = toDateKey(prevSun);
    state.cmpAfterFrom = toDateKey(curMon); state.cmpAfterTo = toDateKey(curSun);
  } else if(kind === 'month'){
    var y = latestDate.getFullYear(), m = latestDate.getMonth();
    var curFrom = new Date(y, m, 1), curTo = new Date(y, m+1, 0);
    var prevFrom = new Date(y, m-1, 1), prevTo = new Date(y, m, 0);
    state.cmpBeforeFrom = toDateKey(prevFrom); state.cmpBeforeTo = toDateKey(prevTo);
    state.cmpAfterFrom = toDateKey(curFrom); state.cmpAfterTo = toDateKey(curTo);
  }
  syncCompareDateInputs();
  renderCompareTab();
}

function syncCompareDateInputs(){
  document.getElementById('cmpBeforeFrom').value = state.cmpBeforeFrom || '';
  document.getElementById('cmpBeforeTo').value = state.cmpBeforeTo || '';
  document.getElementById('cmpAfterFrom').value = state.cmpAfterFrom || '';
  document.getElementById('cmpAfterTo').value = state.cmpAfterTo || '';
}

var CMP_KPI_ITEMS = [
  { key:'total', label:'เที่ยวรวม', cls:'total', fmt:fmtInt },
  { key:'ontime', label:'Ontime', cls:'ontime', fmt:fmtInt },
  { key:'delay', label:'Delay', cls:'delay', fmt:fmtInt },
  { key:'pending', label:'ยังไม่กลับ', cls:'pending', fmt:fmtInt },
];

var lastCompareData = null;

function renderCompareTab(){
  var beforeTrips = cmpTripsInRange(state.cmpBeforeFrom, state.cmpBeforeTo);
  var afterTrips = cmpTripsInRange(state.cmpAfterFrom, state.cmpAfterTo);
  var bef = computeKPISet(beforeTrips), aft = computeKPISet(afterTrips);
  lastCompareData = { bef:bef, aft:aft, beforeTrips:beforeTrips, afterTrips:afterTrips };

  var kpiRow = document.getElementById('cmpKpiRow');
  kpiRow.innerHTML = '';
  CMP_KPI_ITEMS.forEach(function(item){
    var d = diffPct(aft[item.key], bef[item.key]);
    var dAB = diffPct(aft[item.key+'AB'], bef[item.key+'AB']);
    var dCC = diffPct(aft[item.key+'CC'], bef[item.key+'CC']);
    var badCls = metricDiffClass(item.key, d);
    var badClsAB = metricDiffClass(item.key+'AB', dAB);
    var badClsCC = metricDiffClass(item.key+'CC', dCC);
    var div = document.createElement('div');
    div.className = 'card kpi-card ' + (item.cls==='total'?'':item.cls);
    div.innerHTML =
      '<div class="kpi-label">'+item.label+'</div>' +
      '<div style="display:flex;gap:14px;align-items:baseline;justify-content:center;margin-top:4px;">' +
        '<div><div style="font-size:10px;color:#8A93A6;font-weight:700;">Before</div><div class="kpi-value tabnum" style="font-size:38px;color:#8A93A6;">'+fmtInt(bef[item.key])+'</div></div>' +
        '<div style="font-size:20px;color:var(--hairline-strong);">→</div>' +
        '<div><div style="font-size:10px;color:#8A93A6;font-weight:700;">After</div><div class="kpi-value tabnum" style="font-size:38px;">'+fmtInt(aft[item.key])+'</div></div>' +
      '</div>' +
      '<div class="kpi-diff '+badCls+'" style="margin-top:8px;">'+diffLabelShort(d)+' (รวม)</div>' +
      '<div class="kpi-breakdown">' +
        '<div class="bd-item"><span class="bd-label product-ab">AB</span><span class="bd-value tabnum product-ab" style="font-size:14px;">'+fmtInt(bef[item.key+'AB'])+'→'+fmtInt(aft[item.key+'AB'])+'</span><span class="kpi-diff '+badClsAB+'" style="font-size:10px;">'+diffLabelShort(dAB)+'</span></div>' +
        '<div class="bd-item"><span class="bd-label product-cc">CC</span><span class="bd-value tabnum product-cc" style="font-size:14px;">'+fmtInt(bef[item.key+'CC'])+'→'+fmtInt(aft[item.key+'CC'])+'</span><span class="kpi-diff '+badClsCC+'" style="font-size:10px;">'+diffLabelShort(dCC)+'</span></div>' +
      '</div>';
    kpiRow.appendChild(div);
  });

  ensureChart('chartCompareStatus', {
    type:'bar',
    data:{ labels:['Ontime','Delay','ยังไม่กลับ'], datasets:[
      { label:'Before', data:[bef.ontime,bef.delay,bef.pending], backgroundColor:'#B7C6DC' },
      { label:'After', data:[aft.ontime,aft.delay,aft.pending], backgroundColor:'#1D5FCC' },
    ]},
    options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{position:'bottom',labels:{font:baseFont()}}}, scales:{x:{ticks:{font:baseFont()}},y:{ticks:{font:baseFont()}}} }
  });
  ensureChart('chartCompareRevenue', {
    type:'bar',
    data:{ labels:['Before','After'], datasets:[
      { label:'AB', data:[bef.dryRevenue,aft.dryRevenue], backgroundColor: PRODUCT_COLOR['แห้ง'] },
      { label:'CC', data:[bef.coldRevenue,aft.coldRevenue], backgroundColor: PRODUCT_COLOR['เย็น'] },
    ]},
    options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{position:'bottom',labels:{font:baseFont()}}},
      scales:{x:{ticks:{font:baseFont()}},y:{ticks:{font:baseFont(),callback:function(v){return '฿'+(v/1000).toFixed(0)+'k';}}}} }
  });

  // per-DC table (overall + AB/CC) + biggest-change insight
  var dcMapBefore = new Map(), dcMapAfter = new Map();
  beforeTrips.forEach(function(t){ if(!dcMapBefore.has(t.dcCode)) dcMapBefore.set(t.dcCode, []); dcMapBefore.get(t.dcCode).push(t); });
  afterTrips.forEach(function(t){ if(!dcMapAfter.has(t.dcCode)) dcMapAfter.set(t.dcCode, []); dcMapAfter.get(t.dcCode).push(t); });
  var allDcCodes = Array.from(new Set(Array.from(dcMapBefore.keys()).concat(Array.from(dcMapAfter.keys()))));
  var dcRows = allDcCodes.map(function(code){
    var dcInfo = state.dcList.find(function(d){return d.code===code;});
    var kb = computeKPISet(dcMapBefore.get(code)||[]), ka = computeKPISet(dcMapAfter.get(code)||[]);
    var d = diffPct(ka.ontimePct, kb.ontimePct);
    return {
      label: dcInfo?dcInfo.label:code,
      totalBefore:kb.total, totalAfter:ka.total,
      abBefore:kb.totalAB, abAfter:ka.totalAB,
      ccBefore:kb.totalCC, ccAfter:ka.totalCC,
      ontimeBefore:kb.ontimePct, ontimeAfter:ka.ontimePct,
      diff:d, totalDiff: diffPct(ka.total, kb.total), abDiff: diffPct(ka.totalAB, kb.totalAB), ccDiff: diffPct(ka.totalCC, kb.totalCC),
    };
  }).sort(function(x,y){ return Math.abs(y.diff)-Math.abs(x.diff); });

  var tbody = document.getElementById('cmpDcTableBody');
  tbody.innerHTML = dcRows.map(function(r){
    return '<tr><td>'+r.label+'</td>' +
      '<td class="tabnum">'+fmtInt(r.totalBefore)+'</td><td class="tabnum">'+fmtInt(r.totalAfter)+'</td>' +
      '<td class="diffcell tabnum '+metricDiffClass('total', r.totalDiff)+'">'+diffLabelShort(r.totalDiff)+'</td>' +
      '<td class="tabnum product-ab">'+fmtInt(r.abBefore)+'</td><td class="tabnum product-ab">'+fmtInt(r.abAfter)+'</td>' +
      '<td class="diffcell tabnum '+metricDiffClass('totalAB', r.abDiff)+'">'+diffLabelShort(r.abDiff)+'</td>' +
      '<td class="tabnum product-cc">'+fmtInt(r.ccBefore)+'</td><td class="tabnum product-cc">'+fmtInt(r.ccAfter)+'</td>' +
      '<td class="diffcell tabnum '+metricDiffClass('totalCC', r.ccDiff)+'">'+diffLabelShort(r.ccDiff)+'</td>' +
      '<td class="tabnum">'+fmtPct(r.ontimeBefore)+'</td><td class="tabnum">'+fmtPct(r.ontimeAfter)+'</td>' +
      '<td class="diffcell tabnum '+metricDiffClass('ontime', r.diff)+'">'+diffLabelShort(r.diff)+'</td></tr>';
  }).join('');

  // insight: top 3 biggest changes across trip total, ontime%, revenue, AB/CC, and DCs
  var candidates = [];
  candidates.push({ label:'เที่ยวรวม', d: diffPct(aft.total,bef.total) });
  candidates.push({ label:'Ontime%', d: diffPct(aft.ontimePct,bef.ontimePct) });
  candidates.push({ label:'รายได้รวม', d: diffPct(aft.revenue,bef.revenue) });
  candidates.push({ label:'รายได้ AB', d: diffPct(aft.dryRevenue,bef.dryRevenue) });
  candidates.push({ label:'รายได้ CC', d: diffPct(aft.coldRevenue,bef.coldRevenue) });
  dcRows.forEach(function(r){ candidates.push({ label:'DC '+r.label+' (Ontime%)', d:r.diff }); });
  candidates = candidates.filter(function(c){ return isFinite(c.d); }).sort(function(x,y){ return Math.abs(y.d)-Math.abs(x.d); }).slice(0,3);

  var befLabel = state.cmpBeforeFrom ? dateKeyToFullLabel(state.cmpBeforeFrom)+(state.cmpBeforeFrom!==state.cmpBeforeTo?' – '+dateKeyToFullLabel(state.cmpBeforeTo):'') : '-';
  var aftLabel = state.cmpAfterFrom ? dateKeyToFullLabel(state.cmpAfterFrom)+(state.cmpAfterFrom!==state.cmpAfterTo?' – '+dateKeyToFullLabel(state.cmpAfterTo):'') : '-';
  var insightHtml = '<b>⏮️ Before: '+befLabel+'</b> → <b>⏭️ After: '+aftLabel+'</b><br>';
  if(candidates.length){
    insightHtml += 'จุดที่เปลี่ยนแปลงมากที่สุด: ' + candidates.map(function(c){ return c.label+' '+diffLabelShort(c.d); }).join(' · ');
  } else {
    insightHtml += 'ไม่มีข้อมูลเพียงพอสำหรับเปรียบเทียบ';
  }
  document.getElementById('cmpInsightBox').innerHTML = insightHtml;
}

function buildCompareShareText(){
  if(!lastCompareData) return '';
  var bef = lastCompareData.bef, aft = lastCompareData.aft;
  var befLabel = state.cmpBeforeFrom ? dateKeyToFullLabel(state.cmpBeforeFrom)+(state.cmpBeforeFrom!==state.cmpBeforeTo?' – '+dateKeyToFullLabel(state.cmpBeforeTo):'') : '-';
  var aftLabel = state.cmpAfterFrom ? dateKeyToFullLabel(state.cmpAfterFrom)+(state.cmpAfterFrom!==state.cmpAfterTo?' – '+dateKeyToFullLabel(state.cmpAfterTo):'') : '-';
  var lines = [];
  lines.push('🔀 เปรียบเทียบผลการดำเนินงาน');
  lines.push('⏮️ Before: '+befLabel+'   →   ⏭️ After: '+aftLabel);
  lines.push('');
  lines.push('🚚 เที่ยวรวม: '+fmtInt(bef.total)+' → '+fmtInt(aft.total)+' ('+diffLabelShort(diffPct(aft.total,bef.total))+')');
  lines.push('   AB: '+fmtInt(bef.totalAB)+' → '+fmtInt(aft.totalAB)+'   ·   CC: '+fmtInt(bef.totalCC)+' → '+fmtInt(aft.totalCC));
  lines.push('✅ Ontime: '+fmtInt(bef.ontime)+' → '+fmtInt(aft.ontime)+' ('+diffLabelShort(diffPct(aft.ontimePct,bef.ontimePct))+' pt)');
  lines.push('⏰ Delay: '+fmtInt(bef.delay)+' → '+fmtInt(aft.delay));
  lines.push('⌛ ยังไม่กลับ: '+fmtInt(bef.pending)+' → '+fmtInt(aft.pending));
  lines.push('💰 รายได้: '+fmtBaht(bef.revenue)+' → '+fmtBaht(aft.revenue)+' ('+diffLabelShort(diffPct(aft.revenue,bef.revenue))+')');
  lines.push('📦 AB: '+fmtInt(bef.dryBills)+'/'+fmtInt(bef.dryItems)+' → '+fmtInt(aft.dryBills)+'/'+fmtInt(aft.dryItems)+'  ('+fmtBaht(bef.dryRevenue)+' → '+fmtBaht(aft.dryRevenue)+')');
  lines.push('❄️ CC: '+fmtInt(bef.coldBills)+'/'+fmtInt(bef.coldItems)+' → '+fmtInt(aft.coldBills)+'/'+fmtInt(aft.coldItems)+'  ('+fmtBaht(bef.coldRevenue)+' → '+fmtBaht(aft.coldRevenue)+')');
  return lines.join('\n');
}

// ---------- settings tab ----------
function renderSettingsTab(){ __renderSettingsTabOrig(); afterSettingsRender(); }
function __renderSettingsTabOrig(){
  // customer exclusion chips
  var wrap = document.getElementById('settingsCustomerChips');
  wrap.innerHTML = '';
  if(!state.draftExcludedCustomers.length){
    wrap.innerHTML = '<span style="font-size:12px;color:#8A93A6;">ยังไม่มีลูกค้าที่ตั้งค่าไว้</span>';
  }
  state.draftExcludedCustomers.forEach(function(name, i){
    var chip = document.createElement('div');
    chip.className = 'chip active';
    chip.style.cssText = 'display:inline-flex;align-items:center;gap:6px;';
    chip.innerHTML = '<span>'+name+'</span><span style="cursor:pointer;font-weight:800;" data-i="'+i+'">✕</span>';
    chip.querySelector('span[data-i]').addEventListener('click', function(){
      state.draftExcludedCustomers.splice(i, 1);
      renderSettingsTab();
    });
    wrap.appendChild(chip);
  });

  // DC cutoff table
  var q = (document.getElementById('settingsDcSearch').value || '').toLowerCase();
  var tbody = document.getElementById('settingsDcTableBody');
  tbody.innerHTML = '';
  Object.keys(DC_DIRECTORY).sort().forEach(function(code){
    var dir = DC_DIRECTORY[code];
    var label = code + ' ' + dir.name;
    if(q && label.toLowerCase().indexOf(q) === -1) return;
    if(!state.draftDcCutoffs[code]) state.draftDcCutoffs[code] = { 'แห้ง':'18:00', 'เย็น':'18:00' };
    var row = state.draftDcCutoffs[code];
    var tr = document.createElement('tr');
    tr.innerHTML =
      '<td><b>'+code+'</b> '+dir.name+'</td>' +
      '<td>'+dir.zone+'</td>' +
      '<td><input type="time" class="dc-cutoff-input" data-code="'+code+'" data-product="แห้ง" value="'+row['แห้ง']+'" style="border:1px solid var(--hairline-strong);border-radius:5px;padding:4px 6px;font-size:12px;"></td>' +
      '<td><input type="time" class="dc-cutoff-input" data-code="'+code+'" data-product="เย็น" value="'+row['เย็น']+'" style="border:1px solid var(--hairline-strong);border-radius:5px;padding:4px 6px;font-size:12px;"></td>';
    tbody.appendChild(tr);
  });
  tbody.querySelectorAll('.dc-cutoff-input').forEach(function(inp){
    inp.addEventListener('change', function(){
      var code = inp.dataset.code, product = inp.dataset.product;
      if(!state.draftDcCutoffs[code]) state.draftDcCutoffs[code] = { 'แห้ง':'18:00', 'เย็น':'18:00' };
      state.draftDcCutoffs[code][product] = inp.value;
    });
  });
}

function applySettingsAndRecalculate(){
  var settings = {
    excludedCustomers: state.draftExcludedCustomers.slice(),
    dcCutoffs: JSON.parse(JSON.stringify(state.draftDcCutoffs)),
  };
  saveSettings(settings);
  applySettingsToRuntime(settings);
  rebuildTripsFromLineItems();
  buildZoneOptions();
  buildDCOptions();
  updateHeaderMeta();
  renderAll();
  if(document.getElementById('tabProblems').style.display !== 'none') renderProblemsTab();
  __custCache = null; afterSettingsRender();
  showToast('คำนวณผลใหม่เรียบร้อย ใช้การตั้งค่าล่าสุดแล้ว');
}

// ---------- master render ----------
function safeRun(label, fn){
  try { fn(); } catch(err){ console.error('[dashboard] ' + label + ' failed:', err); }
}

function renderAll(){
  var filtered = applyFilters();
  var tableScope = tripsInRangeForTable(state.dateFrom, state.dateTo);
  safeRun('renderKPIs', function(){ lastPrimaryKpi = renderKPIs(filtered); });
  safeRun('renderZoneSummary', function(){ renderZoneSummary(filtered); });
  safeRun('renderKpiCompare', function(){ renderKpiCompare(lastPrimaryKpi); });
  safeRun('renderDcSummary', function(){ renderDcSummary(filtered); });
  var chartTrips = chartWindowTrips();
  safeRun('renderOntimeTrend', function(){ renderOntimeTrend(chartTrips); });
  safeRun('renderDelayMinutesChart', function(){ renderDelayMinutesChart(chartTrips); });
  safeRun('renderRevenuePieces', function(){ renderRevenuePieces(chartTrips); });
  safeRun('renderPiecesChart', function(){ renderPiecesChart(chartTrips); });
  safeRun('renderPeriodPills', function(){ renderPeriodPills(); });
  safeRun('renderFilterChips', function(){ renderFilterChips(); });
  safeRun('renderAnalysis', function(){ renderAnalysis(); });
  safeRun('renderTable', function(){ lastFilteredForExport = renderTable(tableScope); });
  safeRun('renderSharePreview', function(){ renderSharePreview(); });
  document.getElementById('filterCount').textContent = fmtInt(filtered.length) + ' เที่ยว ตรงตามตัวกรอง';
  safeRun('renderPlanBoxes', function(){ renderPlanBoxes(filtered); });
}

// ---------- UI wiring ----------
function buildZoneOptions(){
  var sel = document.getElementById('fZone');
  sel.innerHTML = '<option value="">ทั้งหมด</option>';
  state.zoneList.forEach(function(z){
    var o = document.createElement('option');
    o.value = z; o.textContent = z;
    sel.appendChild(o);
  });
  sel.value = state.selectedZone;
  populateSelect('cmpZone', state.zoneList, function(z){return z;}, function(z){return z;}, state.cmpZone);
}

function buildDCOptions(){
  var sel = document.getElementById('fDC');
  sel.innerHTML = '<option value="">ทั้งหมด</option>';
  state.dcList.filter(function(dc){ return !state.selectedZone || dc.zone === state.selectedZone; }).forEach(function(dc){
    var o = document.createElement('option');
    o.value = dc.code; o.textContent = dc.label;
    sel.appendChild(o);
  });
  sel.value = state.selectedDC;
  populateSelect('cmpDC', state.dcList.filter(function(dc){ return !state.cmpZone || dc.zone === state.cmpZone; }), function(d){return d.code;}, function(d){return d.label;}, state.cmpDC);
}

function syncDateInputs(){
  document.getElementById('fDateFrom').value = state.dateFrom || '';
  document.getElementById('fDateTo').value = state.dateTo || '';
  document.getElementById('fGranularity').value = state.granularity;
  document.getElementById('fProduct').value = state.productFilter;
}

function formatThaiDateTime(d){
  var dd = String(d.getDate()).padStart(2,'0');
  var mm = String(d.getMonth()+1).padStart(2,'0');
  var yy = d.getFullYear()+543;
  var hh = String(d.getHours()).padStart(2,'0');
  var mi = String(d.getMinutes()).padStart(2,'0');
  var ss = String(d.getSeconds()).padStart(2,'0');
  return dd+'/'+mm+'/'+yy+' '+hh+':'+mi+':'+ss;
}

function updateHeaderMeta(){
  if(state.dateFrom && state.dateTo){
    document.getElementById('dataRangeLabel').textContent = dateKeyToFullLabel(state.dateFrom) + ' – ' + dateKeyToFullLabel(state.dateTo);
  } else {
    document.getElementById('dataRangeLabel').textContent = '–';
  }
  document.getElementById('scopeLabel').textContent = state.dcList.length + ' DC · ' + fmtInt(state.trips.length) + ' เที่ยว';
  document.getElementById('footerNote').textContent = 'ประมวลผลจาก ' + fmtInt(state.rawRows.length) + ' รายการรับสินค้า (บรรทัด) รวม ' + fmtInt(state.trips.length) + ' เที่ยวรถ';
  document.getElementById('generatedAtLabel').textContent = formatThaiDateTime(new Date());
}

function showToast(msg){
  var t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(function(){ t.classList.remove('show'); }, 3200);
}

function parseDateKeyLocal(s){ var p = s.split('-').map(Number); return new Date(p[0], p[1]-1, p[2]); }

function autoCompareRange(fromKey, toKey, granularity){
  if(!fromKey || !toKey) return { from:null, to:null };
  var from = parseDateKeyLocal(fromKey), to = parseDateKeyLocal(toKey);
  if(granularity === 'month'){
    var cFrom = new Date(from); cFrom.setMonth(cFrom.getMonth()-1);
    var cTo = new Date(to); cTo.setMonth(cTo.getMonth()-1);
    return { from: toDateKey(cFrom), to: toDateKey(cTo) };
  }
  var rangeDays = Math.round((to-from)/86400000)+1;
  var cTo2 = new Date(from); cTo2.setDate(cTo2.getDate()-1);
  var cFrom2 = new Date(cTo2); cFrom2.setDate(cFrom2.getDate()-(rangeDays-1));
  return { from: toDateKey(cFrom2), to: toDateKey(cTo2) };
}

// ===================== [เพิ่ม 08/11/2569] เทียบช่วงก่อน (วันทำการเท่ากัน) + ตารางราย DC + เทียบรายเดือนตาม DC =====================
// วันทำการ = จันทร์–เสาร์ (วันอาทิตย์ไม่นับ) — ข้อมูลจริงวันอาทิตย์มีแค่ราว 10 แถว/วัน
function isWorkDay(d){ return d.getDay() !== 0; }
function addDays(d, n){ var x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate()+n); return x; }
function countWorkDays(fromKey, toKey){
  if(!fromKey || !toKey) return 0;
  var d = parseDateKeyLocal(fromKey), e = parseDateKeyLocal(toKey), n = 0;
  while(d <= e){ if(isWorkDay(d)) n++; d = addDays(d,1); }
  return n;
}
function dataMinKey(){
  var m = null; state.trips.forEach(function(t){ if(t.dateKey && (!m || t.dateKey < m)) m = t.dateKey; }); return m;
}
function dataMaxKey(){
  var m = null; state.trips.forEach(function(t){ if(t.dateKey && (!m || t.dateKey > m)) m = t.dateKey; }); return m;
}
// take n working days starting at (or after) startDate; returns {from,to}
function takeWorkDays(startDate, n){
  var d = new Date(startDate), first = null, last = null, c = 0, guard = 0;
  while(c < n && guard < 800){ if(isWorkDay(d)){ if(!first) first = new Date(d); last = new Date(d); c++; } d = addDays(d,1); guard++; }
  return first ? { from: toDateKey(first), to: toDateKey(last) } : null;
}
// Previous comparable period, by the kit's rule:
//  day / week view  -> same weekdays shifted back by whole weeks (equal working days automatically)
//  month view       -> previous month(s), same working-day offset and the same number of working days
function previousPeriod(fromKey, toKey, gran){
  if(!fromKey || !toKey) return null;
  var from = parseDateKeyLocal(fromKey), to = parseDateKeyLocal(toKey);
  var n = countWorkDays(fromKey, toKey);
  if(!n) return null;
  if(gran === 'month'){
    var months = (to.getFullYear()-from.getFullYear())*12 + (to.getMonth()-from.getMonth()) + 1;
    var mStart = new Date(from.getFullYear(), from.getMonth(), 1);
    var offset = (from > mStart) ? countWorkDays(toDateKey(mStart), toDateKey(addDays(from, -1))) : 0;
    var pStart = new Date(from.getFullYear(), from.getMonth()-months, 1);
    var head = takeWorkDays(pStart, offset + 1);             // its .to = the (offset+1)-th working day
    if(!head) return null;
    var r = takeWorkDays(parseDateKeyLocal(head.to), n);
    if(!r) return null;
    r.n = n; return r;
  }
  var span = Math.round((to - from)/86400000) + 1;
  var shift = Math.ceil(span/7) * 7;
  return { from: toDateKey(addDays(from, -shift)), to: toDateKey(addDays(to, -shift)), n: n };
}
function shortRangeLabel(f, t){
  if(!f) return '-';
  return f === t ? dateKeyToFullLabel(f) : dateKeyToFullLabel(f) + ' – ' + dateKeyToFullLabel(t);
}

// ---------- KPI arrows vs previous period ----------
function cmpHtml(cur, prev, key, mode){
  // mode: 'pp' = percentage points of a rate, 'pct' = % change, 'abs' = count difference
  var d, txt;
  if(mode === 'pp'){ d = cur - prev; txt = Math.abs(d*100).toFixed(1) + ' จุด'; }
  else if(mode === 'abs'){ d = cur - prev; txt = fmtInt(Math.abs(d)); }
  else { d = diffPct(cur, prev); if(!isFinite(d)) return '<span class="flat">ช่วงก่อนเป็น 0</span>'; txt = Math.abs(d*100).toFixed(1) + '%'; }
  var cls = metricDiffClass(key, mode === 'pp' || mode === 'abs' ? d : d);
  if(Math.abs(d) < (mode === 'abs' ? 0.5 : 0.0005)) return '<span class="flat">– เท่าเดิม</span>';
  return '<span class="' + cls + '">' + (d > 0 ? '▲ ' : '▼ ') + txt + '</span>';
}
function renderKpiCompare(curK){
  var lbl = document.getElementById('kpiCmpLabel');
  var ids = ['kpiCmpTotal','kpiCmpOntime','kpiCmpDelay','kpiCmpPending','kpiCmpBills','kpiCmpPieces','kpiCmpRevenue','kpiCmpAvgPoints','kpiCmpAvgBills','kpiCmpAvgPieces'];
  var setAll = function(h){ ids.forEach(function(id){ var e = document.getElementById(id); if(e) e.innerHTML = h; }); };
  var p = previousPeriod(state.dateFrom, state.dateTo, state.granularity);
  var minK = dataMinKey();
  if(!p || !minK || p.from < minK){
    lbl.classList.add('admin-only'); lbl.classList.remove('hide-all');
    lbl.innerHTML = 'เทียบช่วงก่อน: <b>ไม่มีข้อมูลช่วงก่อนหน้า</b>' + (p ? ' (' + shortRangeLabel(p.from, p.to) + ')' : '') + ' · ลองเลือกช่วงที่สั้นลง หรือเปลี่ยนเป็นมุมมองเดือน';
    setAll('');
    return;
  }
  var prevK = computeKPISet(tripsInRange(p.from, p.to));
  lbl.classList.add('admin-only'); lbl.classList.add('hide-all');
  lbl.innerHTML = 'เทียบกับ <b>' + shortRangeLabel(p.from, p.to) + '</b> · ' + p.n + ' วันทำการเท่ากัน (จ.–ส.)';
  var set = function(id, h){ var e = document.getElementById(id); if(e) e.innerHTML = h; };
  set('kpiCmpTotal',   cmpHtml(curK.total, prevK.total, 'total', 'pct'));
  set('kpiCmpOntime',  cmpHtml(curK.ontimePct, prevK.ontimePct, 'ontime', 'pp'));
  set('kpiCmpDelay',   cmpHtml(curK.delayPct, prevK.delayPct, 'delay', 'pp'));
  set('kpiCmpPending', cmpHtml(curK.pending, prevK.pending, 'pending', 'abs'));
  set('kpiCmpBills',   cmpHtml(curK.bills, prevK.bills, 'bills', 'pct'));
  set('kpiCmpPieces',  cmpHtml(curK.pieces, prevK.pieces, 'pieces', 'pct'));
  set('kpiCmpRevenue', cmpHtml(curK.revenue, prevK.revenue, 'revenue', 'pct'));
  set('kpiCmpAvgPoints', cmpHtml(curK.avgPoints, prevK.avgPoints, 'avgPoints', 'pct'));
  set('kpiCmpAvgBills',  cmpHtml(curK.avgBills, prevK.avgBills, 'avgBills', 'pct'));
  set('kpiCmpAvgPieces', cmpHtml(curK.avgPieces, prevK.avgPieces, 'avgPieces', 'pct'));
}

// ---------- compare-tab presets: equal working days ----------
function setComparePresetEqual(kind){
  var latest = dataMaxKey(); if(!latest) return;
  var L = parseDateKeyLocal(latest);
  if(kind === 'yday'){
    var p = addDays(L, -7);
    state.cmpAfterFrom = latest; state.cmpAfterTo = latest;
    state.cmpBeforeFrom = toDateKey(p); state.cmpBeforeTo = toDateKey(p);
  } else if(kind === 'week'){
    var mon = mondayOf(L);
    state.cmpAfterFrom = toDateKey(mon); state.cmpAfterTo = latest;
    state.cmpBeforeFrom = toDateKey(addDays(mon, -7)); state.cmpBeforeTo = toDateKey(addDays(L, -7));
  } else if(kind === 'month'){
    var first = new Date(L.getFullYear(), L.getMonth(), 1);
    var n = countWorkDays(toDateKey(first), latest);
    var w = takeWorkDays(new Date(L.getFullYear(), L.getMonth()-1, 1), n);
    state.cmpAfterFrom = toDateKey(first); state.cmpAfterTo = latest;
    state.cmpBeforeFrom = w ? w.from : null; state.cmpBeforeTo = w ? w.to : null;
  }
  syncCompareDateInputs();
  renderCompareTab();
}

function wireExtra(){
  document.getElementById('dcTableHead').addEventListener('click', function(e){
    var th = e.target.closest('th[data-k]'); if(!th) return;
    var k = th.dataset.k;
    if(dcSort.key === k) dcSort.dir = -dcSort.dir; else { dcSort.key = k; dcSort.dir = (k === 'label' || k === 'zone') ? 1 : -1; }
    renderDcSummary(applyFilters());
  });
  document.getElementById('dcSearch').addEventListener('input', function(){ renderDcSummary(applyFilters()); });
  document.getElementById('dcTableBody').addEventListener('click', function(e){
    var tr = e.target.closest('tr[data-dc]'); if(!tr) return;
    var code = tr.dataset.dc, sel = document.getElementById('fDC');
    if(state.selectedZone){ var z = document.getElementById('fZone'); z.value = ''; z.dispatchEvent(new Event('change')); }
    sel.value = (state.selectedDC === code) ? '' : code;
    sel.dispatchEvent(new Event('change'));
  });
  wireSettings();
  wireAnalysis();
  wireShare();
}
// ===================== [ปรับ 08/11/2569] ปุ่ม วัน / สัปดาห์ / เดือน = เลือกช่วง + เทียบผลอัตโนมัติทุกส่วน =====================
// วัน    = วันล่าสุด (หรือวันที่เลือก) เทียบวันเดียวกันของสัปดาห์ก่อน
// สัปดาห์ = จันทร์–วันล่าสุดของสัปดาห์ เทียบช่วงวันเดียวกันของสัปดาห์ก่อน
// เดือน  = วันที่ 1–วันล่าสุดของเดือน เทียบเดือนก่อนด้วยจำนวนวันทำการเท่ากัน (จ.–ส.)
function periodRange(gran, anchorKey){
  var maxK = dataMaxKey(); if(!maxK) return null;
  var a = parseDateKeyLocal(anchorKey && anchorKey <= maxK ? anchorKey : maxK), from, to;
  if(gran === 'day'){ from = a; to = a; }
  else if(gran === 'week'){ from = mondayOf(a); to = addDays(from, 6); }
  else { from = new Date(a.getFullYear(), a.getMonth(), 1); to = new Date(a.getFullYear(), a.getMonth()+1, 0); }
  var f = toDateKey(from), t = toDateKey(to);
  if(t > maxK) t = maxK;
  var minK = dataMinKey(); if(minK && f < minK) f = minK;
  return { from: f, to: t };
}
function applyPeriod(gran, anchorKey){
  var r = periodRange(gran, anchorKey || state.dateTo);
  if(!r) return;
  state.granularity = gran;
  state.dateFrom = r.from; state.dateTo = r.to;
  state.page = 1;
  syncDateInputs();
  renderAll();
  if(document.getElementById('tabProblems').style.display !== 'none') renderProblemsTab();
}
window.__nimexPeriod = function(g){ applyPeriod(g); };

// charts show a trend window that ends at the selected period
function chartWindowTrips(){
  var to = state.dateTo; if(!to) return applyFilters();
  var T = parseDateKeyLocal(to), from;
  if(state.granularity === 'day') from = addDays(T, -20);                    // ~ 3 สัปดาห์ล่าสุด
  else if(state.granularity === 'week') from = addDays(mondayOf(T), -7*7);   // 8 สัปดาห์ล่าสุด
  else from = new Date(T.getFullYear(), T.getMonth()-11, 1);                 // 12 เดือนล่าสุด
  return tripsInRange(toDateKey(from), to);
}
function chartDrill(bucket){
  if(!bucket || !bucket.key) return;
  var k = bucket.key.length === 7 ? bucket.key + '-01' : bucket.key;
  applyPeriod(state.granularity, state.granularity === 'month' ? toDateKey(new Date(+k.slice(0,4), +k.slice(5,7), 0)) : (state.granularity === 'week' ? toDateKey(addDays(parseDateKeyLocal(k), 6)) : k));
}

// header pills: selected period + comparison period
function renderPeriodPills(){
  var pl = document.getElementById('periodLabel'), cl = document.getElementById('periodCmpLabel'), cw = document.getElementById('periodCmpPill');
  if(!pl) return;
  var G = { day:'วัน', week:'สัปดาห์', month:'เดือน' }[state.granularity] || '';
  pl.textContent = G + ' · ' + shortRangeLabel(state.dateFrom, state.dateTo);
  var p = previousPeriod(state.dateFrom, state.dateTo, state.granularity), minK = dataMinKey();
  if(p && minK && p.from >= minK){ cl.textContent = shortRangeLabel(p.from, p.to); cw.hidden = false; }
  else { cl.textContent = 'ไม่มีข้อมูลช่วงก่อน'; cw.hidden = !document.body.classList.contains('is-admin'); }
}

// problems tab: deltas vs previous period
function problemSnapshot(from, to){
  var f0 = state.dateFrom, t0 = state.dateTo;
  state.dateFrom = from; state.dateTo = to;
  var pt = getProblemTrips();
  state.dateFrom = f0; state.dateTo = t0;
  var cust = new Set();
  pt.forEach(function(t){ t.customers.forEach(function(c){ if(!state.excludedCustomers.has(c)) cust.add(c); }); });
  return { trips: pt.length, customers: cust.size, revenue: pt.reduce(function(s,t){ return s + t.revenue; }, 0) };
}
function renderProblemDeltas(){
  var ids = { trips:'probCmpTrips', customers:'probCmpCustomers', revenue:'probCmpRevenue' };
  var p = previousPeriod(state.dateFrom, state.dateTo, state.granularity), minK = dataMinKey();
  Object.keys(ids).forEach(function(k){ var e = document.getElementById(ids[k]); if(e) e.innerHTML = ''; });
  if(!p || !minK || p.from < minK) return;
  var cur = problemSnapshot(state.dateFrom, state.dateTo), prev = problemSnapshot(p.from, p.to);
  document.getElementById('probCmpTrips').innerHTML = cmpHtml(cur.trips, prev.trips, 'delay', 'pct');
  document.getElementById('probCmpCustomers').innerHTML = cmpHtml(cur.customers, prev.customers, 'delay', 'pct');
  document.getElementById('probCmpRevenue').innerHTML = cmpHtml(cur.revenue, prev.revenue, 'delay', 'pct');
}
// ===================== [ปรับ 08/11/2569] หน้าตั้งค่า: การ์ดสรุป 3 หัวข้อ + เลือกลูกค้าแบบติ๊ก + คอลัมน์ตาราง DC ครบทุกตัว =====================
var DC_COLS = [
  // g = กลุ่มหัวตาราง, def = แสดงเป็นค่าเริ่มต้น
  { k:'zone',      g:'ข้อมูล',     t:'ภาค',              def:1, txt:1, v:function(r){ return r.zone; } },
  { k:'total',     g:'ปริมาณ',     t:'เที่ยว',            def:1, v:function(r){ return r.k.total; }, f:fmtInt },
  { k:'dTotal',    g:'ปริมาณ',     t:'Δ เที่ยว',          def:1, d:{ cur:function(r){ return r.k.total; }, prev:function(p){ return p.k.total; }, mode:'pct', good:null } },
  { k:'ab',        g:'ปริมาณ',     t:'เที่ยว AB',         v:function(r){ return r.k.totalAB; }, f:fmtInt, cls:'product-ab' },
  { k:'cc',        g:'ปริมาณ',     t:'เที่ยว CC',         v:function(r){ return r.k.totalCC; }, f:fmtInt, cls:'product-cc' },
  { k:'ontime',    g:'ตรงเวลา',    t:'Ontime',            def:1, v:function(r){ return r.k.ontime; }, f:fmtInt },
  { k:'ontimePct', g:'ตรงเวลา',    t:'Ontime %',          def:1, v:function(r){ return r.k.ontimePct; }, f:fmtPct, cmp:true, strong:1 },
  { k:'dOn',       g:'ตรงเวลา',    t:'Δ Ontime %',        def:1, d:{ cur:function(r){ return r.k.ontimePct; }, prev:function(p){ return p.k.ontimePct; }, mode:'pp', good:true } },
  { k:'ontimeAB',  g:'ตรงเวลา',    t:'Ontime AB',         v:function(r){ return r.k.ontimeAB; }, f:fmtInt, cls:'product-ab' },
  { k:'ontimeCC',  g:'ตรงเวลา',    t:'Ontime CC',         v:function(r){ return r.k.ontimeCC; }, f:fmtInt, cls:'product-cc' },
  { k:'delay',     g:'ล่าช้า',     t:'Delay',             def:1, v:function(r){ return r.k.delay; }, f:fmtInt },
  { k:'delayPct',  g:'ล่าช้า',     t:'Delay %',           def:1, v:function(r){ return r.k.delayPct; }, f:fmtPct, cmp:false },
  { k:'dDelay',    g:'ล่าช้า',     t:'Δ Delay %',         def:1, d:{ cur:function(r){ return r.k.delayPct; }, prev:function(p){ return p.k.delayPct; }, mode:'pp', good:false } },
  { k:'delayAB',   g:'ล่าช้า',     t:'Delay AB',          v:function(r){ return r.k.delayAB; }, f:fmtInt, cls:'product-ab' },
  { k:'delayCC',   g:'ล่าช้า',     t:'Delay CC',          v:function(r){ return r.k.delayCC; }, f:fmtInt, cls:'product-cc' },
  { k:'avgDelay',  g:'ล่าช้า',     t:'ล่าช้าเฉลี่ย (นาที)', v:function(r){ return r.avgDelay; }, f:function(x){ return x === null ? '-' : fmtInt(x); }, cmp:false },
  { k:'dAvgDelay', g:'ล่าช้า',     t:'Δ ล่าช้าเฉลี่ย',     d:{ cur:function(r){ return r.avgDelay; }, prev:function(p){ return p.avgDelay; }, mode:'abs', good:false, unit:' นาที' } },
  { k:'pending',   g:'ยังไม่กลับ', t:'ยังไม่กลับ',         def:1, v:function(r){ return r.k.pending; }, f:fmtInt },
  { k:'bills',     g:'สินค้า',     t:'บิล',               v:function(r){ return r.k.bills; }, f:fmtInt },
  { k:'pieces',    g:'สินค้า',     t:'ชิ้น',              v:function(r){ return r.k.pieces; }, f:fmtInt },
  { k:'avgPoints', g:'สินค้า',     t:'จุดเข้ารับ/เที่ยว',    v:function(r){ return r.k.avgPoints; }, f:function(x){ return x.toFixed(1); } },
  { k:'avgBills',  g:'สินค้า',     t:'บิล/คัน',           v:function(r){ return r.k.avgBills; }, f:fmtInt },
  { k:'avgPieces', g:'สินค้า',     t:'ชิ้น/คัน',          v:function(r){ return r.k.avgPieces; }, f:fmtInt },
  { k:'revenue',   g:'รายได้',     t:'รายได้ (฿)',         v:function(r){ return r.k.revenue; }, f:fmtBaht },
  { k:'dRevenue',  g:'รายได้',     t:'Δ รายได้',           d:{ cur:function(r){ return r.k.revenue; }, prev:function(p){ return p.k.revenue; }, mode:'pct', good:true } },
  { k:'revAB',     g:'รายได้',     t:'รายได้ AB',          v:function(r){ return r.k.dryRevenue; }, f:fmtBaht, cls:'product-ab' },
  { k:'revCC',     g:'รายได้',     t:'รายได้ CC',          v:function(r){ return r.k.coldRevenue; }, f:fmtBaht, cls:'product-cc' },
];
var DC_COL_KEY = 'nimex-pickup-dccols-v2';
function dcColsOn(){
  var saved = (window.__PICKUP_DATA && window.__PICKUP_DATA.settings && window.__PICKUP_DATA.settings.dcCols) || null;
  return DC_COLS.filter(function(c){ return saved ? !!saved[c.k] : !!c.def; });
}
function setDcCols(map){ if(window.__pickupSaveSettings) window.__pickupSaveSettings({ dcCols: map }); }
function dcColMap(){ var m = {}; dcColsOn().forEach(function(c){ m[c.k] = 1; }); return m; }

function fmtDelta(cur, prev, d){
  if(cur === null || cur === undefined || prev === null || prev === undefined) return { v:null, h:'<span class="muted">–</span>' };
  var x, txt;
  if(d.mode === 'pp'){ x = cur - prev; txt = Math.abs(x*100).toFixed(1) + ' จุด'; }
  else if(d.mode === 'abs'){ x = cur - prev; txt = fmtInt(Math.abs(x)) + (d.unit || ''); }
  else { x = diffPct(cur, prev); if(!isFinite(x)) return { v:Infinity, h:'ใหม่' }; txt = Math.abs(x*100).toFixed(1) + '%'; }
  if(Math.abs(x) < (d.mode === 'abs' ? 0.5 : 0.0005)) return { v:0, h:'<span class="muted">– เท่าเดิม</span>' };
  var cls = d.good === null ? '' : (((x > 0) === d.good) ? 'good' : 'badt');
  return { v:x, cls:cls, h:'<b>' + (x > 0 ? '▲ ' : '▼ ') + txt + '</b>' };
}

// ---------- DC summary table (columns chosen in Settings, auto layout with grouped header) ----------
var dcSort = { key:'total', dir:-1 };
function avgDelayMin(trips){
  var d = trips.filter(function(t){ return t.status === 'delay' && t.delayMinutes !== null; });
  return d.length ? d.reduce(function(s,t){ return s + t.delayMinutes; }, 0) / d.length : null;
}
function dcRowsFor(trips){
  var m = new Map();
  trips.forEach(function(t){ if(!m.has(t.dcCode)) m.set(t.dcCode, []); m.get(t.dcCode).push(t); });
  return m;
}
function dcRowObj(code, ts, label, zone){ return { code:code, label:label, zone:zone, k:computeKPISet(ts), avgDelay:avgDelayMin(ts), ts:ts }; }
function prevTripsForPeriod(){
  var p = previousPeriod(state.dateFrom, state.dateTo, state.granularity), minK = dataMinKey();
  return (p && minK && p.from >= minK) ? { p:p, trips:tripsInRange(p.from, p.to) } : null;
}
function buildDcTableModel(trips){
  var cols = dcColsOn();
  var prevInfo = prevTripsForPeriod();
  var cur = dcRowsFor(trips), prev = prevInfo ? dcRowsFor(prevInfo.trips) : null;
  var rows = Array.from(cur.keys()).map(function(code){
    var ts = cur.get(code), info = state.dcList.find(function(d){ return d.code === code; });
    var r = dcRowObj(code, ts, info ? info.label : dcShortLabel(ts[0].dc), ts[0].zone || '-');
    r.prev = prev && prev.has(code) ? dcRowObj(code, prev.get(code), r.label, r.zone) : null;
    return r;
  });
  var sum = dcRowObj('*', trips, 'รวม', cur.size + ' DC');
  sum.prev = prevInfo ? dcRowObj('*', prevInfo.trips, 'รวม', '') : null;
  var val = function(r, c){
    if(c.d){ return r.prev ? fmtDelta(c.d.cur(r), c.d.prev(r.prev), c.d).v : null; }
    return c.v ? c.v(r) : null;
  };
  var sk = dcSort.key, sc = sk === 'label' ? null : DC_COLS.find(function(c){ return c.k === sk; });
  rows.sort(function(a,b){
    var x = sk === 'label' ? a.label : val(a, sc), y = sk === 'label' ? b.label : val(b, sc);
    if(x === null || x === undefined) x = -Infinity; if(y === null || y === undefined) y = -Infinity;
    if(typeof x === 'string') return x.localeCompare(y,'th') * dcSort.dir;
    return (x - y) * dcSort.dir;
  });
  return { cols:cols, rows:rows, sum:sum, prevInfo:prevInfo };
}
function renderDcSummary(trips){
  var tbody = document.getElementById('dcTableBody'), thead = document.getElementById('dcTableHead');
  if(!tbody || !thead) return;
  var M = buildDcTableModel(trips), cols = M.cols;
  var q = (document.getElementById('dcSearch') || {}).value || '';
  var rows = q ? M.rows.filter(function(r){ return (r.label + ' ' + r.code + ' ' + r.zone).indexOf(q) !== -1; }) : M.rows;
  // grouped two-row header: group cells span their columns; group starts get a divider
  var groups = [], prevG = null;
  cols.forEach(function(c){ if(c.g !== prevG){ groups.push({ g:c.g, n:1 }); prevG = c.g; } else groups[groups.length-1].n++; });
  var startSet = {}; prevG = null; cols.forEach(function(c){ if(c.g !== prevG){ startSet[c.k] = 1; prevG = c.g; } });
  var sortMark = function(k){ return dcSort.key === k ? ' class="sorted" data-dir="' + (dcSort.dir > 0 ? 'asc' : 'desc') + '"' : ''; };
  thead.innerHTML =
    '<tr class="grp"><th rowspan="2" data-k="label"' + sortMark('label') + '>DC</th>' + groups.map(function(g){ return '<th colspan="' + g.n + '" class="gstart">' + g.g + '</th>'; }).join('') + '</tr>' +
    '<tr>' + cols.map(function(c){
      var cl = [c.d ? 'dcol' : '', startSet[c.k] ? 'gstart' : '', c.cls || '', dcSort.key === c.k ? 'sorted' : ''].filter(Boolean).join(' ');
      return '<th data-k="' + c.k + '"' + (cl ? ' class="' + cl + '"' : '') + (dcSort.key === c.k ? ' data-dir="' + (dcSort.dir > 0 ? 'asc' : 'desc') + '"' : '') + '>' + c.t + '</th>';
    }).join('') + '</tr>';
  var refOn = M.sum.k.ontimePct, refDelay = M.sum.k.delayPct, refAvg = M.sum.avgDelay;
  var cell = function(r, c, isSum){
    var cl = [startSet[c.k] ? 'gstart' : '', c.cls || '', c.txt ? 'txt' : 'tabnum'];
    if(c.d){
      cl.push('dcol');
      var D = r.prev ? fmtDelta(c.d.cur(r), c.d.prev(r.prev), c.d) : { h:'<span class="muted">–</span>' };
      if(D.cls) cl.push(D.cls);
      return '<td class="' + cl.join(' ') + '">' + D.h + '</td>';
    }
    var v = c.v(r), h = c.txt ? v : c.f(v);
    if(!isSum && c.cmp !== undefined && v !== null && isFinite(v)){
      var ref = c.k === 'ontimePct' ? refOn : c.k === 'delayPct' ? refDelay : refAvg;
      if(ref !== null && Math.abs(v - ref) > 0.0005) cl.push(((v > ref) === c.cmp) ? 'good' : 'badt');
    }
    if(c.strong) h = '<b>' + h + '</b>';
    return '<td class="' + cl.join(' ') + '">' + h + '</td>';
  };
  tbody.innerHTML = rows.map(function(r){
    return '<tr data-dc="' + r.code + '"' + (state.selectedDC === r.code ? ' class="sel"' : '') + '><td>' + r.label + '</td>' + cols.map(function(c){ return cell(r, c, false); }).join('') + '</tr>';
  }).join('') + '<tr class="sum"><td>รวม</td>' + cols.map(function(c){ return cell(M.sum, c, true); }).join('') + '</tr>';
  var card = document.getElementById('dcSummaryCard');
  if(card) card.classList.toggle('wide', cols.length > 12);
}

// ---------- settings page ----------
var custFilter = { q:'', only:false };
function allCustomers(){
  var m = new Map();
  state.trips.forEach(function(t){ t.customers.forEach(function(c){
    if(!m.has(c)) m.set(c, { name:c, trips:0, delay:0, dcs:{} });
    var o = m.get(c); o.trips++; if(t.status === 'delay') o.delay++; o.dcs[dcShortLabel(t.dc)] = 1;
  }); });
  return Array.from(m.values()).sort(function(a,b){ return b.delay - a.delay || b.trips - a.trips; });
}
var __custCache = null;
function renderCustomerChecklist(){
  var box = document.getElementById('custList'); if(!box) return;
  if(!__custCache) __custCache = allCustomers();
  var sel = new Set(state.draftExcludedCustomers);
  var q = custFilter.q.trim();
  var list = __custCache.filter(function(c){ return (!q || c.name.indexOf(q) !== -1) && (!custFilter.only || sel.has(c.name)); });
  var shown = list.slice(0, 300);
  box.innerHTML = shown.length ? shown.map(function(c){
    return '<label class="cust-item' + (sel.has(c.name) ? ' on' : '') + '"><input type="checkbox" data-name="' + c.name.replace(/"/g,'&quot;') + '"' + (sel.has(c.name) ? ' checked' : '') + '>' +
      '<span class="cn">' + c.name + '<small>' + Object.keys(c.dcs).join(', ') + '</small></span>' +
      '<span class="cs tabnum">' + fmtInt(c.trips) + ' เที่ยว<br><b class="' + (c.delay ? 'badt' : '') + '">Delay ' + fmtInt(c.delay) + '</b></span></label>';
  }).join('') : '<div class="empty-state">ไม่พบลูกค้า</div>';
  document.getElementById('custCount').textContent = 'เลือกไว้ ' + fmtInt(sel.size) + ' ราย · แสดง ' + fmtInt(shown.length) + (list.length > shown.length ? ' จาก ' + fmtInt(list.length) + ' (พิมพ์ค้นหาเพื่อดูเพิ่ม)' : '') + ' · เรียงจาก Delay มากไปน้อย';
}
function renderColPicker(){
  var box = document.getElementById('colPicker'); if(!box) return;
  var on = dcColMap(), groups = [];
  DC_COLS.forEach(function(c){ var g = groups.find(function(x){ return x.g === c.g; }); if(!g){ g = { g:c.g, cols:[] }; groups.push(g); } g.cols.push(c); });
  box.innerHTML = groups.map(function(g){
    return '<fieldset class="colgrp"><legend>' + g.g + '</legend>' + g.cols.map(function(c){
      return '<label class="colchk' + (on[c.k] ? ' on' : '') + '"><input type="checkbox" data-col="' + c.k + '"' + (on[c.k] ? ' checked' : '') + '>' + c.t + '</label>';
    }).join('') + '</fieldset>';
  }).join('');
}
function settingsSummaries(){
  var on = dcColsOn().length;
  var s1 = document.getElementById('sumCols'); if(s1) s1.textContent = 'แสดง ' + on + ' จาก ' + DC_COLS.length + ' คอลัมน์';
  var s2 = document.getElementById('sumCust'); if(s2) s2.textContent = state.excludedCustomers.size ? 'ยกเว้นอยู่ ' + fmtInt(state.excludedCustomers.size) + ' ราย' : 'ยังไม่ได้ยกเว้นลูกค้า';
  var s3 = document.getElementById('sumCutoff');
  if(s3){
    s3.innerHTML = ALLOWED_DC_CODES.map(function(code){
      var d = state.draftDcCutoffs[code] || {}, nm = (DC_DIRECTORY[code] && DC_DIRECTORY[code].name || code).replace(/^C?DC\s*/,'');
      return '<span class="mini-pill">' + nm + ' · AB ' + (d['แห้ง'] || '-') + ' · CC ' + (d['เย็น'] || '-') + '</span>';
    }).join('');
  }
}
function afterSettingsRender(){
  // show the 3 DCs in use first in the cutoff table
  var tb = document.getElementById('settingsDcTableBody');
  if(tb){
    var rows = Array.from(tb.querySelectorAll('tr'));
    rows.filter(function(tr){ var i = tr.querySelector('input[data-code]'); return i && ALLOWED_DC_CODES.indexOf(i.dataset.code) !== -1; })
      .reverse().forEach(function(tr){ tr.classList.add('inuse'); tb.insertBefore(tr, tb.firstChild); });
  }
  renderCustomerChecklist(); renderColPicker(); settingsSummaries();
}
function wireSettings(){
  document.querySelectorAll('.set-card [data-open]').forEach(function(btn){
    btn.addEventListener('click', function(){
      var id = btn.dataset.open, sec = document.getElementById(id), open = sec.hidden;
      document.querySelectorAll('.set-sec').forEach(function(s){ s.hidden = true; });
      document.querySelectorAll('.set-card').forEach(function(c){ c.classList.remove('open'); });
      sec.hidden = !open;
      if(open){ btn.closest('.set-card').classList.add('open'); setTimeout(function(){ sec.scrollIntoView({ behavior:'smooth', block:'start' }); }, 30); }
    });
  });
  document.getElementById('custSearch').addEventListener('input', function(e){ custFilter.q = e.target.value; renderCustomerChecklist(); });
  document.getElementById('custOnly').addEventListener('change', function(e){ custFilter.only = e.target.checked; renderCustomerChecklist(); });
  document.getElementById('custList').addEventListener('change', function(e){
    var cb = e.target.closest('input[data-name]'); if(!cb) return;
    var n = cb.dataset.name, i = state.draftExcludedCustomers.indexOf(n);
    if(cb.checked && i === -1) state.draftExcludedCustomers.push(n);
    if(!cb.checked && i !== -1) state.draftExcludedCustomers.splice(i, 1);
    cb.closest('.cust-item').classList.toggle('on', cb.checked);
    renderCustomerChecklist();
  });
  document.getElementById('custClear').addEventListener('click', function(){ state.draftExcludedCustomers = []; renderCustomerChecklist(); });
  document.getElementById('colPicker').addEventListener('change', function(e){
    var cb = e.target.closest('input[data-col]'); if(!cb) return;
    var m = dcColMap(); if(cb.checked) m[cb.dataset.col] = 1; else delete m[cb.dataset.col];
    setDcCols(m); renderColPicker(); settingsSummaries(); renderDcSummary(applyFilters());
  });
  document.getElementById('colAll').addEventListener('click', function(){ var m = {}; DC_COLS.forEach(function(c){ m[c.k] = 1; }); setDcCols(m); renderColPicker(); settingsSummaries(); renderDcSummary(applyFilters()); });
  document.getElementById('colDefault').addEventListener('click', function(){ if(window.__pickupSaveSettings) window.__pickupSaveSettings({ dcCols: null }); renderColPicker(); settingsSummaries(); renderDcSummary(applyFilters()); });
}
// ===================== [เพิ่ม 08/11/2569] ชิปตัวกรอง + หน้าผลการวิเคราะห์ + กราฟชิ้นแยกแกน + กดจุดกราฟเพื่อเปิดช่วงนั้น =====================
var DRILL_IDS = { chartOntimeTrend:1, chartDelayMinutes:1, chartRevenuePieces:1, chartPieces:1 };
function drillByLabel(label){
  var b = groupByBucket(chartWindowTrips(), effectiveGranularity()).find(function(x){ return x.label === label; });
  if(b) setTimeout(function(){ chartDrill(b); }, 0);   // let Chart.js finish its click handler first
}

// ---------- pieces chart (separate from revenue: no dual Y axis) ----------
function renderPiecesChart(trips){
  var buckets = groupByBucket(trips, effectiveGranularity());
  var labels = buckets.map(function(b){ return b.label; });
  function sumBy(product){
    return buckets.map(function(b){
      var g = b.trips.filter(function(t){ return t.dominantProduct === product; });
      if(!g.length) return null;
      return g.reduce(function(s,t){ return s + t.pieces; }, 0);
    });
  }
  ensureChart('chartPieces', {
    type:'line',
    data:{ labels: labels, datasets:[
      { label:'ชิ้น AB', data: sumBy('แห้ง'), borderColor: PRODUCT_COLOR['แห้ง'], backgroundColor: PRODUCT_COLOR['แห้ง'], tension:.25, pointRadius:3, spanGaps:true },
      { label:'ชิ้น CC', data: sumBy('เย็น'), borderColor: PRODUCT_COLOR['เย็น'], backgroundColor: PRODUCT_COLOR['เย็น'], tension:.25, pointRadius:3, spanGaps:true },
    ]},
    options:{ responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{ position:'bottom', labels:{ font: baseFont(), boxWidth:16 } } },
      scales:{ y:{ ticks:{ font: baseFont(), callback:function(v){ return fmtInt(v); } } }, x:{ ticks:{ font: baseFont() } } } }
  });
}

// ---------- active filter chips (with close buttons) ----------
function renderFilterChips(){
  var box = document.getElementById('activeChips'); if(!box) return;
  var chips = [];
  if(state.selectedZone) chips.push({ k:'zone', t:'ภาค ' + state.selectedZone });
  if(state.selectedDC){ var d = state.dcList.find(function(x){ return x.code === state.selectedDC; }); chips.push({ k:'dc', t:'DC ' + (d ? d.label : state.selectedDC) }); }
  if(state.dcGroupFilter) chips.push({ k:'grp', t:'BKK ไม่รวม 691' });
  if(state.tripGroupFilter) chips.push({ k:'trip', t: state.tripGroupFilter === 'single' ? '1 เที่ยว/วัน' : 'มากกว่า 1 เที่ยว/วัน' });
  if(state.productFilter) chips.push({ k:'prod', t: state.productFilter === 'แห้ง' ? 'สินค้า AB' : 'สินค้า CC' });
  if(state.statusFilter.size < 3) chips.push({ k:'status', t:'สถานะ: ' + Array.from(state.statusFilter).map(function(s){ return s === 'ontime' ? 'Ontime' : s === 'delay' ? 'Delay' : 'ยังไม่กลับ'; }).join(', ') });
  box.innerHTML = chips.map(function(c){ return '<span class="fchip">' + c.t + '<button type="button" data-clear="' + c.k + '" aria-label="ล้างตัวกรอง ' + c.t + '">✕</button></span>'; }).join('');
  box.hidden = !chips.length;
}
function clearFilterChip(k){
  var fire = function(id, v){ var s = document.getElementById(id); s.value = v; s.dispatchEvent(new Event('change')); };
  if(k === 'zone') fire('fZone', '');
  else if(k === 'dc') fire('fDC', '');
  else if(k === 'grp') fire('fDcGroup', '');
  else if(k === 'trip') fire('fTripGroup', '');
  else if(k === 'prod') fire('fProduct', '');
  else if(k === 'status'){ state.statusFilter = new Set(['ontime','delay','pending']); state.page = 1; renderAll(); }
}

// ---------- analysis page: pick a dimension + metric, worst first ----------
var AN_DIMS = {
  dc:       { t:'DC',      key:function(t){ return [t.dcCode]; }, name:function(k, ts){ var d = state.dcList.find(function(x){ return x.code === k; }); return d ? d.label : k; } },
  plate:    { t:'ทะเบียน',  key:function(t){ return t.plate ? [String(t.plate).trim()] : []; }, name:function(k){ return k; } },
  customer: { t:'ลูกค้า',   key:function(t){ return t.customers; }, name:function(k){ return k; } },
  vtype:    { t:'ประเภทรถ', key:function(t){ return t.vehicleType ? [String(t.vehicleType).replace(/^\d+\s+/,'')] : []; }, name:function(k){ return k; } },
};
var AN_METRICS = {
  delayPct:  { t:'Delay % (สูง = แย่)',       v:function(o){ return o.k.delayPct; }, worse:1,  f:fmtPct, pp:true, rate:true },
  ontimePct: { t:'Ontime % (ต่ำ = แย่)',      v:function(o){ return o.k.ontimePct; }, worse:-1, f:fmtPct, pp:true, rate:true },
  delay:     { t:'จำนวนเที่ยว Delay',         v:function(o){ return o.k.delay; }, worse:1, f:fmtInt },
  avgDelay:  { t:'ล่าช้าเฉลี่ย (นาที)',         v:function(o){ return o.avgDelay; }, worse:1, f:function(x){ return x === null ? '-' : fmtInt(x); } },
};
var anState = { dim:'plate', metric:'delayPct', min:5, limit:50 };
function locationOf(ts){
  var c = {}; ts.forEach(function(t){ var k = (t.zone || '-') + ' / ' + dcShortLabel(t.dc); c[k] = (c[k] || 0) + 1; });
  var best = null; Object.keys(c).forEach(function(k){ if(!best || c[k] > c[best]) best = k; });
  var n = Object.keys(c).length;
  return (best || '-') + (n > 1 ? ' +' + (n - 1) : '');
}
function analysisGroups(trips, dimKey){
  var D = AN_DIMS[dimKey], m = new Map();
  trips.forEach(function(t){ D.key(t).forEach(function(k){ if(!k) return; if(!m.has(k)) m.set(k, []); m.get(k).push(t); }); });
  return m;
}
function analysisRows(){
  var D = AN_DIMS[anState.dim], M = AN_METRICS[anState.metric];
  var scope = scopeTripsIgnoringStatus();          // ใช้ช่วงเวลา + ตัวกรองด้านบน (ไม่สนชิปสถานะ เพื่อให้ % ถูกต้อง)
  var g = analysisGroups(scope, anState.dim);
  var prevInfo = (function(){ var p = previousPeriod(state.dateFrom, state.dateTo, state.granularity), minK = dataMinKey(); if(!p || !minK || p.from < minK) return null;
    var f0 = state.dateFrom, t0 = state.dateTo; state.dateFrom = p.from; state.dateTo = p.to; var s = scopeTripsIgnoringStatus(); state.dateFrom = f0; state.dateTo = t0; return analysisGroups(s, anState.dim); })();
  var rows = [];
  g.forEach(function(ts, k){
    if(M.rate && ts.length < anState.min) return;
    var o = { key:k, name:D.name(k, ts), ts:ts, k:computeKPISet(ts), avgDelay:avgDelayMin(ts), loc:locationOf(ts) };
    o.val = M.v(o);
    if(o.val === null) return;
    if(prevInfo && prevInfo.has(k)){ var pts = prevInfo.get(k), po = { k:computeKPISet(pts), avgDelay:avgDelayMin(pts) }; o.prevVal = M.v(po); }
    rows.push(o);
  });
  rows.sort(function(a,b){ return (b.val - a.val) * M.worse || b.ts.length - a.ts.length; });
  return { rows:rows, D:D, M:M, hasPrev:!!prevInfo };
}
function renderAnalysis(){
  var wrap = document.getElementById('anTableWrap'); if(!wrap) return;
  if(document.getElementById('tabAnalysis').style.display === 'none') return;
  var A = analysisRows(), R = A.rows, show = R.slice(0, anState.limit);
  document.getElementById('anMinWrap').hidden = !A.M.rate;
  document.getElementById('anNote').textContent = 'ช่วง ' + shortRangeLabel(state.dateFrom, state.dateTo) + ' · เรียงจากแย่ไปดีตาม ' + A.M.t +
    (A.M.rate ? ' · เฉพาะที่มีอย่างน้อย ' + anState.min + ' เที่ยว' : '') + ' · พบ ' + fmtInt(R.length) + ' รายการ' + (R.length > show.length ? ' (แสดง ' + show.length + ' อันดับแรก)' : '');
  var showLoc = anState.dim !== 'dc';
  var head = '<tr><th class="rk">#</th><th>' + A.D.t + '</th>' + (showLoc ? '<th>ภาค / DC</th>' : '<th>ภาค</th>') +
    '<th>เที่ยว</th><th>Ontime %</th><th>Delay</th><th>Delay %</th><th>ล่าช้าเฉลี่ย (นาที)</th>' + (A.hasPrev ? '<th class="dcol">Δ ' + A.M.t.replace(/ \(.*\)/,'') + '</th>' : '') + '</tr>';
  var body = show.map(function(o, i){
    var d = '';
    if(A.hasPrev){
      var D = (o.prevVal === undefined || o.prevVal === null) ? { h:'<span class="muted">–</span>' } : fmtDelta(o.val, o.prevVal, { mode: A.M.pp ? 'pp' : (anState.metric === 'avgDelay' ? 'abs' : 'pct'), good: A.M.worse < 0, unit: anState.metric === 'avgDelay' ? ' นาที' : '' });
      d = '<td class="dcol tabnum ' + (D.cls || '') + '">' + D.h + '</td>';
    }
    return '<tr data-an="' + String(o.key).replace(/"/g,'&quot;') + '"><td class="rk"><span class="rank' + (i < 3 ? ' top' : '') + '">' + (i + 1) + '</span></td><td>' + o.name + '</td>' +
      '<td class="txt">' + (showLoc ? o.loc : (o.ts[0].zone || '-')) + '</td>' +
      '<td class="tabnum">' + fmtInt(o.ts.length) + '</td><td class="tabnum">' + fmtPct(o.k.ontimePct) + '</td><td class="tabnum">' + fmtInt(o.k.delay) + '</td>' +
      '<td class="tabnum"><b>' + fmtPct(o.k.delayPct) + '</b></td><td class="tabnum">' + (o.avgDelay === null ? '-' : fmtInt(o.avgDelay)) + '</td>' + d + '</tr>';
  }).join('');
  wrap.innerHTML = '<table class="data" id="anTable"><thead>' + head + '</thead><tbody>' + (body || '<tr><td colspan="9" class="empty-state">ไม่มีข้อมูลตามเงื่อนไข</td></tr>') + '</tbody></table>';
}
function goTripsSearch(q){
  var s = document.getElementById('tableSearch'); s.value = q; s.dispatchEvent(new Event('input'));
  document.querySelector('.rail .main-tab[data-tab="tabTrips"]').click();
}
function wireAnalysis(){
  var sel = function(id, k, cast){ document.getElementById(id).addEventListener('change', function(e){ anState[k] = cast ? +e.target.value : e.target.value; renderAnalysis(); }); };
  sel('anDim', 'dim'); sel('anMetric', 'metric'); sel('anMin', 'min', true);
  document.getElementById('anTableWrap').addEventListener('click', function(e){
    var tr = e.target.closest('tr[data-an]'); if(!tr) return;
    var k = tr.dataset.an;
    if(anState.dim === 'dc'){ var s = document.getElementById('fDC'); s.value = k; s.dispatchEvent(new Event('change')); document.querySelector('.rail .main-tab[data-tab="tabDashboard"]').click(); }
    else if(anState.dim === 'vtype') goTripsSearch('');
    else goTripsSearch(k);
  });
  document.getElementById('activeChips').addEventListener('click', function(e){ var b = e.target.closest('[data-clear]'); if(b) clearFilterChip(b.dataset.clear); });
}
// [ปรับ 14/11/2569] โค้ดแชร์/ส่งออกย้ายไปไฟล์ share.js (โหลดก่อน app.js) — ส่งฟังก์ชันคำนวณเดิมให้ใช้ตรงๆ ไม่คำนวณซ้ำ
function wireShare(){
  if(!window.PickupShare){ console.error("[share] share.js not loaded"); return; }
  window.__pickupShare = window.PickupShare({ state:state, anState:anState, analysisRows:analysisRows, applyFilters:applyFilters, buildDcTableModel:buildDcTableModel, chartWindowTrips:chartWindowTrips, computeKPISet:computeKPISet, dataMinKey:dataMinKey, diffPct:diffPct, effectiveGranularity:effectiveGranularity, fmtBaht:fmtBaht, fmtDelta:fmtDelta, fmtInt:fmtInt, fmtPct:fmtPct, getProblemTrips:getProblemTrips, groupByBucket:groupByBucket, locationOf:locationOf, prevTripsForPeriod:prevTripsForPeriod, previousPeriod:previousPeriod, shortRangeLabel:shortRangeLabel, showToast:showToast, avgDelayMin:avgDelayMin, tripsInRange:tripsInRange, tripMatchesNonDateFilters:tripMatchesNonDateFilters, dcShortLabel:dcShortLabel, dcRowsFor:dcRowsFor });
}

function wireEvents(){
  document.querySelectorAll('.main-tab').forEach(function(tab){
    tab.addEventListener('click', function(){
      document.querySelectorAll('.main-tab').forEach(function(t){ t.classList.toggle('active', t===tab); });
      var target = tab.dataset.tab;
      document.getElementById('tabDashboard').style.display = (target==='tabDashboard') ? '' : 'none';
      document.getElementById('tabCompare').style.display = (target==='tabCompare') ? '' : 'none';
      document.getElementById('tabProblems').style.display = (target==='tabProblems') ? '' : 'none';
      document.getElementById('tabSettings').style.display = (target==='tabSettings') ? '' : 'none';
      document.getElementById('tabTrips').style.display = (target==='tabTrips') ? '' : 'none';
      document.getElementById('tabAnalysis').style.display = (target==='tabAnalysis') ? '' : 'none';
      if(target === 'tabAnalysis') renderAnalysis();
      if(target === 'tabCompare') renderCompareTab();
      if(target === 'tabProblems') renderProblemsTab();
      if(target === 'tabSettings') renderSettingsTab();
    });
  });

  document.getElementById('cmpPresetYday').addEventListener('click', function(){ setComparePreset('yday'); });
  document.getElementById('cmpPresetWeek').addEventListener('click', function(){ setComparePreset('week'); });
  document.getElementById('cmpPresetMonth').addEventListener('click', function(){ setComparePreset('month'); });
  ['cmpBeforeFrom','cmpBeforeTo','cmpAfterFrom','cmpAfterTo'].forEach(function(id){
    document.getElementById(id).addEventListener('change', function(e){
      state[id] = e.target.value || null;
      renderCompareTab();
    });
  });
  document.getElementById('cmpZone').addEventListener('change', function(e){
    state.cmpZone = e.target.value;
    populateSelect('cmpDC', state.dcList.filter(function(d){return !state.cmpZone || d.zone===state.cmpZone;}), function(d){return d.code;}, function(d){return d.label;}, state.cmpDC);
    renderCompareTab();
  });
  document.getElementById('cmpDC').addEventListener('change', function(e){ state.cmpDC = e.target.value; renderCompareTab(); });
  document.getElementById('cmpProduct').addEventListener('change', function(e){ state.cmpProduct = e.target.value; renderCompareTab(); });

  document.getElementById('cmpCopyBtn').addEventListener('click', function(){
    var text = buildCompareShareText();
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(text).then(function(){ showToast('คัดลอกผลเปรียบเทียบแล้ว'); }).catch(function(){ fallbackCopy(text); });
    } else { fallbackCopy(text); }
  });
  document.getElementById('cmpEmailBtn').addEventListener('click', function(){
    var text = buildCompareShareText();
    window.location.href = 'mailto:?subject=' + encodeURIComponent('เปรียบเทียบผลการดำเนินงาน') + '&body=' + encodeURIComponent(text);
  });
  document.getElementById('cmpLineBtn').addEventListener('click', function(){
    var text = buildCompareShareText();
    window.open('https://line.me/R/msg/text/?' + encodeURIComponent(text), '_blank');
  });

  document.getElementById('settingsAddCustomerBtn').addEventListener('click', function(){
    var inp = document.getElementById('settingsCustomerInput');
    var name = inp.value.trim();
    if(!name) return;
    if(state.draftExcludedCustomers.indexOf(name) === -1) state.draftExcludedCustomers.push(name);
    inp.value = '';
    renderSettingsTab();
  });
  document.getElementById('settingsCustomerInput').addEventListener('keydown', function(e){
    if(e.key === 'Enter'){ e.preventDefault(); document.getElementById('settingsAddCustomerBtn').click(); }
  });
  document.getElementById('settingsDcSearch').addEventListener('input', function(){ renderSettingsTab(); });
  document.getElementById('settingsApplyBtn').addEventListener('click', applySettingsAndRecalculate);
  document.getElementById('settingsResetBtn').addEventListener('click', function(){
    state.draftExcludedCustomers = [];
    state.draftDcCutoffs = buildDefaultDcCutoffs();
    renderSettingsTab();
    showToast('รีเซ็ตค่าที่แก้ไข (ยังไม่บันทึก กดคำนวณผลใหม่เพื่อใช้งานจริง)');
  });

  document.querySelectorAll('.status-filter-chip:not(.table-status-filter-chip)').forEach(function(chip){
    chip.addEventListener('click', function(){
      var s = chip.dataset.status;
      if(state.statusFilter.has(s) && state.statusFilter.size>1) state.statusFilter.delete(s);
      else state.statusFilter.add(s);
      state.page=1; renderAll();
    });
  });
  document.querySelectorAll('.table-status-filter-chip').forEach(function(chip){
    chip.addEventListener('click', function(){
      var s = chip.dataset.status;
      if(state.tableStatusFilter.has(s) && state.tableStatusFilter.size>1) state.tableStatusFilter.delete(s);
      else state.tableStatusFilter.add(s);
      chip.classList.toggle('active', state.tableStatusFilter.has(s));
      state.page=1; renderAll();
    });
  });

  document.getElementById('probSearch').addEventListener('input', function(){ renderProblemsTab(); });
  document.getElementById('probExportExcel').addEventListener('click', exportProblemCustomers);

  document.getElementById('delayChartOverviewBtn').addEventListener('click', function(){
    state.delayChartDetailed = false;
    this.classList.add('active');
    document.getElementById('delayChartDetailBtn').classList.remove('active');
    document.getElementById('delayChartDesc').textContent = 'นาทีเฉลี่ยที่เกินเวลาตัด (เฉพาะเที่ยว Delay) แยกตาม AB/CC';
    renderAll();
  });
  document.getElementById('delayChartDetailBtn').addEventListener('click', function(){
    state.delayChartDetailed = true;
    this.classList.add('active');
    document.getElementById('delayChartOverviewBtn').classList.remove('active');
    document.getElementById('delayChartDesc').textContent = 'นาทีเฉลี่ยที่เกินเวลาตัด (เฉพาะเที่ยว Delay) แยกตาม DC และ AB/CC';
    renderAll();
  });

  document.getElementById('fGranularity').addEventListener('change', function(e){
    state.granularity = e.target.value;
    renderAll();
  });
  document.getElementById('fDateFrom').addEventListener('change', function(e){ state.dateFrom = e.target.value || null; state.page=1; renderAll(); });
  document.getElementById('fDateTo').addEventListener('change', function(e){ state.dateTo = e.target.value || null; state.page=1; renderAll(); });

  document.getElementById('fZone').addEventListener('change', function(e){
    state.selectedZone = e.target.value;
    if(state.selectedDC){
      var dc = state.dcList.find(function(d){ return d.code === state.selectedDC; });
      if(!dc || (state.selectedZone && dc.zone !== state.selectedZone)) state.selectedDC = '';
    }
    buildDCOptions();
    state.page=1; renderAll();
  });
  document.getElementById('fDC').addEventListener('change', function(e){ state.selectedDC = e.target.value; state.page=1; renderAll(); });
  document.getElementById('fDcGroup').addEventListener('change', function(e){ state.dcGroupFilter = e.target.value; state.page=1; renderAll(); });
  document.getElementById('fTripGroup').addEventListener('change', function(e){ state.tripGroupFilter = e.target.value; state.page=1; renderAll(); });
  document.getElementById('fProduct').addEventListener('change', function(e){ state.productFilter = e.target.value; state.page=1; renderAll(); });

  document.getElementById('resetFilters').addEventListener('click', function(){
    state.selectedZone = '';
    state.selectedDC = '';
    state.dcGroupFilter = '';
    state.tripGroupFilter = '';
    state.productFilter = '';
    state.granularity = 'month';
    state.statusFilter = new Set(['ontime','delay','pending']);
  state.tableStatusFilter = new Set(['ontime','delay','pending']);
    var dates = state.trips.filter(function(t){return t.dispatch;}).map(function(t){ return t.dateKey; });
    state.dateFrom = dates.length ? dates.reduce(function(a,b){return a<b?a:b;}) : null;
    state.dateTo = dates.length ? dates.reduce(function(a,b){return a>b?a:b;}) : null;
    syncDateInputs();
    buildZoneOptions();
    buildDCOptions();
    document.getElementById('fDcGroup').value = '';
    document.getElementById('fTripGroup').value = '';
    state.page = 1;
    applyPeriod('month', dataMaxKey());
  });

  document.querySelectorAll('.png-btn').forEach(function(btn){
    btn.addEventListener('click', function(){
      var id = btn.dataset.chart;
      var chart = charts[id];
      if(!chart) return;
      var url = chart.toBase64Image('image/png', 1);
      var a = document.createElement('a');
      a.href = url; a.download = id + '.png';
      a.click();
    });
  });

  document.getElementById('dashPngBtn').addEventListener('click', function(){
    if(typeof html2canvas === 'undefined'){ showToast('ไม่พบไลบรารีสำหรับบันทึกภาพหน้าจอ'); return; }
    showToast('กำลังสร้างภาพหน้าจอ…');
    var isCompareTab = document.getElementById('tabCompare').style.display !== 'none';
    var filterCard = document.getElementById('cmpFilterCard');
    var filterCardPrevDisplay = filterCard.style.display;
    if(isCompareTab) filterCard.style.display = 'none';
    html2canvas(document.getElementById('captureRoot'), { backgroundColor:'#F2F6FC', scale:2 }).then(function(canvas){
      if(isCompareTab) filterCard.style.display = filterCardPrevDisplay;
      var a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = 'pickup-dashboard.png';
      a.click();
      showToast('บันทึกภาพหน้าจอแล้ว');
    }).catch(function(err){
      if(isCompareTab) filterCard.style.display = filterCardPrevDisplay;
      console.error(err);
      showToast('บันทึกภาพไม่สำเร็จ');
    });
  });

  document.getElementById('tableSearch').addEventListener('input', function(e){ state.tableSearch = e.target.value; state.page=1; renderAll(); });
  document.querySelectorAll('.kpi-card[data-status]').forEach(function(card){
    card.addEventListener('click', function(){
      var s = card.dataset.status;
      if(state.statusFilter.has(s) && state.statusFilter.size>1) state.statusFilter.delete(s);
      else state.statusFilter.add(s);
      state.page=1; renderAll();
    });
  });

  document.querySelectorAll('#dataTable thead th').forEach(function(th){
    th.addEventListener('click', function(){
      var key = th.dataset.key;
      if(state.sortKey === key) state.sortDir = state.sortDir==='asc'?'desc':'asc';
      else { state.sortKey = key; state.sortDir = 'asc'; }
      renderAll();
    });
  });

  document.getElementById('exportExcel').addEventListener('click', function(){ exportTable('xlsx'); });
  document.getElementById('exportCsv').addEventListener('click', function(){ exportTable('csv'); });

  document.getElementById('viewOnlyToggle').addEventListener('change', function(e){
    state.viewOnly = e.target.checked;
    document.getElementById('uploadBtn').style.display = state.viewOnly ? 'none' : '';
    document.getElementById('dashPngBtn').style.display = state.viewOnly ? 'none' : '';
    document.getElementById('shareBtn').style.display = state.viewOnly ? 'none' : '';
    if(state.viewOnly){
      // leaving view-only mode always requires re-entering the admin password again
      state.isAdmin = false;
      document.getElementById('settingsTabBtn').style.display = 'none';
      if(document.getElementById('tabSettings').style.display !== 'none'){
        document.querySelector('.main-tab[data-tab="tabDashboard"]').click();
      }
    }
  });

  document.getElementById('uploadBtn').addEventListener('click', function(){
    if(state.viewOnly) return;
    document.getElementById('fileInput').click();
  });
  document.getElementById('fileInput').addEventListener('change', function(e){
    var file = e.target.files[0];
    if(!file) return;
    if(window.__pickupUploadFiles) window.__pickupUploadFiles(e.target.files); else handleUpload(file);
    e.target.value = '';
  });

  // collapsible sections
  document.getElementById('tableToggleBtn').addEventListener('click', function(){
    var body = document.getElementById('tableBodyWrap');
    var collapsed = body.classList.toggle('collapsed');
    this.textContent = collapsed ? 'แสดง' : 'ซ่อน';
  });
  document.getElementById('chartsToggleBtn').addEventListener('click', function(){
    var body = document.getElementById('chartsBodyWrap');
    var collapsed = body.classList.toggle('collapsed');
    this.textContent = collapsed ? 'แสดง' : 'ซ่อน';
  });
  document.getElementById('zoneToggleBtn').addEventListener('click', function(){
    var body = document.getElementById('zoneSummaryBody');
    var collapsed = body.classList.toggle('collapsed');
    this.textContent = collapsed ? 'แสดง' : 'ซ่อน';
  });

  // share modal
  document.getElementById('shareBtn').addEventListener('click', function(){
    document.getElementById('shareModalOverlay').classList.add('open');
    renderSharePreview();
  });
  document.getElementById('shareModalClose').addEventListener('click', function(){
    document.getElementById('shareModalOverlay').classList.remove('open');
  });
  document.getElementById('shareModalOverlay').addEventListener('click', function(e){
    if(e.target === this) this.classList.remove('open');
  });

  // admin gate for the Settings tab
  document.getElementById('adminBtn').addEventListener('click', function(){
    document.getElementById('adminModalOverlay').classList.add('open');
    document.getElementById('adminPasswordInput').value = '';
    document.getElementById('adminPasswordInput').focus();
  });
  document.getElementById('adminModalClose').addEventListener('click', function(){
    document.getElementById('adminModalOverlay').classList.remove('open');
  });
  document.getElementById('adminModalOverlay').addEventListener('click', function(e){
    if(e.target === this) this.classList.remove('open');
  });
  function trySubmitAdminPassword(){
    var val = document.getElementById('adminPasswordInput').value;
    if(__sha256(val) === ADMIN_PASSWORD_HASH){
      try{ sessionStorage.setItem(ADMIN_SESSION_KEY, ADMIN_PASSWORD_HASH); }catch(e){}
      document.body.classList.add('is-admin');
      state.isAdmin = true;
      document.getElementById('adminModalOverlay').classList.remove('open');
      document.getElementById('settingsTabBtn').style.display = '';
      showToast('เข้าสู่โหมดผู้ดูแลระบบแล้ว');
      document.querySelector('.main-tab[data-tab="tabSettings"]').click();
    } else {
      showToast('รหัสผ่านไม่ถูกต้อง');
    }
  }
  document.getElementById('adminSubmitBtn').addEventListener('click', trySubmitAdminPassword);
  document.getElementById('adminPasswordInput').addEventListener('keydown', function(e){
    if(e.key === 'Enter'){ e.preventDefault(); trySubmitAdminPassword(); }
  });

  // share actions
  document.getElementById('shareCopyBtn').addEventListener('click', function(){
    var text = buildShareText();
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(text).then(function(){ showToast('คัดลอกข้อความแล้ว'); }).catch(function(){ fallbackCopy(text); });
    } else { fallbackCopy(text); }
  });
  document.getElementById('shareEmailBtn').addEventListener('click', function(){
    var text = buildShareText();
    var subject = encodeURIComponent('สรุปงานรถเข้ารับสินค้า');
    var body = encodeURIComponent(text);
    window.location.href = 'mailto:?subject=' + subject + '&body=' + body;
  });
  document.getElementById('shareLineBtn').addEventListener('click', function(){
    var text = buildShareText();
    var url = 'https://line.me/R/msg/text/?' + encodeURIComponent(text);
    window.open(url, '_blank');
  });
}

function fallbackCopy(text){
  var ta = document.createElement('textarea');
  ta.value = text; ta.style.position='fixed'; ta.style.opacity='0';
  document.body.appendChild(ta); ta.focus(); ta.select();
  try{ document.execCommand('copy'); showToast('คัดลอกข้อความแล้ว'); }
  catch(e){ showToast('คัดลอกไม่สำเร็จ กรุณาคัดลอกด้วยตนเอง'); }
  document.body.removeChild(ta);
}

function exportTable(kind){
  if(typeof XLSX === 'undefined'){ showToast('ไม่พบไลบรารี Excel/CSV export'); return; }
  var rows = lastFilteredForExport.map(function(t){
    return {
      'วันที่': dateKeyToFullLabel(t.dateKey),
      'DC': dcShortLabel(t.dc),
      'ทะเบียนรถ': t.plate,
      'เที่ยวที่': t.tripNo,
      'จุดเข้ารับ': t.pickupPoints,
      'ลูกค้า': t.customers.join(' | '),
      'เส้นทาง': t.routes.join(' | '),
      'ประเภทรถ': t.vehicleType,
      'สินค้า': t.dominantProduct ? PRODUCT_LABEL[t.dominantProduct] : '',
      'บิล AB (แห้ง)': t.dryBills, 'ชิ้น AB (แห้ง)': t.dryItems,
      'บิล CC (เย็น)': t.coldBills, 'ชิ้น CC (เย็น)': t.coldItems,
      'บิลรวม': t.bills, 'ชิ้นรวม': t.pieces,
      'รายได้ (บาท)': Math.round(t.revenue*100)/100,
      'เวลาจัดรถ': t.dispatch ? t.dispatch.raw.trim() : '',
      'เวลาถึง DC': t.arriveDC ? t.arriveDC.raw.trim() : '',
      'สถานะ': STATUS_LABEL[t.status],
    };
  });
  rows = planLabelRows(rows);
  var ws = XLSX.utils.json_to_sheet(rows);
  var wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'PickupTrips');
  var fname = 'pickup-vehicle-report_' + (state.dateFrom||'') + '_' + (state.dateTo||'');
  if(kind === 'xlsx') XLSX.writeFile(wb, fname + '.xlsx');
  else XLSX.writeFile(wb, fname + '.csv', { bookType:'csv' });
  showToast('ส่งออกไฟล์ ' + rows.length + ' แถวแล้ว');
}

// ---------- upload / re-parse ----------
var COLUMN_NAME_MAP = {
  'เลขที่จัดรถ':'b', 'เวลาจัดรถ':'c',
  'เลขที่ใบรายการกระจาย+เข้ารับ / ใบรายการเข้ารับอย่างเดียว':'e',
  'DC ต้นทาง':'g', 'ลูกค้า/บริษัท':'h', 'รหัสลูกค้า':'t', 'ทะเบียนรถ':'k',
  'เวลาถึงจุดที่เข้ารับ':'n', 'เวลาที่เริ่มสแกนรับชิ้นแรก':'o',
  'เวลาออกจากจุดที่เข้ารับ':'p', 'เวลาถึงดีซี':'q',
  'เวลาที่เริ่มลงสินค้า (สแกนรับชิ้นแรก)':'r', 'เวลาที่ลงสินค้าเสร็จ':'s',
  'เส้นทาง':'u', 'ราคาขนส่งทั้งหมด':'v', 'ประภทลูกค้า':'y',
  'รายได้ค่าขนส่งแห้ง':'aa', 'รายได้ค่าขนส่งเย็น':'af',
};

function handleUpload(file){
  var reader = new FileReader();
  reader.onload = function(evt){
    try{
      var data = new Uint8Array(evt.target.result);
      var wb = XLSX.read(data, { type:'array' });
      var sheet = wb.Sheets[wb.SheetNames[0]];
      var rowsAoA = XLSX.utils.sheet_to_json(sheet, { header:1, raw:false, defval:'' });

      var headerRowIdx = -1, headerRow = null;
      for(var i=0;i<Math.min(rowsAoA.length, 15);i++){
        if(rowsAoA[i].indexOf('เลขที่จัดรถ') !== -1){ headerRowIdx = i; headerRow = rowsAoA[i]; break; }
      }
      if(headerRowIdx === -1){ showToast('ไม่พบหัวตารางที่รู้จักในไฟล์นี้'); return; }

      // Parse the report's covered date range from the first few rows (e.g. "ตั้งแต่ dd/mm/yyyy ถึง dd/mm/yyyy")
      // to know the report's last day, used for the pending-vs-delay fallback rule.
      var newReportEndKey = null;
      for(var hi=0; hi<Math.min(rowsAoA.length, headerRowIdx); hi++){
        var rowText = (rowsAoA[hi]||[]).join(' ');
        var dm = rowText.match(/ถึง\s*(\d{1,2})\/(\d{1,2})\/(\d{4})/);
        if(dm){
          var dd=parseInt(dm[1],10), mm=parseInt(dm[2],10), yyBE=parseInt(dm[3],10);
          newReportEndKey = (yyBE-543) + '-' + String(mm).padStart(2,'0') + '-' + String(dd).padStart(2,'0');
          break;
        }
      }

      var idxOf = {};
      headerRow.forEach(function(name, idx){
        var key = COLUMN_NAME_MAP[name];
        if(key && !(key in idxOf)) idxOf[key] = idx;
      });
      var vehicleTypeIdxs = [];
      headerRow.forEach(function(name, idx){ if(name === 'ประเภทรถ') vehicleTypeIdxs.push(idx); });
      if(vehicleTypeIdxs[0] !== undefined) idxOf.l = vehicleTypeIdxs[0];
      if(vehicleTypeIdxs[1] !== undefined) idxOf.x = vehicleTypeIdxs[1];
      var billScanIdxs = [], itemScanIdxs = [], billDcIdxs = [], itemDcIdxs = [];
      headerRow.forEach(function(name, idx){
        var n = String(name).replace(/\s+/g,' ').trim();
        if(n.indexOf('จำนวนบิล พขร') === 0) billScanIdxs.push(idx);
        else if(n.indexOf('จำนวนชิ้น พขร') === 0) itemScanIdxs.push(idx);
        else if(n.indexOf('จำนวนบิล DC') === 0) billDcIdxs.push(idx);
        else if(n.indexOf('จำนวนชิ้น DC') === 0) itemDcIdxs.push(idx);
      });
      if(billScanIdxs[0]!==undefined) idxOf.ab = billScanIdxs[0];
      if(itemScanIdxs[0]!==undefined) idxOf.ac = itemScanIdxs[0];
      if(billDcIdxs[0]!==undefined) idxOf.ad = billDcIdxs[0];
      if(itemDcIdxs[0]!==undefined) idxOf.ae = itemDcIdxs[0];
      if(billScanIdxs[1]!==undefined) idxOf.ag = billScanIdxs[1];
      if(itemScanIdxs[1]!==undefined) idxOf.ah = itemScanIdxs[1];
      if(billDcIdxs[1]!==undefined) idxOf.ai = billDcIdxs[1];
      if(itemDcIdxs[1]!==undefined) idxOf.aj = itemDcIdxs[1];

      var required = ['b','c','g','h','k','n','q','u','v'];
      var missing = required.filter(function(k){ return idxOf[k]===undefined; });
      if(missing.length){ showToast('ไฟล์นี้ขาดคอลัมน์ที่จำเป็น: ' + missing.join(', ')); return; }

      var newRows = [];
      for(var r=headerRowIdx+1; r<rowsAoA.length; r++){
        var row = rowsAoA[r];
        var bVal = row[idxOf.b];
        if(!bVal) continue;
        var rec = {};
        Object.keys(idxOf).forEach(function(k){ rec[k] = row[idxOf[k]] !== undefined ? String(row[idxOf[k]]) : ''; });
        newRows.push(rec);
      }
      if(!newRows.length){ showToast('ไม่พบแถวข้อมูลในไฟล์นี้'); return; }

      if(newReportEndKey) REPORT_END_DATE_KEY = newReportEndKey;
      processRawRows(newRows);
      buildDCOptions(); buildZoneOptions(); syncDateInputs(); updateHeaderMeta();
      __custCache = null;
      applyPeriod(state.granularity || 'month');
      showToast('อัปเดตข้อมูลจาก "' + file.name + '" สำเร็จ (' + newRows.length + ' แถว)');
    } catch(err){
      console.error(err);
      showToast('เกิดข้อผิดพลาดขณะอ่านไฟล์: ' + err.message);
    }
  };
  reader.readAsArrayBuffer(file);
}

// ---------- init ----------
// ===================== [ปรับ 16/11/2569] แผนเดิม/แผนใหม่: ปุ่มเลือก · 3 กรอบ · หน้าตั้งค่าแผนลูกค้า =====================
function thDateKey(k){ if(!k) return '-'; var p = k.split('-'), M = ['','ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.']; return (+p[2]) + ' ' + M[+p[1]] + ' ' + (+p[0] + 543); }
function planScopeRows(){ return PLAN.rows.filter(function(p){ if(state.selectedDC) return p.dcCode === state.selectedDC; if(state.selectedZone) return (ZONE_LOOKUP[p.dcCode] || 'ไม่ระบุภาค') === state.selectedZone; return true; }); }
function planAgg(trips){
  var keys = new Set(trips.map(function(t){ return t.key; })), o = { ทัน:{ c:new Set(), b:0, i:0 }, ตก:{ c:new Set(), b:0, i:0 } };
  state.lineItems.forEach(function(li){
    if(!li.plan) return; var t = state.lineItemTripMap.get(li.idx); if(!t || !keys.has(t.key)) return;
    var g = o[li.plan.group]; g.c.add(li.plan.dcCode + '|' + li.plan.code); g.b += li.dryBills + li.coldBills; g.i += li.dryItems + li.coldItems;
  });
  return { cust:o.ทัน.c.size + o.ตก.c.size, custT:o.ทัน.c.size, custL:o.ตก.c.size, bills:o.ทัน.b + o.ตก.b, billsT:o.ทัน.b, billsL:o.ตก.b, items:o.ทัน.i + o.ตก.i, itemsT:o.ทัน.i, itemsL:o.ตก.i };
}
function renderPlanBoxes(filtered){
  var box = document.getElementById('planBoxes'), note = document.getElementById('planNote'), on = isNewPlan();
  document.body.classList.toggle('plan-new', on);
  document.querySelectorAll('#planSeg [data-plan]').forEach(function(b){ var a = b.dataset.plan === (on ? 'new' : 'old'); b.classList.toggle('on', a); b.setAttribute('aria-pressed', a ? 'true' : 'false'); });
  if(box) box.hidden = !on; if(note) note.hidden = !on;
  if(!on) return;
  var sc = planScopeRows(), nT = sc.filter(function(p){ return p.group === 'ทัน'; }).length;
  note.innerHTML = '📋 <b>แผนใหม่</b> (เริ่มใช้ ' + thDateKey(PLAN_START) + ') · วัดเฉพาะสินค้าแห้งของลูกค้าในแผน ' + fmtInt(sc.length) + ' ราย · <span class="product-ab">กลุ่มทัน ' + fmtInt(nT) + ' ราย ตัดตามเวลา DC</span> · <span class="product-cc">กลุ่มตก ' + fmtInt(sc.length - nT) + ' ราย ตัด 20:00</span>' + (state.dateFrom && state.dateFrom < PLAN_START ? ' · <span class="muted">ช่วงที่เลือกมีวันก่อนเริ่มแผน (คำนวณย้อนหลังเพื่อเทียบ)</span>' : '');
  var A = planAgg(filtered || applyFilters()), pi = prevTripsForPeriod(), P = pi ? planAgg(pi.trips) : null;
  var cards = [
    { id:'planCust', l:'ลูกค้าในแผนที่เข้ารับ', v:fmtInt(A.cust) + ' / ' + fmtInt(sc.length) + ' ราย', a:A.custT, b:A.custL, ta:' / ' + fmtInt(nT), tb:' / ' + fmtInt(sc.length - nT), cur:A.cust, prev:P && P.cust, acc:'accent-navy' },
    { id:'planBills', l:'จำนวนบิล (ลูกค้าในแผน)', v:fmtInt(A.bills), a:A.billsT, b:A.billsL, ta:'', tb:'', cur:A.bills, prev:P && P.bills, acc:'accent-gold' },
    { id:'planItems', l:'จำนวนกล่อง (ลูกค้าในแผน)', v:fmtInt(A.items), a:A.itemsT, b:A.itemsL, ta:'', tb:'', cur:A.items, prev:P && P.items, acc:'accent-route' },
  ];
  box.innerHTML = cards.map(function(c){
    var d = P ? fmtDelta(c.cur, c.prev, { mode:'pct', good:true }) : null;
    return '<div class="card kpi-card kpi-mini ' + c.acc + '" id="' + c.id + '"><div class="kpi-label">' + c.l + '</div><div class="kpi-value tabnum">' + c.v + '</div>' +
      '<div class="kpi-cmp">' + (d ? '<span class="' + (d.cls || '') + '">' + d.h + ' เทียบช่วงก่อน</span>' : '<span class="muted">ไม่มีช่วงก่อนหน้า</span>') + '</div>' +
      '<div class="kpi-breakdown"><div class="bd-item"><span class="bd-label product-ab">กลุ่มทัน</span><span class="bd-value tabnum product-ab">' + fmtInt(c.a) + c.ta + '</span></div>' +
      '<div class="bd-item"><span class="bd-label product-cc">กลุ่มตก</span><span class="bd-value tabnum product-cc">' + fmtInt(c.b) + c.tb + '</span></div></div></div>';
  }).join('');
}
function setPlanMode(mode, quiet){
  if(mode === 'new' && !PLAN.rows.length){ showToast('ยังไม่มีแผนลูกค้าในระบบ · ผู้ดูแลนำเข้าได้ที่ ตั้งค่า → แผนลูกค้า'); mode = 'old'; quiet = true; }
  state.planMode = mode; try{ localStorage.setItem('pickup-plan', mode); }catch(e){}
  rebuildTripsFromLineItems(); buildZoneOptions(); buildDCOptions(); updateHeaderMeta(); renderAll();
  if(document.getElementById('tabProblems').style.display !== 'none') renderProblemsTab();
  planRelabelDom(); renderPlanSettings();
  if(!quiet) showToast(mode === 'new' ? 'แสดงผลตามแผนใหม่ (เฉพาะสินค้าแห้งของลูกค้าในแผน · แยกกลุ่มทัน/ตก Cut off)' : 'แสดงผลตามแผนเดิม');
}
function planTimeStr(v){
  if(typeof v === 'number' && isFinite(v)){ var m = Math.round((v % 1) * 1440); return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); }
  var t = String(v || '').trim(), mm = t.match(/^(\d{1,2})[:.](\d{2})/); return mm ? mm[1].padStart(2, '0') + ':' + mm[2] : t;
}
var PLAN_HEAD = ['DC ต้นทาง','รหัสลูกค้า','ชื่อบริษัท','ตำบล/แขวง','อำเภอ/เขต','โซนลูกค้า','ประเภทลูกค้า','ประเภทรถ','ผล','เวลาเข้าคลัง'];
// อ่านไฟล์แผน: หาแถวหัวตาราง จับคอลัมน์ตามชื่อ · โซนว่างใช้โซนแถวก่อนหน้า · รหัสซ้ำใน DC เดียวกันเก็บแถวแรก
function parsePlanSheet(aoa){
  var hi = aoa.findIndex(function(r){ return r && r.some(function(c){ return String(c).trim() === 'รหัสลูกค้า'; }); });
  if(hi < 0) throw new Error('ไม่พบหัวตาราง "รหัสลูกค้า"');
  var H = aoa[hi].map(function(c){ return String(c).trim(); }), ix = PLAN_HEAD.map(function(h){ return H.indexOf(h); });
  if(ix[0] < 0 || ix[1] < 0 || ix[8] < 0) throw new Error('ต้องมีคอลัมน์ DC ต้นทาง, รหัสลูกค้า และ ผล');
  var out = [], seen = {}, lastZone = '', dup = 0;
  aoa.slice(hi + 1).forEach(function(r){
    var v = ix.map(function(i){ return i < 0 ? '' : r[i]; });
    if(!v[1] && v[1] !== 0) return;
    v[1] = planNormCode(v[1]); v[9] = planTimeStr(v[9]); v[8] = planGroupOf(v[8]) + ' Cut off';
    v = v.map(function(x){ return x === null || x === undefined ? '' : String(x).trim(); });
    if(v[5]) lastZone = v[5]; else v[5] = lastZone;
    var k = dcCode(v[0]) + '|' + v[1]; if(seen[k]){ dup++; return; } seen[k] = 1;
    out.push(v);
  });
  return { rows:out, dup:dup };
}
async function savePlanRows(rows, msg){
  if(!window.__pickupSavePlan) throw new Error('ระบบบันทึกแผนยังไม่พร้อม');
  await window.__pickupSavePlan(rows);
  window.__PICKUP_DATA.plan = rows; loadPlan(rows);
  if(isNewPlan() || state.planMode === 'new') setPlanMode(PLAN.rows.length ? state.planMode : 'old', true); else renderPlanSettings();
  if(msg) showToast(msg);
}
var planUi = { q:'', g:'', prefill:null };
function renderPlanSettings(){
  var sum = document.getElementById('sumPlan'); if(!sum) return;
  var nT = PLAN.rows.filter(function(p){ return p.group === 'ทัน'; }).length, out = planOutside();
  sum.textContent = PLAN.rows.length ? 'ในแผน ' + fmtInt(PLAN.rows.length) + ' ราย (ทัน ' + fmtInt(nT) + ' · ตก ' + fmtInt(PLAN.rows.length - nT) + ') · สินค้าแห้งนอกแผนรอระบุ ' + fmtInt(out.length) + ' ราย' : 'ยังไม่มีแผน · กดเพื่อนำเข้าไฟล์ Excel';
  var tb = document.getElementById('planTableBody'); if(!tb) return;
  var q = planUi.q.toLowerCase(), rows = PLAN.rows.map(function(p, i){ return { p:p, i:i }; }).filter(function(o){ var p = o.p; return (!planUi.g || p.group === planUi.g) && (!q || (p.code + ' ' + p.name + ' ' + p.zone + ' ' + p.dc).toLowerCase().indexOf(q) !== -1); });
  document.getElementById('planCount').textContent = 'แสดง ' + fmtInt(rows.length) + ' จาก ' + fmtInt(PLAN.rows.length) + ' ราย';
  tb.innerHTML = rows.map(function(o){ var p = o.p; return '<tr><td>' + escapeHtml(dcShortLabel(p.dc) || p.dc) + '</td><td class="mono">' + escapeHtml(p.code) + '</td><td>' + escapeHtml(p.name) + '</td><td>' + escapeHtml(p.zone) + '</td><td>' + escapeHtml(p.vtype) + '</td><td><span class="product-tag tag-' + (p.group === 'ทัน' ? 'ab' : 'cc') + '">' + p.group + ' Cut off</span></td><td class="tabnum">' + escapeHtml(p.time) + '</td><td><button class="btn-ghost sm" type="button" data-plan-del="' + o.i + '">ลบ</button></td></tr>'; }).join('') || '<tr><td colspan="8" class="muted">ไม่มีรายการ</td></tr>';
  var ob = document.getElementById('planOutBody');
  document.getElementById('planOutCount').textContent = 'ลูกค้าสินค้าแห้งที่ไม่อยู่ในแผน ' + fmtInt(out.length) + ' ราย · ตอนนี้ไม่นำมาคำนวณในแผนใหม่ · กด "เพิ่มเข้าแผน" เพื่อระบุกลุ่ม';
  ob.innerHTML = out.slice(0, 300).map(function(o, i){ return '<tr><td>' + escapeHtml(dcShortLabel(o.dc) || o.dc) + '</td><td class="mono">' + escapeHtml(o.code) + '</td><td>' + escapeHtml(o.name) + '</td><td class="tabnum">' + fmtInt(o.lines) + '</td><td class="tabnum">' + fmtInt(o.bills) + '</td><td class="tabnum">' + fmtInt(o.items) + '</td><td>' + thDateKey(o.first) + ' – ' + thDateKey(o.last) + '</td><td><button class="btn-ghost sm" type="button" data-plan-take="' + i + '">เพิ่มเข้าแผน</button></td></tr>'; }).join('') || '<tr><td colspan="8" class="muted">ไม่มีลูกค้าสินค้าแห้งนอกแผน</td></tr>';
  planUi.out = out;
}
function escapeHtml(x){ return String(x === null || x === undefined ? '' : x).replace(/[&<>"]/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]; }); }
function wirePlan(){
  var acts = document.querySelector('.acts');
  if(acts && !document.getElementById('planSeg')){
    var seg = document.createElement('div'); seg.className = 'plan-seg'; seg.id = 'planSeg'; seg.setAttribute('role', 'group'); seg.setAttribute('aria-label', 'เลือกแผนที่ใช้วัดผล');
    seg.innerHTML = '<button type="button" data-plan="old">แผนเดิม</button><button type="button" data-plan="new">แผนใหม่</button>';
    acts.insertBefore(seg, acts.firstChild);
    seg.addEventListener('click', function(e){ var b = e.target.closest('[data-plan]'); if(b && b.dataset.plan !== (isNewPlan() ? 'new' : 'old')) setPlanMode(b.dataset.plan); });
  }
  planObserve();
  var el = function(id){ return document.getElementById(id); };
  if(el('planSearch')) el('planSearch').addEventListener('input', function(e){ planUi.q = e.target.value; renderPlanSettings(); });
  if(el('planGroupFilter')) el('planGroupFilter').addEventListener('change', function(e){ planUi.g = e.target.value; renderPlanSettings(); });
  if(el('planImportBtn')) el('planImportBtn').addEventListener('click', function(){ el('planFile').click(); });
  if(el('planFile')) el('planFile').addEventListener('change', async function(e){
    var f = e.target.files[0]; e.target.value = ''; if(!f) return;
    try{
      var wb = XLSX.read(await f.arrayBuffer(), { type:'array' }), aoa = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header:1, raw:true, defval:'' });
      var R = parsePlanSheet(aoa), nT = R.rows.filter(function(r){ return r[8].indexOf('ทัน') === 0; }).length;
      if(!R.rows.length) throw new Error('ไม่พบรายการลูกค้า');
      if(!confirm('นำเข้าแผนจาก ' + f.name + '\n' + R.rows.length + ' ราย (ทัน ' + nT + ' · ตก ' + (R.rows.length - nT) + ')' + (R.dup ? '\nรหัสซ้ำใน DC เดียวกัน ' + R.dup + ' แถว (เก็บแถวแรก)' : '') + '\n\nจะแทนที่แผนเดิม ' + PLAN.rows.length + ' ราย ยืนยัน?')) return;
      await savePlanRows(R.rows, 'นำเข้าแผนแล้ว ' + R.rows.length + ' ราย');
    }catch(err){ showToast('นำเข้าแผนไม่สำเร็จ: ' + err.message); }
  });
  if(el('planExportBtn')) el('planExportBtn').addEventListener('click', function(){
    var ws = XLSX.utils.aoa_to_sheet([PLAN_HEAD].concat(planRowsOut())), wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'แผนลูกค้า'); XLSX.writeFile(wb, 'แผนลูกค้า-Pickup.xlsx');
  });
  if(el('planAddForm')) el('planAddForm').addEventListener('submit', async function(e){
    e.preventDefault(); var F = e.target, v = function(n){ return String(F.elements[n].value || '').trim(); };
    var code = planNormCode(v('code')), dc = v('dc');
    if(!dc || !code){ showToast('ใส่ DC และรหัสลูกค้า'); return; }
    if(PLAN.map.has(dcCode(dc) + '|' + code)){ showToast('รหัส ' + code + ' มีในแผนของ DC นี้แล้ว'); return; }
    var rows = planRowsOut().concat([[dc, code, v('name'), '', v('district'), v('zone'), v('ctype'), v('vtype'), v('group') + ' Cut off', planTimeStr(v('time'))]]);
    try{ await savePlanRows(rows, 'เพิ่ม ' + code + ' เข้าแผนแล้ว'); F.reset(); }catch(err){ showToast('บันทึกไม่สำเร็จ: ' + err.message); }
  });
  document.addEventListener('click', async function(e){
    var d = e.target.closest('[data-plan-del]'), t = e.target.closest('[data-plan-take]');
    if(d){
      var p = PLAN.rows[+d.dataset.planDel]; if(!p || !confirm('ลบ ' + p.code + ' ' + p.name + ' ออกจากแผน?')) return;
      var rows = planRowsOut(); rows.splice(+d.dataset.planDel, 1);
      try{ await savePlanRows(rows, 'ลบ ' + p.code + ' ออกจากแผนแล้ว'); }catch(err){ showToast('บันทึกไม่สำเร็จ: ' + err.message); }
    }
    if(t){
      var o = planUi.out && planUi.out[+t.dataset.planTake], F = el('planAddForm'); if(!o || !F) return;
      var dcSel = F.elements.dc, opt = Array.from(dcSel.options).find(function(x){ return dcCode(x.value) === o.dcCode; });
      if(opt) dcSel.value = opt.value; F.elements.code.value = o.code; F.elements.name.value = o.name;
      F.scrollIntoView({ behavior:'smooth', block:'center' }); F.elements.group.focus();
    }
  });
  if(state.planMode === 'new' && !PLAN.rows.length) state.planMode = 'old';
  if(isNewPlan()) setPlanMode('new', true); else { renderPlanBoxes(); renderPlanSettings(); }
}

function init(){
  try {
    try {
      var dcDirEl = document.getElementById('dc-directory');
      if(dcDirEl){
        DC_DIRECTORY = JSON.parse(dcDirEl.textContent) || {};
        Object.keys(DC_DIRECTORY).forEach(function(code){ ZONE_LOOKUP[code] = DC_DIRECTORY[code].zone; });
      }
    } catch(zErr){ console.error('[dashboard] dc directory parse failed:', zErr); }
    try {
      var reportMetaEl = document.getElementById('report-meta');
      if(reportMetaEl){ var rm = JSON.parse(reportMetaEl.textContent); REPORT_END_DATE_KEY = rm && rm.to ? rm.to : null; }
    } catch(rErr){ console.error('[dashboard] report meta parse failed:', rErr); }

    var loadedSettings = loadSettings();
    applySettingsToRuntime(loadedSettings);
    state.draftExcludedCustomers = loadedSettings.excludedCustomers.slice();
    state.draftDcCutoffs = JSON.parse(JSON.stringify(loadedSettings.dcCutoffs));

    loadPlan((window.__PICKUP_DATA && window.__PICKUP_DATA.plan) || []);
    try{ state.planMode = localStorage.getItem('pickup-plan') === 'new' ? 'new' : 'old'; }catch(pErr){ state.planMode = 'old'; }
    var raw = (window.__PICKUP_DATA && window.__PICKUP_DATA.rows) || [];
    processRawRows(raw);
    buildZoneOptions();
    buildDCOptions();
    syncDateInputs();
    updateHeaderMeta();
    buildShareChecklist();
    wireEvents();
    (function(){
      var ok = window.__PICKUP_ADMIN === true; // checked by Apps Script (boot.js)
      if(ok){ state.isAdmin = true; document.body.classList.add('is-admin'); document.getElementById('settingsTabBtn').style.display = ''; }
      function askAdmin(){ if(!state.isAdmin && location.hash === '#admin') location.reload(); }
      window.addEventListener('hashchange', askAdmin);
      setTimeout(askAdmin, 0);
    })();
    wireExtra();
    wirePlan();
    setComparePreset('yday');
    applyPeriod('month');
  } catch(err){
    console.error('[dashboard] init failed:', err);
    showToast('เกิดข้อผิดพลาดในการโหลดแดชบอร์ด: ' + err.message);
  }
}

if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
