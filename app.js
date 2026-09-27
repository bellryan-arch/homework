// Math Practice (single child) - offline
// Includes: 30 min session limit, word problems tied to grade, parent dashboard (password camrose),
// backups import/export, adaptive practice, mistake review & edits.

const $ = (id) => document.getElementById(id);

// Controls
const modeSelect = $("modeSelect");
const gradeSelect = $("gradeSelect");
const countSelect = $("countSelect");
const focusSelect = $("focusSelect");
const childSelect = $("childSelect");
const mathReward = $("mathReward");
const mathRewardTitle = $("mathRewardTitle");
const mathRewardText = $("mathRewardText");
const mathRewardLink = $("mathRewardLink");

const newBtn = $("newBtn");
const showSettingsBtn = $("showSettingsBtn");
const resetBtn = $("resetBtn");
const checkBtn = $("checkBtn");
const showSolutionsBtn = $("showSolutionsBtn");
const printBtn = $("printBtn");
const pauseBtn = $("pauseBtn");
const dashboardBtn = $("dashboardBtn");

// Parent settings
const allowSolutionsEl = $("allowSolutions");
const requireAllAnsweredEl = $("requireAllAnswered");
const masteryThresholdEl = $("masteryThreshold");
const completionThresholdEl = $("completionThreshold");
const minPagesPerLevelEl = $("minPagesPerLevel");
const currentLevelSelectEl = $("currentLevelSelect");
const autoAdvanceEl = $("autoAdvance");

// UI
const settingsRow = $("settingsRow");
const questionsEl = $("questions");
const feedbackEl = $("feedback");
const timerEl = $("timer");
const scoreEl = $("score");
const streakEl = $("streak");
const sessionLeftEl = $("sessionLeft");
const pausesLeftEl = $("pausesLeft");
const sheetMetaEl = $("sheetMeta");

// Calendar
const calendarEl = $("calendar");

// Dashboard
const modalBackdrop = $("modalBackdrop");
const closeDashboardBtn = $("closeDashboardBtn");
const dashSummaryEl = $("dashSummary");
const dashSkillsEl = $("dashSkills");
const dashRecentEl = $("dashRecent");
const exportBtn = $("exportBtn");
const downloadBackupBtn = $("downloadBackupBtn");
const resetDataBtn = $("resetDataBtn");
const exportOut = $("exportOut");
const importIn = $("importIn");
const importBackupBtn = $("importBackupBtn");
const importFile = $("importFile");
const importStatus = $("importStatus");

// Password modal
const passwordModal = $("passwordModal");
const passwordInput = $("passwordInput");
const passwordSubmitBtn = $("passwordSubmitBtn");
const passwordCancelBtn = $("passwordCancelBtn");
const passwordError = $("passwordError");

const DEFAULT_PASSWORD = "camrose";
const LS_KEY = "kumon_single_v8";
const SESSION_LIMIT_MS = 30 * 60 * 1000;

const SKILLS = ["addsub","muldiv","decimals","fractions","percents","orderops"];
const SKILL_LABELS = {
  addsub: "Add/Subtract",
  muldiv: "Multiply/Divide",
  decimals: "Decimals",
  fractions: "Fractions",
  percents: "Percents",
  orderops: "Order of Ops",
};

let page = null;
let checkedOnce = false;
let settingsHidden = false;
let timer = { start: null, handle: null };
let sessionExpired = false;
let pausesLeft = 2;
let pauseActive = false;
let scratchObservers = [];
const iosTouch = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform==="MacIntel" && navigator.maxTouchPoints>1);


function clamp(n, lo, hi){ return Math.max(lo, Math.min(hi, n)); }
function randInt(min,max){ return Math.floor(Math.random()*(max-min+1))+min; }
function choice(arr){ return arr[randInt(0, arr.length-1)]; }
function pad2(n){ return String(n).padStart(2,"0"); }
function fmtMs(ms){
  const s=Math.floor(ms/1000);
  return `${pad2(Math.floor(s/60))}:${pad2(s%60)}`;
}
function nowIsoDate(){
  const d=new Date();
  return d.toISOString().slice(0,10);
}
function cryptoId(){
  if (crypto?.getRandomValues){
    const a=new Uint32Array(1); crypto.getRandomValues(a); return a[0].toString(16);
  }
  return String(Math.random()).slice(2);
}

function defaultProgress(){
  return {
    version: 8,
    currentLevel: "1",
    minPagesPerLevel: 20,
    difficulty: { addsub: 1, muldiv: 1, decimals: 1, fractions: 1, percents: 1, orderops: 1 },
    skills: Object.fromEntries(SKILLS.map(s => [s, { attempts:0, correct:0, streak:0, bestStreak:0, avgMs:null }])),
    pages: [],
    completedDates: {},
  };
}

function loadProgress(){
  // If you previously used an older/broken version, we migrate safely or reset cleanly.
  const rawV8 = localStorage.getItem(LS_KEY);
  const rawLegacy = localStorage.getItem("kumon_single_v7");

  const raw = rawV8 ?? rawLegacy;
  if (!raw) return defaultProgress();

  try{
    const p = JSON.parse(raw);
    const d = defaultProgress();

    // Hard validation: if structure doesn't look right, reset
    if (!p || typeof p !== "object") return d;
    if (!p.skills || typeof p.skills !== "object") return d;
    if (!p.pages || !Array.isArray(p.pages)) p.pages = [];

    const merged = { ...d, ...p };
    merged.difficulty = { ...d.difficulty, ...(merged.difficulty||{}) };
    merged.skills = { ...d.skills, ...(merged.skills||{}) };
    merged.pages = merged.pages || [];
    merged.completedDates = merged.completedDates || {};

    // Ensure currentLevel is a numeric string 1-8
    const n = Number(merged.currentLevel);
    merged.currentLevel = String(Number.isFinite(n) ? clamp(n,1,8) : 1);

    // Save into v8 key so future loads are clean
    localStorage.setItem(LS_KEY, JSON.stringify(merged));
    return merged;
  }catch{
    return defaultProgress();
  }
}
function saveProgress(){ localStorage.setItem(LS_KEY, JSON.stringify(progress)); }
let progress = loadProgress();

// ---------- Parent settings sync ----------
function syncParentSettingsFromProgress(){
  minPagesPerLevelEl.value = String(progress.minPagesPerLevel ?? 20);
  currentLevelSelectEl.value = String(clamp(Number(progress.currentLevel ?? 1), 1, 8));
}
function syncProgressFromParentSettings(){
  progress.minPagesPerLevel = clamp(Number(minPagesPerLevelEl.value||20), 1, 200);
  progress.currentLevel = String(clamp(Number(currentLevelSelectEl.value||1), 1, 8));
  saveProgress();
  renderCalendar();
  renderDashboard();
}

