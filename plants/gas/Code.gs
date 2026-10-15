/**
 * 植物大考驗 班級PK賽：後端（Google Apps Script，V8）
 * 資料全部存在這份試算表：設定 / 班級 / 名單 / 作答紀錄 / 題庫
 * 學生網址：部署後的網址
 * 老師後台：部署後的網址 + ?page=admin
 */

const TZ = 'Asia/Taipei';
const K_PW = '後台密碼';
const K_SEC = '每題秒數';
const K_EPOCH = '重置次數(勿改)';
const K_SOLO = '個人賽題數';
const K_TEAM = '團體賽題數';
const K_PHASE = '階段|'; // 後面接班級名稱；值為 solo（個人賽）或 team（團體賽）

const SPEC = {
  config:    {name: '設定',     cols: ['key', 'value'], head: ['項目', '值']},
  classes:   {name: '班級',     cols: ['name', 'teams', 'open'], head: ['班級', '組數', '開放作答']},
  roster:    {name: '名單',     cols: ['cls', 'seat', 'name', 'team', 'pin', 'token', 'last'], head: ['班級', '座號', '姓名', '組別', '密碼', '登入碼(勿改)', '最近登入']},
  answers:   {name: '作答紀錄', cols: ['ts', 'cls', 'seat', 'qid', 'choice', 'ok', 'ms', 'pts', 'phase'], head: ['時間', '班級', '座號', '題號', '選的答案', '答對(1/0)', '花費毫秒', '得分', '階段']},
  questions: {name: '題庫',     cols: ['id', 'topic', 'page', 'text', 'a', 'b', 'c', 'd', 'ans', 'exp'], head: ['題號', '單元', '頁碼', '題目', 'A', 'B', 'C', 'D', '答案(A-D)', '解說']}
};

const TEAMS = [
  {name: '向日葵隊', color: '#E8A800'},
  {name: '仙人掌隊', color: '#2E8B57'},
  {name: '捕蠅草隊', color: '#D93F45'},
  {name: '椰子隊',   color: '#2D68D2'},
  {name: '含羞草隊', color: '#D6529A'},
  {name: '蒲公英隊', color: '#7A5BC7'}
];

