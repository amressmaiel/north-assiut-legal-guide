/* Shared state and helpers */
const state = {
  view: "home",
  listType: "all",
  topic: "all",
  query: "",
  searchLawFilter: "all",
  selectedArticleId: null,
  visibleFields: new Set((window.EXECUTIVE_FIELDS || []).map(field => field.key))
};

const labels = {
  all: "جميع المواد",
  modified: "المواد المعدلة أو المعاد تنظيمها",
  introduced: "المواد المستحدثة بالكامل"
};

function modules(){ return typeof window.getLawModules === "function" ? window.getLawModules() : []; }
function activeLaw(){ return typeof window.getActiveLawModule === "function" ? window.getActiveLawModule() : null; }
function appData(){ const law=activeLaw(); return law && Array.isArray(law.articles) ? law.articles : []; }
function allAppData(){ return typeof window.getAllLawArticles === "function" ? window.getAllLawArticles() : appData(); }
function fields(){ const law=activeLaw(); return law && Array.isArray(law.fields) ? law.fields : (Array.isArray(window.EXECUTIVE_FIELDS) ? window.EXECUTIVE_FIELDS : []); }
function meta(){ const law=activeLaw(); return law && law.meta ? law.meta : {totalArticles:0,modifiedArticles:0,introducedArticles:0}; }
function esc(value){ return String(value ?? "").replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m])); }
function nl(value){ return esc(value).replace(/\n/g,"<br>"); }
function currentLawTitle(){ const law=activeLaw(); return law ? `${law.title} ${law.number ? `— ${law.number}` : ""}` : "الدليل القضائي الذكي"; }