// ---------- Math helpers ----------
function gcd(a,b){ a=Math.abs(a); b=Math.abs(b); while(b){ [a,b]=[b,a%b]; } return a; }
function lcm(a,b){ return Math.abs(a*b)/gcd(a,b); }
function normalizeAnswer(s){ return String(s??"").trim().replace(/\s+/g,""); }
function isFrac(s){ return /^[+-]?\d+\/[+-]?\d+$/.test(s); }
function fracToNum(s){ const [a,b]=s.split("/").map(Number); return b===0?NaN:a/b; }
function answersMatch(user, correct){
  const u = normalizeAnswer(user);
  if (!u) return false;

  if (typeof correct === "string" && isFrac(correct)){
    if (isFrac(u)) return Math.abs(fracToNum(u)-fracToNum(correct)) < 1e-9;
    const un=Number(u), cn=fracToNum(correct);
    return Number.isFinite(un) && Math.abs(un-cn) < 1e-6;
  }
  const cn = (typeof correct === "number") ? correct : Number(correct);
  const un = Number(u);
  if (!Number.isFinite(un) || !Number.isFinite(cn)) return u === normalizeAnswer(String(correct));
  return Math.abs(un-cn) < 1e-6;
}

function levelNum(level){
  const n = Number(level);
  return Number.isFinite(n) ? n : 4;
}
function levelScalar(level){
  // Smoothly scale difficulty from Grade 1 → 8
  const n = clamp(levelNum(level), 1, 8);
  // 1 => 0.45, 4 => 0.85, 8 => 1.35
  return 0.35 + (n/8)*1.0;
}
function diffScalar(step){ return 0.75 + step*0.15; }

function ranges(level, skill){
  const n = clamp(levelNum(level), 1, 8);
  const s = levelScalar(level) * diffScalar(progress.difficulty[skill] ?? 1);

  // Grade-aware caps (keep things truly Grade-1/2 friendly)
  const addCaps = [0, 20, 100, 500, 900, 1500, 3000, 5000, 8000]; // index by grade
  const addMax = Math.round(addCaps[n] * (0.75 + (s/1.35)*0.5));

  const mulA_cap = [0, 0, 10, 12, 18, 22, 28, 35, 45];
  const mulB_cap = [0, 0, 12, 18, 24, 30, 40, 55, 75];
  const mulA = clamp(Math.round(6*s), 2, mulA_cap[n] || 18);
  const mulB = clamp(Math.round(10*s), 2, mulB_cap[n] || 24);

  const divB = clamp(Math.round(6*s), 2, mulA_cap[n] || 18);

  const decPlaces = (n <= 4) ? 0 : (n === 5 ? 2 : (n === 6 ? 2 : 3));

  const fracDenPool = (n <= 2) ? [2,3,4]
    : (n === 3) ? [2,3,4,5,6,8]
    : (n === 4) ? [2,3,4,5,6,8,10,12]
    : [2,3,4,5,6,8,10,12,15,16];

  return { addMax, mulA, mulB, divB, decPlaces, fracDenPool };
}

// ---------- Question builders ----------
function qAddSub(level){
  const r = ranges(level,"addsub");
  let a=randInt(0,r.addMax), b=randInt(0,r.addMax);
  const op = choice(["+","-","+"]);
  if (op==="-" && b>a) [a,b]=[b,a];
  const ans = op==="+" ? a+b : a-b;
  return { skill:"addsub", text:`${a} ${op} ${b} =`, answer: ans, hint:"Add/Subtract", explain: op==="+"?"Line up place values.":"Borrow if needed." };
}
function qMulDiv(level){
  const r = ranges(level,"muldiv");
  const kind = choice(["mul","div","mul"]);
  if (kind==="mul"){
    const a=randInt(2,r.mulA), b=randInt(2,r.mulB);
    return { skill:"muldiv", text:`${a} × ${b} =`, answer:a*b, hint:"Multiplication", explain:"Break apart numbers to multiply." };
  } else {
    const b=randInt(2,r.divB);
    const ans=randInt(2, clamp(Math.round(18*levelScalar(level)), 10, 40));
    return { skill:"muldiv", text:`${b*ans} ÷ ${b} =`, answer: ans, hint:"Division", explain:"Division is inverse of multiplication." };
  }
}
function qDecimals(level){
  const r = ranges(level,"decimals");
  const p=Math.max(1,r.decPlaces||1);
  let a=Number((randInt(10,999)/Math.pow(10,p)).toFixed(p));
  let b=Number((randInt(10,999)/Math.pow(10,p)).toFixed(p));
  const op=choice(["+","-"]);
  if (op==="-" && b>a) [a,b]=[b,a];
  const ans = op==="+" ? a+b : a-b;
  return { skill:"decimals", text:`${a.toFixed(p)} ${op} ${b.toFixed(p)} =`, answer: ans.toFixed(p), hint:"Decimals", explain:"Line up decimal points." };
}
function qFractions(level){
  const r = ranges(level,"fractions");
  const dens=r.fracDenPool;
  const kind = (level==="4") ? choice(["simplify","simplify","add_same"]) : choice(["simplify","add","simplify"]);
  if (kind==="simplify"){
    const den=choice(dens), factor=randInt(2,6), n=randInt(1,den-1);
    const num=n*factor, d=den*factor, g=gcd(num,d);
    return { skill:"fractions", text:`Simplify: ${num}/${d} =`, answer:`${num/g}/${d/g}`, hint:"Fractions", explain:"Divide top and bottom by GCF." };
  }
  if (kind==="add_same"){
    const d=choice([2,3,4,5,6,8,10]);
    const a=randInt(1,d-1), b=randInt(1,d-1);
    const num=a+b, g=gcd(num,d);
    return { skill:"fractions", text:`${a}/${d} + ${b}/${d} =`, answer:`${num/g}/${d/g}`, hint:"Fractions", explain:"Same denominator: add numerators, reduce." };
  }
  const d1=choice(dens), d2=choice([d1, choice(dens)]);
  const a=randInt(1,d1-1), b=randInt(1,d2-1);
  const L=lcm(d1,d2);
  const num=a*(L/d1)+b*(L/d2), g=gcd(num,L);
  return { skill:"fractions", text:`${a}/${d1} + ${b}/${d2} =`, answer:`${num/g}/${L/g}`, hint:"Fractions", explain:"Common denominator, add, reduce." };
}
function qPercents(level){
  const p = (level==="4"||level==="5") ? choice([10,20,25,50]) : choice([5,10,15,20,25,30,40,50]);
  const base=randInt(20, clamp(Math.round(500*levelScalar(level)), 120, 800));
  const ans=(p/100)*base;
  const out = Number.isInteger(ans) ? String(ans) : String(Math.round(ans*100)/100);
  return { skill:"percents", text:`${p}% of ${base} =`, answer: out, hint:"Percents", explain:"Percent → decimal, then multiply." };
}
function qOrderOps(level){
  const a=randInt(2, 30), b=randInt(2, 15), c=randInt(2, 10);
  const kind=choice(["nop","par","nop"]);
  if (kind==="nop"){
    return { skill:"orderops", text:`${a} + ${b} × ${c} =`, answer: a + b*c, hint:"Order of Ops", explain:"Multiply before adding." };
  }
  return { skill:"orderops", text:`(${a} + ${b}) × ${c} =`, answer: (a+b)*c, hint:"Order of Ops", explain:"Parentheses first." };
}