const SEED = [[1,"植物的根",42,"植物的「根」有什麼功能？","行光合作用製造養分","固定植物體，吸收水分和礦物質","讓種子飄到遠方","吸引昆蟲來傳播花粉","B","根可以固定植物體，也可以吸收土壤中的水分，以及溶解在水中的礦物質。"],[2,"植物的根",42,"銀葉樹的根突出地面，像三角形的板子，這叫做什麼？","氣生根","塊根","走莖","板根","D","這是銀葉樹的「板根」現象，根突出地面呈現板狀三角形。"],[3,"植物的根",42,"銀葉樹長出板根，是為了適應什麼樣的環境？","乾燥的沙漠","寒冷的高山","熱帶多雨、土壤表層淺薄","很深的湖底","C","為了適應熱帶多雨及土壤表層淺薄的環境，板根可以增加抓地面積，讓植物體穩固生長。"],[4,"植物的根",42,"白蘿蔔的根長得特別肥大，主要用來做什麼？","儲藏養分和水分","捕捉昆蟲","吸收空氣中的溼氣","把種子彈出去","A","白蘿蔔為了適應乾硬的土壤環境，根部特別肥大，用來儲藏養分和水分。"],[5,"植物的根",42,"榕樹從枝條垂下來的「氣生根」，有什麼作用？","從空氣中吸附溼氣，獲得水分","製造花粉","讓葉子變紅","吸引動物來吃","A","榕樹為了適應乾硬土壤及強烈日照，長出氣生根從空氣中吸附溼氣獲得水分。"],[6,"植物的莖",43,"植物的「莖」有什麼功能？","捕捉昆蟲","保護種子","支撐植物體，輸送水分和養分","從土裡吸收礦物質","C","莖可以支撐植物體，也可以輸送水分和養分。"],[7,"植物的莖",43,"吊蘭會長出長長的「走莖」，走莖前端可以做什麼？","開出紅色的花","長出新的幼苗，繁殖下一代","捕捉小蟲","浮在水面上","B","吊蘭利用走莖繁殖下一代，走莖前端可以長出新的幼苗。"],[8,"植物的莖",43,"絲瓜的莖柔軟、不能直立，它怎麼往上生長？","長出板根","把葉子變成針狀","利用卷鬚攀附在其他植物上","把莖變得又短又胖","C","莖柔軟不能直立的植物，為了在濃密樹林裡爭取日照，會利用卷鬚或鉤刺攀附在其他植物身上向上生長，例如絲瓜。"],[9,"植物的莖",43,"我們吃的馬鈴薯，是植物的哪一個部位？","根","葉","果實","莖（塊莖）","D","馬鈴薯是「塊莖」，外形短而膨大，可以儲藏養分，也能長出新芽繁殖。"],[10,"植物的莖",43,"在濃密的森林裡，樟樹為什麼長出高聳挺直的莖？","為了爭取陽光","為了躲避動物","為了儲藏水分","為了讓種子浮在水上","A","濃密的森林中，植物為了爭取陽光，會長出高聳挺直的莖，例如樟樹。"],[11,"植物的葉",44,"植物的「葉」可以做什麼？","固定植物體","行光合作用製造養分","吸收土壤中的礦物質","把種子彈出去","B","葉可以行光合作用製造養分，植物體內的水分也會由葉蒸散出去。"],[12,"植物的葉",44,"聖誕紅紅紅的部分常被誤認為花瓣，它其實是什麼？","花瓣","果實","紅色的葉","莖","C","那是聖誕紅的紅色葉，可以吸引昆蟲幫忙傳播花粉。"],[13,"植物的葉",44,"石蓮生長在乾燥的環境中，它的葉有什麼特色？","又薄又大","肥厚，可以儲藏水分和養分","變成針狀","長滿黏黏的腺毛","B","石蓮肥厚的葉可以儲藏水分和養分，適應乾燥環境。"],[14,"植物的葉",44,"仙人掌的葉長成針狀，有什麼好處？","讓花朵更香","吸引昆蟲來傳粉","幫助莖往上爬","減少水分散失，也能防禦動物","D","仙人掌生長在乾燥環境，針狀的葉可以減少水分的散失，還能防禦動物的危害。"],[15,"植物的葉",44,"毛氈苔生長在沼澤地帶，它葉上的腺毛有什麼用途？","分泌黏液捕捉昆蟲","儲藏水分","幫助漂浮","吸收陽光變紅","A","毛氈苔葉上有許多腺毛，會分泌黏液捕捉昆蟲。"],[16,"受刺激的反應",45,"捕蠅草的「夾子」，是由植物的哪個部位變成的？","根","莖","葉","果實","C","捕蠅草的葉子長成一對夾子，葉內側有蜜汁可以吸引昆蟲。"],[17,"受刺激的反應",45,"捕蠅草什麼時候會把夾子合起來？","太陽下山的時候","昆蟲碰到葉內的感覺毛時","下雨的時候","有人在旁邊說話時","B","昆蟲觸碰到葉內的感覺毛，植物感覺到有異物，兩個夾子就迅速閉合；消化吸收養分後，夾子會重新張開。"],[18,"受刺激的反應",45,"輕輕碰觸含羞草，會發生什麼事？","葉子變成紅色","開出新的花","葉片閉合、葉柄下垂","莖馬上長高","C","含羞草被碰觸時，葉片會迅速閉合，葉柄也會下垂；一段時間後葉片又會重新張開。"],[19,"受刺激的反應",45,"含羞草為什麼會有「碰一下就合起來」的反應？","為了吸引動物來吃它","為了減少葉片被風雨摧殘和蟲子站立","為了讓種子飛得更遠","為了儲藏更多水分","B","含羞草生長在亞熱帶，常有猛烈的颱風或暴風，閉合可以減少葉片被摧殘和蟲子站立的地方。"],[20,"受刺激的反應",45,"種在窗戶旁的植物，莖會朝哪個方向生長？","朝向牆壁","朝向地面","朝向陽光","不會改變方向","C","莖會朝向陽光生長，獲得更多陽光進行光合作用。"],[21,"受刺激的反應",45,"有些植物冬天會落葉，原因是什麼？","減少養分及水分的散失，度過不良的環境","讓動物比較好吃","葉子太重撐不住","為了吸引更多昆蟲","A","冬天落葉可以減少養分及水分的散失，幫助植物度過不良的環境。"],[22,"果實與種子傳播",51,"植物的果實，對種子有什麼幫助？","吸收土壤中的水分","支撐植物體","捕捉昆蟲","保護種子，幫助種子傳播出去","D","果實可以保護種子讓它順利長大，有些果實也能幫助種子傳播出去。"],[23,"果實與種子傳播",48,"青楓的果實有薄薄的翅膀，它靠什麼方式傳播？","水力","動物力","風力","自身彈力","C","青楓果實具有薄翅，可以隨風飄，是「風力傳播」。"],[24,"果實與種子傳播",48,"蒲公英的果實上有蓬鬆的白色細毛，可以幫助它？","黏在動物身上","漂浮在海上","自己彈出去","隨風飄散到遠方","D","蓬鬆的白色細毛可以幫助蒲公英的果實隨風飄散到遠方。"],[25,"果實與種子傳播",49,"黃花酢漿草的果實成熟後，靠什麼方式傳播種子？","自身彈力","水力","風力","動物力","A","黃花酢漿草果實成熟後，可以把種子彈出去，是「自身彈力傳播」。"],[26,"果實與種子傳播",49,"非洲鳳仙花的果實成熟後，會發生什麼事？","長出薄薄的翅膀","果皮捲曲，把種子彈出去","長出倒鉤","浮在水面上","B","非洲鳳仙花果實成熟後，果皮會捲曲，用自身的力量把種子彈出去。"],[27,"果實與種子傳播",50,"雀榕的果實顏色鮮豔、氣味芳香甜美，是為了什麼？","讓風吹得更遠","在水上漂浮","嚇跑鳥類","吸引動物採食，幫忙傳播","D","雀榕的果實會吸引動物採食，靠「動物力」傳播。"],[28,"果實與種子傳播",50,"大花咸豐草的果實有倒鉤，它怎麼傳播種子？","靠水流漂走","靠自己彈開","靠薄翅膀飛走","鉤在動物身上，被帶到遠方","D","大花咸豐草果實的倒鉤可以鉤在動物身上，把種子傳到遠方。"],[29,"果實與種子傳播",51,"林投和椰子的果實能浮在水面上，是因為？","果實很重","富含纖維質，有儲藏空氣的構造","表面有黏液","長滿倒鉤","B","這些果實富含纖維質及儲藏空氣的構造，可以浮在水面，隨水流傳播到遠處。"],[30,"果實與種子傳播",51,"下面哪一種植物，是靠「水力」傳播？","蒲公英","大花咸豐草","椰子","黃花酢漿草","C","椰子可以在海上漂浮，隨海水傳播；蒲公英靠風力、大花咸豐草靠動物力、黃花酢漿草靠自身彈力。"]];

