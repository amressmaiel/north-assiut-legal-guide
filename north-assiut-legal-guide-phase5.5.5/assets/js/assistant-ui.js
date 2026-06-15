/* SAND assistant chat interface: modes, contextual questions, sources and smart suggestions */
let sandContextArticleId=null;
const SAND_MODE_LABELS={brief:"⚡ مختصر",executive:"🛡️ تنفيذي",detailed:"📚 تفصيلي",educational:"🎓 تعليمي"};
function getSandAnswerMode(){return localStorage.getItem("sand_answer_mode")||"executive";}
function setSandAnswerMode(mode){
  if(!SAND_MODE_LABELS[mode])return;
  localStorage.setItem("sand_answer_mode",mode);
  document.querySelectorAll(".sand-mode-btn").forEach(btn=>btn.classList.toggle("active",btn.dataset.mode===mode));
}
window.setSandAnswerMode=setSandAnswerMode;
function toggleChat(force){
  closeMobileMenu();
  const win=document.getElementById("chatWindow");
  const open=typeof force==="boolean"?force:!win.classList.contains("open");
  win.classList.toggle("open",open);
  if(open){setTimeout(()=>document.getElementById("chatInput").focus(),50);setSandAnswerMode(getSandAnswerMode());}
}
function useQuickPrompt(text){document.getElementById("chatInput").value=text;sendChatMessage()}
const sandWaitingMessages=[
  "سَنَد بيراجع المواد الأقرب لسؤالك...",
  "ثواني يا فندم، بجمع لك النقاط المهمة من الدليل...",
  "جاري مطابقة السؤال مع النصوص والتنبيهات التنفيذية...",
  "سَنَد بيرتب الإجابة علشان توصل للمعلومة من غير لف ودوران...",
  "براجع السياق السابق والمواد المرتبطة بالسؤال..."
];
function createSandLoader(){
  const loader=document.createElement("div");loader.className="bubble ai typing-bubble";loader.id="typingLoader";
  const selectedMessage=sandWaitingMessages[Math.floor(Math.random()*sandWaitingMessages.length)];
  loader.innerHTML=`<span class="typing-dots"><b></b><b></b><b></b></span><i>${selectedMessage}</i>`;return loader;
}
function removeSandLoader(loader){if(loader)loader.remove();}
function renderSandSuggestions(items=[]){
  if(!Array.isArray(items)||!items.length)return "";
  const buttons=items.slice(0,4).map(text=>`<button class="suggestion-chip" onclick="useQuickPrompt(decodeURIComponent('${encodeURIComponent(text)}'))">${esc(text)}</button>`).join("");
  return `<div class="follow-up-box"><span>ممكن نكمل من هنا:</span><div class="follow-up-actions">${buttons}</div></div>`;
}
function renderSandSources(items=[]){
  if(!Array.isArray(items)||!items.length)return "";
  const unique=[];const seen=new Set();items.forEach(item=>{if(item&&item.id&&!seen.has(item.id)){seen.add(item.id);unique.push(item);}});
  if(!unique.length)return "";
  return `<div class="sand-sources-box"><span>📌 المواد المستخدمة في الإجابة</span><div class="sand-source-actions">${unique.slice(0,6).map(item=>`<button class="sand-source-chip" onclick="openSandSource('${item.id}')"><b>${esc(item.articleNumber)}</b><small>${esc(item.lawName||"")}</small></button>`).join("")}</div></div>`;
}
function openSandSource(id){toggleChat(false);if(typeof openArticleAcrossLaws==="function")openArticleAcrossLaws(id);}
window.openSandSource=openSandSource;
function updateSandContextBadge(){
  const badge=document.getElementById("sandContextBadge");if(!badge)return;
  const article=sandContextArticleId&&typeof allAppData==="function"?allAppData().find(item=>item.id===sandContextArticleId):null;
  badge.classList.toggle("active",!!article);
  badge.innerHTML=article?`<span>السياق الحالي: ${esc(article.articleNumber)} — ${esc(article.shortTitle)}</span><button onclick="clearSandArticleContext()" title="إلغاء سياق المادة">✕</button>`:"";
}
function clearSandArticleContext(){sandContextArticleId=null;updateSandContextBadge();}
window.clearSandArticleContext=clearSandArticleContext;
function askSandAboutArticle(id){
  const article=typeof allAppData==="function"?allAppData().find(item=>item.id===id):null;if(!article)return;
  sandContextArticleId=id;toggleChat(true);updateSandContextBadge();
  const input=document.getElementById("chatInput");input.value=`اشرح لي ${article.articleNumber} ووضح أهم النقاط العملية والتنبيهات المرتبطة بها`;
  input.focus();
}
window.askSandAboutArticle=askSandAboutArticle;
async function sendChatMessage(){
  const input=document.getElementById("chatInput"),query=input.value.trim();if(!query)return;
  const box=document.getElementById("chatBox");
  box.insertAdjacentHTML("beforeend",`<div class="bubble user">${esc(query)}</div>`);
  input.value="";box.scrollTop=box.scrollHeight;
  const loader=createSandLoader();box.appendChild(loader);box.scrollTop=box.scrollHeight;
  try{
    const result=typeof processHumanIntelligence==="function"?await processHumanIntelligence(query,{mode:getSandAnswerMode(),contextArticleId:sandContextArticleId}):{html:"تعذر تحميل محرك المساعد الذكي.",suggestions:[],sources:[]};
    removeSandLoader(loader);
    const html=typeof result==="string"?result:(result.html||"تعذر استلام الرد.");
    const suggestions=typeof result==="string"?[]:(result.suggestions||[]);
    const sources=typeof result==="string"?[]:(result.sources||[]);
    box.insertAdjacentHTML("beforeend",`<div class="bubble ai">${html}${renderSandSources(sources)}${renderSandSuggestions(suggestions)}</div>`);box.scrollTop=box.scrollHeight;
  }catch(err){removeSandLoader(loader);box.insertAdjacentHTML("beforeend",`<div class="bubble ai">تعذر تشغيل سَنَد حاليًا. جرّب مرة تانية بعد لحظات.</div>`);box.scrollTop=box.scrollHeight;}
}