function qWord(level){
  // Word problems tied to grade/level.
  // Keep early grades mostly one-step; later grades can include 2-step setups.
  const n = clamp(levelNum(level), 1, 8);

  const domains = (n<=1) ? ["addsub"]
    : (n===2) ? ["addsub","muldiv"]
    : (n===3) ? ["addsub","muldiv","fractions"]
    : (n===4) ? ["addsub","muldiv","fractions"]
    : (n===5) ? ["addsub","muldiv","decimals","fractions","orderops"]
    : (n===6) ? ["addsub","muldiv","decimals","fractions","percents","orderops"]
    : ["addsub","muldiv","decimals","fractions","percents","orderops"];

  const domain = choice(domains);

  if (domain==="addsub"){
    const max = (n<=1)?20:(n===2?200:(n<=4?800:3000));
    const a=randInt(0,max), b=randInt(0,max);
    if (Math.random()<0.5){
      return { skill:"addsub", text:`Word: Mia has ${a} stickers. She gets ${b} more.
How many stickers now?`, answer: a+b, hint:"Add", explain:"Total = start + more." };
    } else {
      const big=Math.max(a,b), small=Math.min(a,b);
      return { skill:"addsub", text:`Word: A box has ${big} crayons. Another has ${small}.
How many more crayons in the first box?`, answer: big-small, hint:"Subtract", explain:"Difference = larger − smaller." };
    }
  }

  if (domain==="muldiv"){
    const packs=randInt(2, n<=2?6:(n<=4?10:14));
    const per=randInt(2, n<=2?8:(n<=4?12:25));
    if (Math.random()<0.5){
      return { skill:"muldiv", text:`Word: There are ${packs} bags. Each bag has ${per} apples.
How many apples total?`, answer: packs*per, hint:"Multiply", explain:"Equal groups → multiply." };
    } else {
      const total=packs*per;
      return { skill:"muldiv", text:`Word: ${total} cookies are shared equally into ${packs} plates.
How many cookies per plate?`, answer: total/packs, hint:"Divide", explain:"Equal sharing → divide." };
    }
  }

  if (domain==="decimals"){
    let a=Number((randInt(125,995)/100).toFixed(2));
    let b=Number((randInt(105,875)/100).toFixed(2));
    const op=Math.random()<0.5?"+":"-";
    if (op==="-" && b>a) [a,b]=[b,a];
    const ans = op==="+" ? a+b : a-b;
    const q = op==="+" 
      ? `Word: A notebook costs $${a.toFixed(2)} and a pen costs $${b.toFixed(2)}.
How much together?`
      : `Word: You have $${a.toFixed(2)}. You spend $${b.toFixed(2)}.
How much left?`;
    return { skill:"decimals", text:q, answer: ans.toFixed(2), hint:"Money (decimals)", explain:"Line up decimal points." };
  }

  if (domain==="fractions"){
    if (n<=3){
      const den=choice([2,3,4,5,6,8,10]);
      const num=randInt(1,den-1);
      const total=randInt(12,60);
      const scaled=total-(total%den);
      const ans=(num/den)*scaled;
      return { skill:"fractions", text:`Word: ${num}/${den} of ${scaled} students wore a hat.
How many students wore a hat?`, answer: ans, hint:"Fraction of a number", explain:"Divide by denominator, multiply by numerator." };
    } else {
      const d1=choice([2,3,4,5,6,8,10,12]);
      const d2=choice([d1,4,6,8,12]);
      const a=randInt(1,d1-1), b=randInt(1,d2-1);
      const L=lcm(d1,d2);
      const num=a*(L/d1)+b*(L/d2), g=gcd(num,L);
      return { skill:"fractions", text:`Word: Kara drank ${a}/${d1} of a bottle in the morning and ${b}/${d2} in the afternoon.
How much did she drink total?`, answer:`${num/g}/${L/g}`, hint:"Add fractions", explain:"Common denominator → add → reduce." };
    }
  }

  if (domain==="percents"){
    const p=choice(n<=6?[10,20,25,50]:[5,10,15,20,25,30,40,50]);
    const base=randInt(40, (n<=6?400:900));
    const disc=(p/100)*base;
    const out=Number.isInteger(disc)?String(disc):String(Math.round(disc*100)/100);
    return { skill:"percents", text:`Word: A shirt costs $${base}. It's ${p}% off.
How much is the discount?`, answer: out, hint:"Percent of a number", explain:"Discount = percent × price." };
  }

  // order ops
  const a=randInt(2, n<=5?12:20), b=randInt(2, n<=5?8:12), c=randInt(2, n<=5?6:10);
  if (n>=7 && Math.random()<0.35){
    // 2-step style
    return { skill:"orderops", text:`Word: You buy ${a} packs with ${b} cards each. Then you give away ${c} cards.
How many cards left? (Use: ${a}×${b}-${c})`, answer: a*b - c, hint:"Multiply then subtract", explain:"Multiply first, then subtract." };
  }
  return { skill:"orderops", text:`Word: You buy ${a} packs. Each pack has ${b} cards.
Then you get ${c} extra cards.
How many cards total? (Use: ${a}×${b}+${c})`, answer: a*b + c, hint:"Multiply then add", explain:"Multiply first, then add extras." };
}

function availableSkills(level){
  const n = clamp(levelNum(level), 1, 8);
  // Unlock skills progressively by grade
  if (n <= 1) return ["addsub"];
  if (n === 2) return ["addsub","muldiv"];
  if (n === 3) return ["addsub","muldiv","fractions"];
  if (n === 4) return ["addsub","muldiv","fractions","decimals"];
  if (n === 5) return ["addsub","muldiv","fractions","decimals","percents"];
  return ["addsub","muldiv","fractions","decimals","percents","orderops"];
}

function weightsFor(focus, level){
  const allowed = availableSkills(level);

  if (focus==="word") return [{item:"word", w:1}];

  if (focus!=="adaptive"){
    if (focus==="mixed"){
      // Only include skills allowed at this grade
      const base = [
        {item:"addsub", w:2.2},
        {item:"muldiv", w:2.0},
        {item:"fractions", w:1.6},
        {item:"decimals", w:1.5},
        {item:"orderops", w:1.0},
        {item:"percents", w:1.0},
      ].filter(x=>allowed.includes(x.item));
      return base.length ? base : [{item:"addsub", w:1}];
    }
    // Specific focus requested: if not allowed yet, fall back to adaptive
    if (SKILLS.includes(focus) && allowed.includes(focus)){
      return allowed.map(s => ({item:s, w:(s===focus)?6:1}));
    }
  }

  // adaptive: focus on weaker accuracy and low streak (only within allowed skills)
  const out=[];
  for (const s of allowed){
    const st=progress.skills[s];
    const attempts=Math.max(1, st.attempts);
    const acc=st.correct/attempts;
    const streakBonus=clamp(st.streak/10,0,0.5);
    let w=1.2+(1-acc)*3+(0.5-streakBonus);
    out.push({item:s, w:Math.max(0.25,w)});
  }
  return out.length ? out : [{item:"addsub", w:1}];
}
function pickWeighted(items){
  const total=items.reduce((s,x)=>s+x.w,0);
  let r=Math.random()*total;
  for (const x of items){ r-=x.w; if (r<=0) return x.item; }
  return items[items.length-1].item;
}