/* ---------------- 網頁進入點 ---------------- */

function doGet(e) {
  ensure_();
  const admin = e && e.parameter && e.parameter.page === 'admin';
  if (admin) {
    return HtmlService.createHtmlOutput('老師後台已搬到 GitHub 頁面：<a href="' + ADMIN_URL + '">' + ADMIN_URL + '</a>')
      .setTitle('植物大考驗 後台');
  }
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('植物大考驗 PK賽')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

const ADMIN_URL = 'https://lamp4615-design.github.io/science-unit1/plants/admin.html';

/** 後台 API：GitHub 上的後台頁面用 fetch POST 呼叫，只開放 ADM_API 裡的函式，且每個函式都會驗證後台密碼。 */
function doPost(e) {
  let out;
  try {
    const req = JSON.parse(e.postData.contents);
    const fn = ADM_API[String(req.fn)];
    out = fn ? fn.apply(null, req.args || []) : {error: 'bad request'};
  } catch (err) {
    out = {error: String(err && err.message || err)};
  }
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}

function include(name) {
  return HtmlService.createHtmlOutputFromFile(name).getContent();
}

/** 第一次可手動執行一次，會建立所有分頁。 */
function setup() {
  ensure_();
  return '完成。後台密碼在「設定」分頁。';
}

/* ---------------- 試算表存取 ---------------- */

// 同一次呼叫裡，同一張表只讀一次（每次呼叫都是新的執行環境，不會讀到上一次的舊資料）。
// 寫入某張表之後要呼叫 dirty_() 清掉它的暫存。
const MEMO = {};
const SHEETS = {};

function dirty_(key) {
  delete MEMO[key];
}

function ensure_() {
  Object.keys(SPEC).forEach(function (k) { sheet_(k); });
}

function sheet_(key) {
  if (SHEETS[key]) return SHEETS[key];
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const spec = SPEC[key];
  let sh = ss.getSheetByName(spec.name);
  if (!sh) {
    sh = ss.insertSheet(spec.name);
    sh.getRange(1, 1, 1, spec.head.length).setValues([spec.head]);
    sh.setFrozenRows(1);
    seed_(key, sh);
  }
  SHEETS[key] = sh;
  return sh;
}

function seed_(key, sh) {
  if (key === 'config') {
    const pw = randomPw_();
    sh.getRange(2, 1, 3, 2).setValues([[K_PW, pw], [K_SEC, 20], [K_EPOCH, 1]]);
  } else if (key === 'questions') {
    sh.getRange(2, 1, SEED.length, 10).setValues(SEED);
  }
}

function randomPw_() {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  let s = '';
  for (let i = 0; i < 6; i++) s += chars.charAt(Math.floor(Math.random() * chars.length));
  return s;
}

function table_(key) {
  if (MEMO[key]) return MEMO[key];
  const sh = sheet_(key);
  const spec = SPEC[key];
  const last = sh.getLastRow();
  if (last < 2) return [];
  const vals = sh.getRange(2, 1, last - 1, spec.cols.length).getValues();
  const out = [];
  vals.forEach(function (r, i) {
    if (String(r[0]).trim() === '') return;
    const o = {_row: i + 2};
    spec.cols.forEach(function (c, j) {
      let v = r[j];
      if (v instanceof Date) v = Utilities.formatDate(v, TZ, 'MM/dd HH:mm:ss');
      o[c] = v;
    });
    out.push(o);
  });
  MEMO[key] = out;
  return out;
}

function setCells_(key, row, obj) {
  const sh = sheet_(key);
  const cols = SPEC[key].cols;
  Object.keys(obj).forEach(function (k) {
    const c = cols.indexOf(k);
    if (c >= 0) sh.getRange(row, c + 1).setValue(obj[k]);
  });
  dirty_(key);
}

function cfg_(name, def) {
  const r = table_('config').filter(function (x) { return x.key === name; })[0];
  return r && String(r.value) !== '' ? r.value : def;
}

function setCfg_(name, val) {
  const r = table_('config').filter(function (x) { return x.key === name; })[0];
  if (r) setCells_('config', r._row, {value: val});
  else { sheet_('config').appendRow([name, val]); dirty_('config'); }
}

function truthy_(v) {
  return v === true || v === 1 || String(v).toUpperCase() === 'TRUE';
}

function secLimit_() {
  const n = Number(cfg_(K_SEC, 20));
  return n > 0 ? n : 20;
}

function nowStr_() {
  return Utilities.formatDate(new Date(), TZ, 'MM/dd HH:mm:ss');
}

function questions_() {
  return table_('questions').map(function (r) {
    return {
      id: Number(r.id), topic: String(r.topic), page: r.page, text: String(r.text),
      opts: [r.a, r.b, r.c, r.d].map(String),
      ans: 'ABCD'.indexOf(String(r.ans).trim().toUpperCase()),
      exp: String(r.exp || '')
    };
  }).filter(function (q) { return q.text && q.ans >= 0; })
    .sort(function (a, b) { return a.id - b.id; });
}

/* ---------------- 階段：個人賽 → S 型分組 → 團體賽 ---------------- */

function phase_(cls) {
  return String(cfg_(K_PHASE + cls, 'solo')) === 'team' ? 'team' : 'solo';
}

/** 個人賽題數：預設題庫的一半，至少 1 題。都是題庫最前面的題目。 */
function soloCount_(total) {
  let n = Number(cfg_(K_SOLO, Math.ceil(total / 2)));
  if (!(n >= 1)) n = 1;
  if (n > total) n = total;
  return Math.floor(n);
}

/**
 * 團體賽題數：預設全部題目。團體賽和個人賽各自獨立取題庫最前面 N 題，
 * 兩邊可以重疊（同一題在個人賽考過，團體賽也會再考一次），不互相排擠。
 */
function teamCount_(total) {
  let n = Number(cfg_(K_TEAM, total));
  if (!(n >= 1)) n = 1;
  if (n > total) n = total;
  return Math.floor(n);
}

function soloQs_(qs) { return qs.slice(0, soloCount_(qs.length)); }
function teamQs_(qs) { return qs.slice(0, teamCount_(qs.length)); }

/** 這個班目前這個階段要作答的題目。 */
function phaseQs_(cls) {
  const qs = questions_();
  return phase_(cls) === 'solo' ? soloQs_(qs) : teamQs_(qs);
}

function idSet_(qs) {
  const o = {};
  qs.forEach(function (q) { o[String(q.id)] = true; });
  return o;
}

function classOf_(name) {
  return table_('classes').filter(function (c) { return String(c.name) === String(name); })[0];
}

function teamInfo_(n) {
  const t = TEAMS[(Number(n) - 1 + TEAMS.length * 10) % TEAMS.length];
  return {team: Number(n), teamName: t.name, color: t.color};
}

function meInfo_(st) {
  const phase = phase_(st.cls);
  if (phase === 'solo') {
    return {cls: String(st.cls), seat: Number(st.seat), name: String(st.name || ''), team: 0, teamName: '個人賽', color: '#557060', phase: phase};
  }
  const t = teamInfo_(st.team);
  return {cls: String(st.cls), seat: Number(st.seat), name: String(st.name || ''), team: t.team, teamName: t.teamName, color: t.color, phase: phase};
}

/* ---------------- 亂數：每位學生題目與選項順序不同 ---------------- */

function hash_(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

function rng_(seed) {
  let a = seed;
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function shuffle_(arr, seedStr) {
  const r = rng_(hash_(seedStr));
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    const t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}

/* ---------------- 學生 API ---------------- */

function api_classes() {
  ensure_();
  return {
    classes: table_('classes').map(function (c) { return {name: String(c.name), open: truthy_(c.open)}; }),
    total: questions_().length,
    sec: secLimit_()
  };
}

function api_seats(cls) {
  return table_('roster')
    .filter(function (r) { return String(r.cls) === String(cls); })
    .sort(function (a, b) { return a.seat - b.seat; })
    .map(function (r) {
      if (phase_(cls) === 'solo') return {seat: Number(r.seat), name: String(r.name || ''), teamName: '個人賽', color: '#CFDDCF'};
      const t = teamInfo_(r.team);
      return {seat: Number(r.seat), name: String(r.name || ''), teamName: t.teamName, color: t.color};
    });
}

function api_login(cls, seat, pin) {
  cls = String(cls); seat = Number(seat);
  const cache = CacheService.getScriptCache();
  const fk = 'fail|' + cls + '|' + seat;
  const fails = Number(cache.get(fk) || 0);
  if (fails >= 5) return {error: '試太多次了，請舉手請老師幫忙'};
  const st = table_('roster').filter(function (r) { return String(r.cls) === cls && Number(r.seat) === seat; })[0];
  if (!st) return {error: '找不到這個座號'};
  if (String(st.pin).trim() !== String(pin).trim()) {
    cache.put(fk, String(fails + 1), 300);
    return {error: '密碼不對，再試一次'};
  }
  cache.remove(fk);
  const token = Utilities.getUuid();
  setCells_('roster', st._row, {token: token, last: nowStr_()});
  return {token: token, me: meInfo_(st)};
}

function byToken_(token) {
  if (!token) return null;
  return table_('roster').filter(function (r) { return r.token && String(r.token) === String(token); })[0] || null;
}

function api_resume(token) {
  const st = byToken_(token);
  if (!st) return {error: 'expired'};
  return {me: meInfo_(st)};
}

function mine_(cls, seat) {
  return table_('answers').filter(function (a) { return String(a.cls) === String(cls) && Number(a.seat) === Number(seat); });
}

/**
 * 一筆作答紀錄屬於個人賽還是團體賽。新寫入的紀錄都有 phase 欄位；
 * 舊資料（升級前寫入的，沒有 phase 欄位）用題號是否落在當時的個人賽範圍內來推斷。
 */
function rowPhase_(a, soloSet) {
  const p = String(a.phase || '').trim();
  if (p === 'solo' || p === 'team') return p;
  return soloSet[String(a.qid)] ? 'solo' : 'team';
}

/** 這位同學在「目前階段」的作答紀錄。個人賽和團體賽可能考同一題，要靠 phase 欄位分開算，不能只看題號。 */
function phaseAnswers_(cls, seat) {
  const ph = phase_(cls);
  const soloSet = idSet_(soloQs_(questions_()));
  return mine_(cls, seat).filter(function (a) { return rowPhase_(a, soloSet) === ph; });
}

function totals_(list) {
  const t = {answered: 0, correct: 0, points: 0};
  list.forEach(function (a) { t.answered++; t.correct += Number(a.ok) ? 1 : 0; t.points += Number(a.pts) || 0; });
  return t;
}

// key 裡帶目前階段，個人賽、團體賽重複考同一題時，計時和重複交卷記號才不會互相干擾。
function startKey_(cls, seat, qid) {
  return 'start|' + cfg_(K_EPOCH, 1) + '|' + phase_(cls) + '|' + cls + '|' + seat + '|' + qid;
}

function api_next(token) {
  const st = byToken_(token);
  if (!st) return {error: '請重新登入', relogin: true};
  const cl = classOf_(st.cls);
  const me = meInfo_(st);
  const qs = phaseQs_(st.cls);
  const list = phaseAnswers_(st.cls, st.seat);
  const totals = totals_(list);
  if (!cl || !truthy_(cl.open)) return {closed: true, me: me, totals: totals, total: qs.length};
  const order = shuffle_(qs.map(function (q) { return q.id; }), st.cls + '|' + st.seat + '|' + phase_(st.cls));
  const done = {};
  list.forEach(function (a) { done[String(a.qid)] = true; });
  const nextId = order.filter(function (id) { return !done[String(id)]; })[0];
  if (nextId === undefined) return {done: true, me: me, totals: totals, total: qs.length};
  const q = qs.filter(function (x) { return x.id === nextId; })[0];
  const idx = shuffle_([0, 1, 2, 3], st.cls + '|' + st.seat + '|' + q.id);
  const sec = secLimit_();
  const cache = CacheService.getScriptCache();
  const key = startKey_(st.cls, st.seat, q.id);
  let t0 = Number(cache.get(key) || 0);
  if (!t0) { t0 = Date.now(); cache.put(key, String(t0), 3600); }
  return {
    me: me, totals: totals,
    q: {
      id: q.id, topic: q.topic, page: q.page, text: q.text,
      options: idx.map(function (i) { return q.opts[i]; }),
      sec: sec, remainMs: Math.max(0, sec * 1000 - (Date.now() - t0)),
      n: totals.answered + 1, total: qs.length
    }
  };
}

/**
 * 交答案。讀資料、算分都在鎖外面做，鎖裡只做「檢查有沒有重複交」和「寫一列」，
 * 全班同時交答案時才不會排隊太久。重複交（網路重試、連點）用快取記號擋掉。
 */
function api_answer(token, qid, choice) {
  const st = byToken_(token);
  if (!st) return {error: '請重新登入', relogin: true};
  qid = Number(qid); choice = Number(choice);
  const pqs = phaseQs_(st.cls);
  const q = pqs.filter(function (x) { return x.id === qid; })[0];
  if (!q) return {error: '這一題已經結束了'};
  const idx = shuffle_([0, 1, 2, 3], st.cls + '|' + st.seat + '|' + q.id);
  const list = phaseAnswers_(st.cls, st.seat);
  const totals = totals_(list);
  const reply = function (ok, pts, dup) {
    return {dup: dup, correct: !!ok, points: pts, correctIndex: idx.indexOf(q.ans), explanation: q.exp, page: q.page,
      timeout: !dup && choice < 0, totals: totals};
  };
  const prev = list.filter(function (a) { return Number(a.qid) === qid; })[0];
  if (prev) return reply(Number(prev.ok), Number(prev.pts) || 0, true);

  const sec = secLimit_();
  const cache = CacheService.getScriptCache();
  const key = startKey_(st.cls, st.seat, qid);
  const t0 = Number(cache.get(key) || 0);
  const ms = t0 ? Date.now() - t0 : sec * 1000;
  const inTime = choice >= 0 && choice <= 3 && ms <= sec * 1000 + 3000;
  const correct = inTime && idx[choice] === q.ans;
  const points = correct ? 10 + Math.round(5 * Math.max(0, 1 - ms / (sec * 1000))) : 0;
  const label = choice >= 0 && choice <= 3 ? q.opts[idx[choice]] : '(逾時)';
  const doneKey = 'done|' + key; // key 裡有重置次數，清除成績後記號自動失效

  const lock = LockService.getScriptLock();
  lock.waitLock(20000); // 等不到會丟錯，學生端會自動重試
  try {
    const hit = cache.get(doneKey);
    if (hit) {
      const h = JSON.parse(hit);
      totals.answered++; totals.correct += h.ok; totals.points += h.pts;
      return reply(h.ok, h.pts, true);
    }
    sheet_('answers').appendRow([nowStr_(), String(st.cls), Number(st.seat), qid, label, correct ? 1 : 0, Math.min(ms, sec * 1000), points, phase_(st.cls)]);
    SpreadsheetApp.flush();
    cache.put(doneKey, JSON.stringify({ok: correct ? 1 : 0, pts: points}), 21600);
  } finally {
    lock.releaseLock();
  }
  dirty_('answers');
  cache.remove(key);
  totals.answered++; totals.correct += correct ? 1 : 0; totals.points += points;
  return reply(correct, points, false);
}

/* ---------------- 排行榜計算 ---------------- */

/**
 * 每位學生的成績。answered / correct / points / ms 是「目前階段」的數字（個人賽或團體賽），
 * soloPoints / soloMs / soloAnswered 固定是個人賽成績（S 型分組用），teamPoints 固定是團體賽成績。
 * 排名：分數高的在前；同分時有作答的排在完全沒作答的前面，再比花費時間，最後比座號。
 */
function studentStats_(cls, roster, answers) {
  const phase = phase_(cls);
  const soloSet = idSet_(soloQs_(questions_()));
  const by = {};
  roster.forEach(function (r) {
    by[Number(r.seat)] = {
      seat: Number(r.seat), name: String(r.name || ''), team: Number(r.team), pin: String(r.pin),
      logged: String(r.last || '').trim() !== '', last: String(r.last || ''),
      answered: 0, correct: 0, points: 0, ms: 0,
      soloPoints: 0, soloMs: 0, soloAnswered: 0, teamPoints: 0,
      _s: {answered: 0, correct: 0, points: 0, ms: 0}, _t: {answered: 0, correct: 0, points: 0, ms: 0}
    };
  });
  answers.forEach(function (a) {
    if (String(a.cls) !== String(cls)) return;
    const s = by[Number(a.seat)];
    if (!s) return;
    const b = rowPhase_(a, soloSet) === 'solo' ? s._s : s._t;
    b.answered++;
    b.correct += Number(a.ok) ? 1 : 0;
    b.points += Number(a.pts) || 0;
    b.ms += Number(a.ms) || 0;
  });
  const arr = Object.keys(by).map(function (k) { return by[k]; });
  arr.forEach(function (s) {
    const cur = phase === 'solo' ? s._s : s._t;
    s.answered = cur.answered; s.correct = cur.correct; s.points = cur.points; s.ms = cur.ms;
    s.soloPoints = s._s.points; s.soloMs = s._s.ms; s.soloAnswered = s._s.answered; s.teamPoints = s._t.points;
    delete s._s; delete s._t;
  });
  arr.sort(byRank_);
  arr.forEach(function (s, i) { s.rank = i + 1; });
  return arr;
}

function byRank_(a, b) {
  return b.points - a.points || (b.answered > 0) - (a.answered > 0) || a.ms - b.ms || a.seat - b.seat;
}

/** 各組平均：只算團體賽有作答的同學，缺席的人不會把組平均拉低。 */
function teamStats_(students, teamCount) {
  const out = [];
  for (let i = 1; i <= teamCount; i++) {
    const m = students.filter(function (s) { return s.team === i; });
    const act = m.filter(function (s) { return s.answered > 0; });
    const pts = act.reduce(function (x, s) { return x + s.points; }, 0);
    const t = teamInfo_(i);
    out.push({idx: i, name: t.teamName, color: t.color, size: m.length, active: act.length, points: pts,
      avg: act.length ? Math.round(pts / act.length * 10) / 10 : 0});
  }
  const ranked = out.slice().sort(function (a, b) { return b.avg - a.avg; });
  out.forEach(function (t) { t.rank = ranked.indexOf(t) + 1; });
  return out;
}

function api_board(token) {
  const st = byToken_(token);
  if (!st) return {error: '請重新登入', relogin: true};
  const cl = classOf_(st.cls);
  const roster = table_('roster').filter(function (r) { return String(r.cls) === String(st.cls); });
  const students = studentStats_(st.cls, roster, table_('answers'));
  const phase = phase_(st.cls);
  const nQ = phaseQs_(st.cls).length;
  const teams = phase === 'team' ? teamStats_(students, Number(cl ? cl.teams : 4)) : [];
  const me = students.filter(function (s) { return s.seat === Number(st.seat); })[0];
  return {
    phase: phase,
    teams: teams,
    top: students.slice(0, 5).map(function (s) { return {seat: s.seat, name: s.name, team: s.team, points: s.points, answered: s.answered}; }),
    me: {rank: me.rank, points: me.points, correct: me.correct, answered: me.answered},
    size: students.length,
    unfinished: students.filter(function (s) { return s.logged && s.answered < nQ; }).length
  };
}

/* ---------------- 老師後台 API ---------------- */

function auth_(pw) {
  return String(pw) === String(cfg_(K_PW, '')) ? null : {error: 'auth'};
}

function adm_check(pw) {
  return auth_(pw) || {ok: true};
}

function adm_data(pw, cls) {
  const bad = auth_(pw); if (bad) return bad;
  ensure_();
  const classes = table_('classes').map(function (c) { return {name: String(c.name), teams: Number(c.teams), open: truthy_(c.open)}; });
  if (!cls || (cls !== '*' && !classes.some(function (c) { return c.name === cls; }))) cls = classes.length ? classes[0].name : '';
  const qs = questions_();
  const allAnswers = table_('answers');
  const nSolo = soloCount_(qs.length);
  const nTeam = teamCount_(qs.length);
  const out = {
    classes: classes, cls: cls, sec: secLimit_(), totalQ: qs.length, now: nowStr_(),
    soloCount: nSolo, teamCount: nTeam, totalAll: qs.length, phase: '', teamDefs: TEAMS,
    students: [], teams: [], qstats: [], topics: []
  };
  if (cls && cls !== '*') {
    out.phase = phase_(cls);
    out.totalQ = out.phase === 'solo' ? nSolo : nTeam;
  }
  if (!cls) return out;
  const rosterAll = table_('roster');
  const targets = cls === '*' ? classes.map(function (c) { return c.name; }) : [cls];
  const answers = allAnswers.filter(function (a) { return targets.indexOf(String(a.cls)) >= 0; });

  if (cls !== '*') {
    const cl = classes.filter(function (c) { return c.name === cls; })[0];
    const roster = rosterAll.filter(function (r) { return String(r.cls) === cls; });
    out.students = studentStats_(cls, roster, allAnswers);
    out.teams = out.phase === 'team' ? teamStats_(out.students, cl.teams) : [];
  } else {
    let all = [];
    targets.forEach(function (c) {
      const roster = rosterAll.filter(function (r) { return String(r.cls) === c; });
      studentStats_(c, roster, allAnswers).forEach(function (s) { s.cls = c; all.push(s); });
    });
    all.sort(byRank_);
    all.forEach(function (s, i) { s.rank = i + 1; });
    out.students = all;
  }

  // 個人賽、團體賽各自統計：同一題在兩邊都考過的話，會分別出現一列，不會混在一起算答對率。
  const soloList = soloQs_(qs), teamList = teamQs_(qs);
  const soloIdSet = idSet_(soloList);
  const qmap = {};
  function seedQ_(list, ph) {
    list.forEach(function (q) {
      qmap[q.id + '|' + ph] = {id: q.id, topic: q.topic, page: q.page, text: q.text, solo: ph === 'solo', both: false, n: 0, ok: 0, wrong: {}};
    });
  }
  seedQ_(soloList, 'solo');
  seedQ_(teamList, 'team');
  soloList.forEach(function (q) {
    if (qmap[q.id + '|team']) { qmap[q.id + '|solo'].both = true; qmap[q.id + '|team'].both = true; }
  });
  answers.forEach(function (a) {
    const ph = rowPhase_(a, soloIdSet);
    const m = qmap[Number(a.qid) + '|' + ph];
    if (!m) return;
    m.n++;
    if (Number(a.ok)) m.ok++;
    else { const k = String(a.choice); m.wrong[k] = (m.wrong[k] || 0) + 1; }
  });
  const topicMap = {};
  Object.keys(qmap).forEach(function (k) {
    const m = qmap[k];
    const top = Object.keys(m.wrong).sort(function (x, y) { return m.wrong[y] - m.wrong[x]; })[0];
    out.qstats.push({id: m.id, solo: m.solo, both: m.both, topic: m.topic, page: m.page, text: m.text, n: m.n, ok: m.ok, topWrong: top || '', topWrongN: top ? m.wrong[top] : 0});
    const t = topicMap[m.topic] || (topicMap[m.topic] = {topic: m.topic, n: 0, ok: 0});
    t.n += m.n; t.ok += m.ok;
  });
  out.topics = Object.keys(topicMap).map(function (k) { return topicMap[k]; });
  return out;
}

function adm_setOpen(pw, cls, open) {
  const bad = auth_(pw); if (bad) return bad;
  table_('classes').forEach(function (c) {
    if (cls === '*' || String(c.name) === String(cls)) setCells_('classes', c._row, {open: open ? 'TRUE' : 'FALSE'});
  });
  return {ok: true};
}

function adm_createClass(pw, name, count, teams) {
  const bad = auth_(pw); if (bad) return bad;
  name = String(name || '').trim();
  count = Number(count); teams = Number(teams);
  if (!name) return {error: '請輸入班級名稱'};
  if (!(count >= 1 && count <= 60)) return {error: '人數請填 1 到 60'};
  if (!(teams >= 1 && teams <= TEAMS.length)) return {error: '組數請填 1 到 ' + TEAMS.length};
  if (classOf_(name)) return {error: '已經有這個班級了'};
  const used = {};
  const rows = [];
  for (let s = 1; s <= count; s++) {
    let pin;
    do { pin = String(1000 + Math.floor(Math.random() * 9000)); } while (used[pin]);
    used[pin] = true;
    rows.push([name, s, '', ((s - 1) % teams) + 1, pin, '', '']);
  }
  sheet_('classes').appendRow([name, teams, 'FALSE']);
  const sh = sheet_('roster');
  sh.getRange(sh.getLastRow() + 1, 1, rows.length, 7).setValues(rows);
  dirty_('classes'); dirty_('roster');
  return {ok: true, cls: name};
}

function adm_setNames(pw, cls, names) {
  const bad = auth_(pw); if (bad) return bad;
  const roster = table_('roster').filter(function (r) { return String(r.cls) === String(cls); });
  roster.forEach(function (r) {
    const n = names[Number(r.seat) - 1];
    if (n !== undefined) setCells_('roster', r._row, {name: String(n).trim()});
  });
  return {ok: true};
}

function adm_resetAnswers(pw, cls) {
  const bad = auth_(pw); if (bad) return bad;
  const sh = sheet_('answers');
  const spec = SPEC.answers;
  const last = sh.getLastRow();
  let keep = [];
  if (last >= 2 && cls !== '*') {
    keep = sh.getRange(2, 1, last - 1, spec.cols.length).getValues()
      .filter(function (r) { return String(r[1]) !== String(cls); });
  }
  sh.clearContents();
  sh.getRange(1, 1, 1, spec.head.length).setValues([spec.head]);
  if (keep.length) sh.getRange(2, 1, keep.length, spec.cols.length).setValues(keep);
  dirty_('answers');
  setCfg_(K_EPOCH, Number(cfg_(K_EPOCH, 1)) + 1);
  table_('classes').forEach(function (c) {
    if (cls === '*' || String(c.name) === String(cls)) setCfg_(K_PHASE + c.name, 'solo');
  });
  return {ok: true};
}

function adm_setSec(pw, sec) {
  const bad = auth_(pw); if (bad) return bad;
  sec = Number(sec);
  if (!(sec >= 5 && sec <= 120)) return {error: '秒數請填 5 到 120'};
  setCfg_(K_SEC, sec);
  return {ok: true};
}

function adm_setPassword(pw, newPw) {
  const bad = auth_(pw); if (bad) return bad;
  newPw = String(newPw || '').trim();
  if (newPw.length < 4) return {error: '密碼至少 4 個字'};
  setCfg_(K_PW, newPw);
  return {ok: true};
}

function adm_newPins(pw, cls) {
  const bad = auth_(pw); if (bad) return bad;
  const used = {};
  table_('roster').filter(function (r) { return String(r.cls) === String(cls); }).forEach(function (r) {
    let pin;
    do { pin = String(1000 + Math.floor(Math.random() * 9000)); } while (used[pin]);
    used[pin] = true;
    setCells_('roster', r._row, {pin: pin, token: ''});
  });
  return {ok: true};
}

/**
 * 套用組別。S 型分組的預覽與手動調整都在後台畫面做，這裡只負責檢查並寫入。
 * k：組數；assign：[[座號, 組別], ...]，班上每位同學都要分到 1～k 組。
 * 個人賽階段送出：寫入組別、切換到團體賽並暫停作答。團體賽中送出：只更新組別（分數跟著人走）。
 */
function adm_applyTeams(pw, cls, k, assign) {
  const bad = auth_(pw); if (bad) return bad;
  const cl = classOf_(cls);
  if (!cl) return {error: '請先選一個班級'};
  k = Number(k);
  if (!(k >= 1 && k <= TEAMS.length && k === Math.floor(k))) return {error: '組數請填 1 到 ' + TEAMS.length};
  const teamOf = {};
  (assign || []).forEach(function (p) { teamOf[Number(p[0])] = Number(p[1]); });
  const roster = table_('roster').filter(function (r) { return String(r.cls) === String(cls); });
  if (!roster.length) return {error: '這個班級還沒有名單'};
  const miss = roster.filter(function (r) {
    const t = teamOf[Number(r.seat)];
    return !(t >= 1 && t <= k && t === Math.floor(t));
  });
  if (miss.length) return {error: miss.map(function (r) { return r.seat; }).join('、') + ' 號還沒有分到組'};

  // 整欄讀出、改好再一次寫回，比一格一格寫快很多
  const sh = sheet_('roster');
  const rng = sh.getRange(2, SPEC.roster.cols.indexOf('team') + 1, sh.getLastRow() - 1, 1);
  const vals = rng.getValues();
  roster.forEach(function (r) { vals[r._row - 2][0] = teamOf[Number(r.seat)]; });
  rng.setValues(vals);
  dirty_('roster');

  const start = phase_(cls) === 'solo';
  setCells_('classes', cl._row, start ? {teams: k, open: 'FALSE'} : {teams: k});
  if (start) setCfg_(K_PHASE + cls, 'team');
  return {ok: true, started: start};
}

/** 回到個人賽（不清除成績；已作答的題目仍算已答）。 */
function adm_backToSolo(pw, cls) {
  const bad = auth_(pw); if (bad) return bad;
  if (!classOf_(cls)) return {error: '請先選一個班級'};
  setCfg_(K_PHASE + cls, 'solo');
  return {ok: true};
}

function adm_setSolo(pw, n) {
  const bad = auth_(pw); if (bad) return bad;
  const total = questions_().length;
  n = Number(n);
  if (!(n >= 1 && n <= total)) return {error: '個人賽題數請填 1 到 ' + total};
  setCfg_(K_SOLO, Math.floor(n));
  return {ok: true};
}

/** 團體賽題數。可以跟個人賽題數重疊——同一題考過還會再考一次。 */
function adm_setTeam(pw, n) {
  const bad = auth_(pw); if (bad) return bad;
  const total = questions_().length;
  n = Number(n);
  if (!(n >= 1 && n <= total)) return {error: '團體賽題數請填 1 到 ' + total};
  setCfg_(K_TEAM, Math.floor(n));
  return {ok: true};
}

const ADM_API = {
  adm_check: adm_check, adm_data: adm_data, adm_setOpen: adm_setOpen, adm_createClass: adm_createClass,
  adm_setNames: adm_setNames, adm_resetAnswers: adm_resetAnswers, adm_setSec: adm_setSec,
  adm_setPassword: adm_setPassword, adm_newPins: adm_newPins,
  adm_applyTeams: adm_applyTeams, adm_backToSolo: adm_backToSolo, adm_setSolo: adm_setSolo, adm_setTeam: adm_setTeam
};