function labelLevel(v){
  const n = Number(v);
  if (Number.isFinite(n)) return `Grade ${n}`;
  return v;
}
function focusLabel(f){
  if (f==="adaptive") return "Adaptive";
  if (f==="mixed") return "Mixed";
  if (f==="word") return "Word Problems";
  return SKILL_LABELS[f] || f;
}

// ---------- Timer / Session limit ----------
function stopTimer(){
  if (timer.handle) clearInterval(timer.handle);
  timer.handle=null; timer.start=null;
}
function startTimer(){
  stopTimer();
  sessionExpired=false;
  pauseActive=false;
  timer.start=Date.now();
  timerEl.textContent="00:00";
  sessionLeftEl.textContent=fmtMs(SESSION_LIMIT_MS);
  if (page) page._leftMs = SESSION_LIMIT_MS;

  timer.handle=setInterval(()=>{
    const elapsed=Date.now()-timer.start;
    timerEl.textContent=fmtMs(elapsed);
    const left=Math.max(0, SESSION_LIMIT_MS-elapsed);
    if (page) page._leftMs = left;
    sessionLeftEl.textContent=fmtMs(left);
    if (elapsed>=SESSION_LIMIT_MS && !sessionExpired){
      sessionExpired=true;
      stopTimer();
      lockSession();
    }
  }, 250);
}
function elapsedMs(){ return timer.start ? (Date.now()-timer.start) : 0; }
function lockSession(){
  document.querySelectorAll(".q input").forEach(i=>i.disabled=true);
  checkBtn.disabled=true;
  resetBtn.disabled=true;
  showSolutionsBtn.disabled=true;
  pauseBtn.disabled=true;
  feedbackEl.innerHTML = `⏱️ <strong>30-minute session limit reached.</strong> Great work! Click <strong>Start Page</strong> to begin a new session.`;
}

function setPaused(paused){
  pauseActive = paused;
  if (!page) return;

  if (paused){
    stopTimer();
    document.querySelectorAll(".q input").forEach(i=>i.disabled=true);
    pauseBtn.textContent = "Resume";
    feedbackEl.innerHTML = `⏸️ <strong>Paused.</strong> Pauses left on this page: <strong>${pausesLeft}</strong>`;
  } else {
    document.querySelectorAll(".q input").forEach(i=>i.disabled=false);
    pauseBtn.textContent = "Pause";
    // resume timer with remaining time
    // We track elapsed by shifting timer.start so remaining is preserved.
    const leftMs = page._leftMs ?? SESSION_LIMIT_MS;
    timer.start = Date.now() - (SESSION_LIMIT_MS - leftMs);
    timer.handle = setInterval(()=>{
      const elapsed=Date.now()-timer.start;
      timerEl.textContent=fmtMs(elapsed);
      const left=Math.max(0, SESSION_LIMIT_MS-elapsed);
      sessionLeftEl.textContent=fmtMs(left);
      page._leftMs = left;
      if (elapsed>=SESSION_LIMIT_MS && !sessionExpired){
        sessionExpired=true;
        stopTimer();
        lockSession();
      }
    }, 250);
    feedbackEl.textContent = "";
  }
}
function togglePause(){
  if (!page || sessionExpired) return;
  if (pauseActive){
    setPaused(false);
    return;
  }
  if (pausesLeft <= 0){
    feedbackEl.innerHTML = "No pauses left on this page.";
    return;
  }
  pausesLeft -= 1;
  pausesLeftEl.textContent = String(pausesLeft);
  setPaused(true);
}

// ---------- UI rendering ----------
function setSettingsHidden(hidden){
  settingsHidden=hidden;
  settingsRow.style.display = hidden ? "none" : "";
  const tips = document.querySelector(".tips");
  tips.style.display = hidden ? "none" : "block";
  showSettingsBtn.textContent = hidden ? "Show Settings" : "Hide Settings";
}

function renderCalendar(){
  const completed=progress.completedDates || {};
  const today=nowIsoDate();
  const start=new Date(); start.setDate(start.getDate()-13);
  const days=[];
  for(let i=0;i<14;i++){
    const d=new Date(start); d.setDate(start.getDate()+i);
    const iso=d.toISOString().slice(0,10);
    days.push({iso, day:d.getDate(), done:!!completed[iso], isToday: iso===today});
  }
  const threshold=clamp(Number(completionThresholdEl.value||90),50,100);
  calendarEl.innerHTML = `
    <div class="calLabel"><span>Last 14 days</span><span class="muted">✅ = page ≥ ${threshold}%</span></div>
    <div class="calGrid">
      ${days.map(x=>{
        const cls=["day", x.done?"done":"", x.isToday?"today":""].join(" ").trim();
        return `<div class="${cls}" title="${x.iso}">${x.day}${x.done?" ✅":""}</div>`;
      }).join("")}
    </div>
  `;
  streakEl.textContent = String(getDailyStreak());
}

function renderQuestions(){
  scratchObservers.forEach(observer=>observer.disconnect());
  scratchObservers=[];
  questionsEl.innerHTML="";
  if (!page) return;
  for (let i=0;i<page.questions.length;i++){
    const q=page.questions[i];
    const card=document.createElement("div");
    card.className="q";
    card.dataset.id=q.id;

    const left=document.createElement("div");
    left.className="left";

    const expr=document.createElement("div");
    expr.className="expr";
    expr.textContent = `${i+1}. ${q.text}`;

    const hint=document.createElement("div");
    hint.className="hint";
    hint.textContent = (page.mode==="practice") ? (q.hint||"") : "";

    left.appendChild(expr);
    if (hint.textContent) left.appendChild(hint);

    const input=document.createElement("input");
    input.type="text";
    input.inputMode="decimal";
    input.placeholder="Answer";
    input.value=q.userAnswer||"";
    input.addEventListener("input",(e)=>{
      q.userAnswer=e.target.value;
      if (checkedOnce){
        card.classList.remove("wrong","correct");
        const old=card.querySelector(".solutionLine");
        if (old) old.remove();
        feedbackEl.textContent = "Fix your answers, then press “Check Answers” again.";
      }
    });

    card.appendChild(left);
    card.appendChild(input);
    if (iosTouch) addAnswerPad(card,input,i+1);
    addScratchpad(card, q, i+1);
    if (page.mode === "practice" && Number(page.level) <= 2) {
      const subtraction = /^(\d+)\s*[-−]\s*(\d+)\s*=/.exec(q.text);
      if (subtraction) {
        const start = Number(subtraction[1]);
        const take = Number(subtraction[2]);
        if (start <= 30 && take > 0 && take <= start) addCounterGame(card, q, start, take);
      }
    }
    questionsEl.appendChild(card);
  }
}

function addAnswerPad(card,input,number){
  input.readOnly=true;
  input.setAttribute("aria-label",`Answer for question ${number}; opens on-page number pad`);
  const pad=document.createElement("div");pad.className="answer-pad hidden";
  pad.setAttribute("aria-label",`Number pad for question ${number}`);
  const keys=document.createElement("div");keys.className="answer-pad-keys";
  function enter(value){
    if(value==="delete")input.value=input.value.slice(0,-1);
    else if(value==="clear")input.value="";
    else input.value+=value;
    input.dispatchEvent(new Event("input",{bubbles:true}));
  }
  for(const value of ["1","2","3","4","5","6","7","8","9","−","0",".","/","delete","clear"]){
    const key=document.createElement("button");key.type="button";
    key.textContent=value==="delete"?"⌫":value==="clear"?"Clear":value;
    key.setAttribute("aria-label",value==="delete"?"Delete last character":value==="clear"?"Clear answer":value==="−"?"Minus":value==="/"?"Fraction slash":value);
    key.addEventListener("click",()=>enter(value==="−"?"-":value));keys.appendChild(key);
  }
  const actions=document.createElement("div");actions.className="answer-pad-actions";
  const done=document.createElement("button");done.type="button";done.textContent="Done";
  done.addEventListener("click",()=>{pad.classList.add("hidden");input.blur();});
  const device=document.createElement("button");device.type="button";device.textContent="Use device keyboard";
  const restore=document.createElement("button");restore.type="button";restore.className="answer-pad-restore hidden";
  restore.textContent="Use on-page number pad";
  device.addEventListener("click",()=>{pad.classList.add("hidden");restore.classList.remove("hidden");input.readOnly=false;input.focus();});
  restore.addEventListener("click",()=>{input.blur();input.readOnly=true;restore.classList.add("hidden");pad.classList.remove("hidden");});
  actions.append(done,device);pad.append(keys,actions);card.append(pad,restore);
  input.addEventListener("click",()=>{
    if(!input.readOnly)return;
    document.querySelectorAll(".answer-pad").forEach(other=>other.classList.add("hidden"));
    pad.classList.remove("hidden");
  });
}

function addScratchpad(card, q, number){
  // Scratch work belongs to the current worksheet question. It never changes
  // the checked answer or the browser's saved progress record.
  const work=q.scratch||(q.scratch={actions:[],notes:""});
  card.classList.add("has-scratchpad");
  const details=document.createElement("details");details.className="scratchpad";
  const summary=document.createElement("summary");summary.textContent="✎ Work it out";
  summary.setAttribute("aria-label",`Work out question ${number}`);
  const body=document.createElement("div");body.className="scratch-body";
  const problem=document.createElement("div");problem.className="scratch-problem";
  problem.textContent=`Question ${number}: ${q.text}`;
  const instruction=document.createElement("p");instruction.className="scratch-instruction";
  instruction.textContent="Draw with a finger or stylus. Write the final answer in the box above.";
  const toolbar=document.createElement("div");toolbar.className="scratch-toolbar";
  const pen=document.createElement("button");pen.type="button";pen.textContent="✎ Pen";
  const eraser=document.createElement("button");eraser.type="button";eraser.textContent="◻ Eraser";
  const undo=document.createElement("button");undo.type="button";undo.textContent="↶ Undo";
  const clear=document.createElement("button");clear.type="button";clear.textContent="Clear drawing";
  let tool="pen";
  function updateTools(){
    pen.setAttribute("aria-pressed",String(tool==="pen"));
    eraser.setAttribute("aria-pressed",String(tool==="eraser"));
    undo.disabled=work.actions.length===0;
    clear.disabled=work.actions.length===0;
  }
  pen.addEventListener("click",()=>{tool="pen";updateTools();});
  eraser.addEventListener("click",()=>{tool="eraser";updateTools();});
  undo.addEventListener("click",()=>{work.actions.pop();redraw();updateTools();});
  clear.addEventListener("click",()=>{work.actions.push({clear:true});redraw();updateTools();});
  toolbar.append(pen,eraser,undo,clear);
  const canvas=document.createElement("canvas");canvas.className="scratch-canvas";
  canvas.setAttribute("aria-label",`Drawing area for question ${number}`);
  const notes=document.createElement("textarea");notes.className="scratch-notes";notes.rows=2;
  notes.placeholder="Or type your working steps here";
  notes.setAttribute("aria-label",`Working notes for question ${number}`);
  notes.value=work.notes;
  notes.addEventListener("input",()=>{work.notes=notes.value;});
  const helper=document.createElement("p");helper.className="scratch-helper";
  helper.textContent="Scratch work stays while this page is open. Starting a new page or reloading clears it.";
  body.append(problem,instruction,toolbar,canvas,notes,helper);
  details.append(summary,body);card.append(details);

  function resize(){
    if(!details.open)return;
    const width=Math.round(canvas.getBoundingClientRect().width);
    if(width<1)return;
    const height=280;
    const ratio=Math.min(window.devicePixelRatio||1,2);
    if(canvas.width!==Math.round(width*ratio)||canvas.height!==Math.round(height*ratio)){
      canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);
    }
    redraw();
  }
  function redraw(){
    const ctx=canvas.getContext("2d");
    const width=canvas.width,height=canvas.height;
    ctx.clearRect(0,0,width,height);
    const lastClear=work.actions.findLastIndex(action=>action.clear);
    for(const action of work.actions.slice(lastClear+1)){
      if(action.clear||!action.points.length)continue;
      ctx.globalCompositeOperation=action.tool==="eraser"?"destination-out":"source-over";
      ctx.strokeStyle="#24335d";ctx.fillStyle="#24335d";
      ctx.lineWidth=(action.tool==="eraser"?22:3)*width/Math.max(1,canvas.clientWidth);
      ctx.lineCap="round";ctx.lineJoin="round";
      const points=action.points;
      if(points.length===1){
        ctx.beginPath();ctx.arc(points[0].x*width,points[0].y*height,ctx.lineWidth/2,0,Math.PI*2);ctx.fill();
      } else {
        ctx.beginPath();ctx.moveTo(points[0].x*width,points[0].y*height);
        for(const point of points.slice(1))ctx.lineTo(point.x*width,point.y*height);
        ctx.stroke();
      }
    }
    ctx.globalCompositeOperation="source-over";
  }
  function point(event){
    const rect=canvas.getBoundingClientRect();
    return {x:clamp((event.clientX-rect.left)/rect.width,0,1),y:clamp((event.clientY-rect.top)/rect.height,0,1)};
  }
  let active=null;
  canvas.addEventListener("pointerdown",event=>{
    if(event.button!==0)return;
    event.preventDefault();canvas.setPointerCapture(event.pointerId);
    active={tool,points:[point(event)]};work.actions.push(active);redraw();updateTools();
  });
  canvas.addEventListener("pointermove",event=>{
    if(!active)return;
    event.preventDefault();active.points.push(point(event));redraw();
  });
  function endStroke(){active=null;}
  canvas.addEventListener("pointerup",endStroke);
  canvas.addEventListener("pointercancel",endStroke);
  canvas.addEventListener("contextmenu",event=>event.preventDefault());
  details.addEventListener("toggle",resize);
  const observer=new ResizeObserver(resize);observer.observe(body);scratchObservers.push(observer);
  updateTools();
}

function addCounterGame(card, q, start, take){
  card.classList.add("has-counter-game");
  const toggle=document.createElement("button");
  toggle.type="button";toggle.className="counter-toggle";toggle.textContent="● Use counters";
  toggle.setAttribute("aria-expanded", "false");
  const panel=document.createElement("div");panel.className="counter-game hidden";
  const prompt=document.createElement("p");prompt.className="counter-prompt";
  prompt.textContent=`Start with ${start} counters. Tap ${take} to take away. Try the ones first!`;
  const groups=document.createElement("div");groups.className="counter-groups";
  const status=document.createElement("p");status.className="counter-status";status.setAttribute("role","status");
  const reset=document.createElement("button");reset.type="button";reset.className="counter-reset";reset.textContent="Start counters over";
  const taken=new Set();
  const counters=[];
  for(let offset=0;offset<start;offset+=10){
    const size=Math.min(10,start-offset);
    const group=document.createElement("div");group.className="counter-group";
    const label=document.createElement("span");label.textContent=size===10?"A group of 10":`${size} ones`;
    const frame=document.createElement("div");frame.className="counter-frame";
    for(let index=offset;index<offset+size;index++){
      const dot=document.createElement("button");dot.type="button";dot.className="counter-dot";dot.textContent="●";
      dot.setAttribute("aria-label",`Take away counter ${index+1}`);
      dot.addEventListener("click",()=>{
        if(taken.has(index)||taken.size>=take)return;
        taken.add(index);dot.classList.add("taken");dot.disabled=true;
        update();
      });
      counters.push(dot);frame.appendChild(dot);
    }
    group.append(label,frame);groups.appendChild(group);
  }
  function update(){
    status.textContent=taken.size===take
      ? `You took away ${take}. Count the counters still showing, then write your answer above.`
      : `${taken.size} of ${take} taken away. Keep counting as you go.`;
    counters.forEach(dot=>{if(!dot.classList.contains("taken"))dot.disabled=taken.size>=take;});
  }
  reset.addEventListener("click",()=>{taken.clear();counters.forEach(dot=>{dot.classList.remove("taken");dot.disabled=false;});update();});
  toggle.addEventListener("click",()=>{
    const opening=panel.classList.toggle("hidden")===false;
    toggle.setAttribute("aria-expanded",String(opening));
    toggle.textContent=opening?"Hide counters":"● Use counters";
  });
  update();panel.append(prompt,groups,status,reset);card.append(toggle,panel);
}

// ---------- Worksheet generation ----------
function applyModeRules(){
  const mode=modeSelect.value;
  const allow = allowSolutionsEl.checked && mode==="practice" && !!page?.recorded && page.correctionChecks>0;
  showSolutionsBtn.disabled = !allow;
  showSolutionsBtn.style.opacity = allow ? "1":"0.5";
  if (mode==="test") requireAllAnsweredEl.checked=true;
  if (page){ page.mode = mode; renderQuestions(); }
}

function newWorksheet(){
  syncFamilyProfiles();
  // re-enable in case locked
  checkBtn.disabled=false; resetBtn.disabled=false; pauseBtn.disabled=false;

  let level = gradeSelect.value;
  if (level==="current") level = progress.currentLevel || "1";
  const count = Number(countSelect.value);
  const mode = modeSelect.value;
  const focus = focusSelect.value;

  const ws = weightsFor(focus, level);
  const qs=[];
  for (let i=0;i<count;i++){
    let q;
    if (focus==="word"){
      q=qWord(level);
    } else {
      const skill=pickWeighted(ws);
      if (skill==="addsub") q=qAddSub(level);
      else if (skill==="muldiv") q=qMulDiv(level);
      else if (skill==="decimals") q=qDecimals(level);
      else if (skill==="fractions") q=qFractions(level);
      else if (skill==="percents") q=qPercents(level);
      else q=qOrderOps(level);
    }
    qs.push({ id: cryptoId(), ...q, userAnswer:"" });
  }
  page = { id: cryptoId(), createdAt: Date.now(), level, mode, focus, child: Number(childSelect.value), childName: childSelect.selectedOptions[0].textContent, questions: qs, recorded:false, correctionChecks:0, rewardIssued:false };
  childSelect.disabled=false;
  mathReward.classList.add("hidden");
  checkedOnce=false;
  scoreEl.textContent="—";
  feedbackEl.textContent="";
  sheetMetaEl.textContent = `${count} questions • ${labelLevel(level)} • ${mode==="practice"?"Practice":"Test"} • ${focusLabel(focus)}`;

  applyModeRules();
  renderQuestions();
  renderCalendar();
  pausesLeft = 2; pausesLeftEl.textContent = String(pausesLeft); pauseActive=false; pauseBtn.textContent="Pause"; pausesLeft = 2;
  pausesLeftEl.textContent = String(pausesLeft);
  pauseBtn.textContent = "Pause";
  startTimer();
  setSettingsHidden(true);
}

// ---------- Checking / progress ----------
function updateSkillStats(skill, ok, msSpent){
  const s=progress.skills[skill];
  s.attempts += 1;
  if (ok){
    s.correct += 1;
    s.streak += 1;
    s.bestStreak = Math.max(s.bestStreak, s.streak);
  } else {
    s.streak = 0;
  }
  if (s.avgMs==null) s.avgMs=msSpent;
  else s.avgMs = Math.round(s.avgMs*0.85 + msSpent*0.15);
}

function completedPagesAtLevel(level){
  const th = clamp(Number(completionThresholdEl.value||90),50,100);
  return progress.pages.filter(p=>p.level===level && p.pct>=th).length;
}
function nextLevel(level){
  const n = clamp(levelNum(level), 1, 8);
  return String(Math.min(8, n+1));
}

function markCompletedDateIfQualified(pct){
  const th=clamp(Number(completionThresholdEl.value||90),50,100);
  if (pct>=th) progress.completedDates[nowIsoDate()] = true;
}

function maybeAdvanceLevel(level, pct){
  if (!autoAdvanceEl.checked) return null;
  const needed = clamp(Number(progress.minPagesPerLevel ?? 20), 1, 200);
  const done = completedPagesAtLevel(level);
  const mastery = clamp(Number(masteryThresholdEl.value||90),50,100);
  if (done>=needed && pct>=mastery && level!=="8"){
    const nxt=nextLevel(level);
    progress.currentLevel=nxt;
    currentLevelSelectEl.value=nxt;
    return nxt;
  }
  return null;
}

function maybeAdvanceDifficulty(){
  if (!autoAdvanceEl.checked) return;
  const mastery = clamp(Number(masteryThresholdEl.value||90),50,100)/100;
  for (const skill of SKILLS){
    const s=progress.skills[skill];
    const attempts=Math.max(1,s.attempts);
    const acc=s.correct/attempts;
    if (s.attempts>=40 && acc>=mastery && s.streak>=10){
      progress.difficulty[skill]=clamp((progress.difficulty[skill]??1)+1,0,5);
      s.streak=Math.max(0,s.streak-8);
    }
  }
}

function checkAnswers(){
  if (!page || sessionExpired) return;

  const requireAll = requireAllAnsweredEl.checked || page.mode==="test";
  if (requireAll){
    for (let i=0;i<page.questions.length;i++){
      if (!normalizeAnswer(page.questions[i].userAnswer)){
        feedbackEl.innerHTML = `Please answer all questions. First missing: <strong>#${i+1}</strong>`;
        return;
      }
    }
  }

  checkedOnce=true;
  if (!page.recorded){page.child=Number(childSelect.value);page.childName=childSelect.selectedOptions[0].textContent;childSelect.disabled=true;}
  const elapsed = elapsedMs();
  stopTimer();

  let correct=0;
  let wrongNums=[];
  const perQ = Math.max(250, Math.round(elapsed/page.questions.length));

  for (let i=0;i<page.questions.length;i++){
    const q=page.questions[i];
    const card=document.querySelector(`.q[data-id="${q.id}"]`);
    const ok = answersMatch(q.userAnswer, q.answer);
    if (!page.recorded) updateSkillStats(q.skill, ok, perQ);

    card.classList.toggle("correct", ok);
    card.classList.toggle("wrong", !ok);

    const old=card.querySelector(".solutionLine");
    if (old) old.remove();

    if (!ok){
      wrongNums.push(i+1);
      const sol=document.createElement("div");
      sol.className="solutionLine hint";
      sol.textContent = `Try again. ${q.explain?("Tip: "+q.explain):"Use the work area to check your steps."}`;
      card.querySelector(".left").appendChild(sol);
    } else correct++;
  }

  const total=page.questions.length;
  const pct=Math.round((correct/total)*100);
  if (!page.recorded) scoreEl.textContent = `First try: ${correct}/${total} (${pct}%)`;

  let advancedTo=null;
  if (!page.recorded){
    page.initialAccuracy=pct;
    page.initialCorrect=correct;
    progress.pages.push({ date: nowIsoDate(), pct, total, correct, ms: elapsed, mode: page.mode, level: page.level });
    if (progress.pages.length>60) progress.pages = progress.pages.slice(-60);
    markCompletedDateIfQualified(pct);
    maybeAdvanceDifficulty();
    advancedTo=maybeAdvanceLevel(page.level,pct);
    page.recorded=true;
    saveProgress();renderCalendar();renderDashboard();
  } else {
    page.correctionChecks++;
  }
  showSolutionsBtn.disabled = !(allowSolutionsEl.checked && page.mode==="practice" && page.correctionChecks>0);
  showSolutionsBtn.style.opacity = showSolutionsBtn.disabled ? "0.5" : "1";
  if (correct===total && !page.rewardIssued){
    const pass=BellLearningRewards.create({source:"bells-math",activity:page.mode,grade:page.level,child:page.child,itemCount:total,initialAccuracy:page.initialAccuracy,correctedAll:true});
    BellLearningRewards.publish(pass);
    page.rewardIssued=true;
    childSelect.disabled=false;
    mathRewardTitle.textContent=`All answers corrected. ${pass.xp} Chore Quest points for ${page.childName}!`;
    mathRewardText.textContent="Open Chore Quest on this browser within 48 hours to add the points. You can keep practising without it.";
    mathRewardLink.href=BellLearningRewards.claimUrl(pass);
    mathReward.classList.remove("hidden");
  }

  if (advancedTo){
    feedbackEl.innerHTML = `🏁 Level up! Current level is now <strong>${labelLevel(advancedTo)}</strong>.`;
  } else if (correct===total){
    feedbackEl.innerHTML = page.initialAccuracy===100
      ? `✅ Perfect page! Click <strong>Start Page</strong> for the next one.`
      : `✅ All answers corrected! Click <strong>Start Page</strong> for the next one.`;
  } else {
    const list = wrongNums.slice(0,10).join(", ");
    const more = wrongNums.length>10 ? ` +${wrongNums.length-10} more` : "";
    feedbackEl.innerHTML = `First try: <strong>${page.initialAccuracy}%</strong>. Review questions <strong>${list}${more}</strong>, use the tips, then press <strong>Check Answers</strong> again. Your first score stays in the progress record.`;
  }
  if(correct===total){
    const prompt=document.createElement("div");prompt.className="english-next";
    const label=document.createElement("strong");label.textContent="Want to do an English page next?";
    const link=document.createElement("a");link.href=`/english/?fromMath=1&grade=${encodeURIComponent(page.level)}#practice-setup`;
    link.textContent="Choose an English page →";
    prompt.append(label,link);feedbackEl.appendChild(prompt);
  }
}

function resetInputs(){
  if (!page) return;
  // Clearing a recorded page must not add another history entry or issue the
  // same reward a second time. A new Start Page creates a new attempt.
  if (!page.recorded){
    page.child=Number(childSelect.value);page.childName=childSelect.selectedOptions[0].textContent;
  }
  childSelect.disabled=page.recorded&&!page.rewardIssued;
  mathReward.classList.toggle("hidden",!page.rewardIssued);
  for (const q of page.questions) q.userAnswer="";
  checkedOnce=false;
  scoreEl.textContent=page.recorded?`First try: ${page.initialCorrect}/${page.questions.length} (${page.initialAccuracy}%)`:"—";
  feedbackEl.textContent="";
  document.querySelectorAll(".q").forEach(el=>el.classList.remove("wrong","correct"));
  document.querySelectorAll(".solutionLine").forEach(el=>el.remove());
  document.querySelectorAll(".q input").forEach(i=>i.disabled=false);
  renderQuestions();
  checkBtn.disabled=false; resetBtn.disabled=false; pauseBtn.disabled=false;
  startTimer();
}

function showSolutions(){
  if (!page) return;
  if (!(allowSolutionsEl.checked && page.mode==="practice" && page.recorded && page.correctionChecks>0)) return;
  for (const q of page.questions){
    const card=document.querySelector(`.q[data-id="${q.id}"]`);
    if (!card) continue;
    if (!card.querySelector(".solutionLine")){
      const sol=document.createElement("div");
      sol.className="solutionLine hint";
      sol.textContent = `Correct: ${q.answer}. ${q.explain?("Tip: "+q.explain):""}`;
      card.querySelector(".left").appendChild(sol);
    }
  }
  feedbackEl.textContent = "Solutions shown. Use them to learn patterns, then try again tomorrow.";
}

function getDailyStreak(){
  const c=progress.completedDates||{};
  let streak=0;
  const d=new Date();
  while(true){
    const iso=d.toISOString().slice(0,10);
    if (c[iso]){ streak++; d.setDate(d.getDate()-1); }
    else break;
  }
  return streak;
}

// ---------- Dashboard / password ----------
function requireDashboardPassword(cb){
  passwordModal.classList.remove("hidden");
  passwordInput.value="";
  passwordError.textContent="";

  passwordSubmitBtn.onclick=()=>{
    if (passwordInput.value===DEFAULT_PASSWORD){
      passwordModal.classList.add("hidden");
      cb(true);
    } else passwordError.textContent="Incorrect password";
  };
  passwordCancelBtn.onclick=()=>{
    passwordModal.classList.add("hidden");
    cb(false);
  };
}

function openDashboard(){
  requireDashboardPassword((ok)=>{
    if(!ok) return;
    modalBackdrop.classList.remove("hidden");
    exportOut.value="";
    renderDashboard();
  });
}
function closeDashboard(){ modalBackdrop.classList.add("hidden"); }

function renderDashboard(){
  if (modalBackdrop.classList.contains("hidden")) return;

  const pages=progress.pages||[];
  const last=pages[pages.length-1];
  const last7=pages.slice(-7);
  const avg7 = last7.length ? Math.round(last7.reduce((s,p)=>s+p.pct,0)/last7.length) : null;

  dashSummaryEl.innerHTML = `
    <div><strong>Total pages:</strong> ${pages.length}</div>
    <div><strong>Daily streak:</strong> ${getDailyStreak()}</div>
    <div><strong>Current level:</strong> ${labelLevel(progress.currentLevel||"1")}</div>
    <div><strong>Min pages per level:</strong> ${progress.minPagesPerLevel ?? 20}</div>
    <div><strong>Last page:</strong> ${last ? `${last.correct}/${last.total} (${last.pct}%) • ${fmtMs(last.ms)} • ${last.mode} • ${labelLevel(last.level)}` : "—"}</div>
    <div><strong>Avg last 7 pages:</strong> ${avg7!=null?avg7+"%":"—"}</div>
  `;

  const masteryPct = clamp(Number(masteryThresholdEl.value||90),50,100);
  dashSkillsEl.innerHTML = SKILLS.map(skill=>{
    const s=progress.skills[skill];
    const attempts=Math.max(1,s.attempts);
    const acc=s.correct/attempts;
    const barW=Math.round(acc*100);
    const good = (acc*100)>=masteryPct;
    return `
      <div class="barRow">
        <div>${SKILL_LABELS[skill]}</div>
        <div class="bar ${good?"goodBar":"badBar"}"><div style="width:${barW}%"></div></div>
        <div>${Math.round(acc*100)}%</div>
      </div>
      <div class="muted small">Attempts: ${s.attempts} • Streak: ${s.streak} • Difficulty: ${(progress.difficulty[skill]??1)}</div>
    `;
  }).join("");

  const recent=pages.slice(-10).reverse();
  dashRecentEl.innerHTML = recent.length ? `
    <div class="muted small">Newest → oldest</div>
    <div style="margin-top:8px">
      ${recent.map(p=>`
        <div style="display:flex;justify-content:space-between;gap:10px;border-bottom:1px solid var(--line);padding:6px 0">
          <span>${p.date} • ${p.mode} • ${labelLevel(p.level)}</span>
          <span>${p.correct}/${p.total} (${p.pct}%) • ${fmtMs(p.ms)}</span>
        </div>
      `).join("")}
    </div>
  ` : `<div class="muted">No pages yet — complete a worksheet to see results.</div>`;
}

// ---------- Backup ----------
function exportData(){ exportOut.value = JSON.stringify(progress, null, 2); }
function downloadBackup(){
  const blob=new Blob([JSON.stringify(progress,null,2)],{type:"application/json"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url;
  a.download=`math_backup_${nowIsoDate()}.json`;
  document.body.appendChild(a);
  a.click(); a.remove();
  URL.revokeObjectURL(url);
}
function importBackupFromObject(obj){
  if (!obj || typeof obj!=="object") throw new Error("Invalid backup");
  if (!obj.skills || !obj.pages) throw new Error("Backup missing fields");
  const d=defaultProgress();
  progress = { ...d, ...obj };
  progress.difficulty = { ...d.difficulty, ...(progress.difficulty||{}) };
  progress.skills = { ...d.skills, ...(progress.skills||{}) };
  progress.pages = progress.pages || [];
  progress.completedDates = progress.completedDates || {};
  saveProgress();
  syncParentSettingsFromProgress();
  renderCalendar();
  renderDashboard();
}
function importBackupFromText(text){ importBackupFromObject(JSON.parse(text)); }

function resetAllProgress(){
  if (!confirm("Reset all progress on this device? This cannot be undone.")) return;
  progress = defaultProgress();
  saveProgress();
  syncParentSettingsFromProgress();
  renderCalendar();
  renderDashboard();
  alert("Progress reset.");
}

// ---------- Print ----------
function printWorksheet(){ window.print(); }

// ---------- Init ----------
function syncFamilyProfiles(){
  const familyNames=BellLearningRewards.familyNames();
  const connected=familyNames.some(Boolean);
  [...childSelect.options].forEach((option,index)=>{
    option.textContent=connected?(familyNames[index]||`Child ${index+1}`):`Child ${index+1}`;
    option.hidden=connected && (index>=familyNames.length || !familyNames[index]);
  });
  if(childSelect.selectedOptions[0]?.hidden){
    childSelect.value=[...childSelect.options].find(option=>!option.hidden)?.value||"0";
  }
  $("familyConnectText").textContent=connected
    ? `Profiles connected: ${familyNames.filter(Boolean).join(", ")}. Choose the child below before checking answers. Math progress stays on this device.`
    : "Profiles aren't connected here yet. On the Chore Quest family dashboard, tap Connect Math & English. Then return and tap Refresh profiles. Math progress stays on this device.";
}

function init(){
  syncFamilyProfiles();
  $("refreshFamilyProfiles").addEventListener("click",syncFamilyProfiles);
  window.addEventListener("focus",syncFamilyProfiles);
  syncParentSettingsFromProgress();
  renderCalendar();
  applyModeRules();
  setSettingsHidden(false);

  newBtn.addEventListener("click", newWorksheet);
  showSettingsBtn.addEventListener("click", ()=>setSettingsHidden(!settingsHidden));
  resetBtn.addEventListener("click", resetInputs);
  pauseBtn.addEventListener("click", togglePause);
  checkBtn.addEventListener("click", checkAnswers);
  showSolutionsBtn.addEventListener("click", showSolutions);
  printBtn.addEventListener("click", printWorksheet);

  dashboardBtn.addEventListener("click", openDashboard);
  closeDashboardBtn.addEventListener("click", closeDashboard);
  modalBackdrop.addEventListener("click",(e)=>{ if(e.target===modalBackdrop) closeDashboard(); });

  exportBtn.addEventListener("click", exportData);
  downloadBackupBtn.addEventListener("click", downloadBackup);
  resetDataBtn.addEventListener("click", resetAllProgress);

  importBackupBtn.addEventListener("click", ()=>{
    try{
      importStatus.textContent="";
      importBackupFromText(importIn.value||"");
      importStatus.textContent="✅ Import successful.";
    } catch(err){
      importStatus.textContent="❌ Import failed: " + (err?.message||err);
    }
  });
  importFile.addEventListener("change", async (e)=>{
    const file=e.target.files?.[0];
    if (!file) return;
    try{
      const text=await file.text();
      importStatus.textContent="";
      importBackupFromText(text);
      importStatus.textContent="✅ Import successful from file.";
    } catch(err){
      importStatus.textContent="❌ Import failed: " + (err?.message||err);
    }
  });

  // Parent settings changes
  allowSolutionsEl.addEventListener("change", applyModeRules);
  modeSelect.addEventListener("change", applyModeRules);
  masteryThresholdEl.addEventListener("change", renderDashboard);
  completionThresholdEl.addEventListener("change", ()=>{ renderCalendar(); renderDashboard(); });
  minPagesPerLevelEl.addEventListener("change", syncProgressFromParentSettings);
  currentLevelSelectEl.addEventListener("change", syncProgressFromParentSettings);
  autoAdvanceEl.addEventListener("change", ()=>{});

  // First worksheet
  newWorksheet();
  setSettingsHidden(false);
}

init();
