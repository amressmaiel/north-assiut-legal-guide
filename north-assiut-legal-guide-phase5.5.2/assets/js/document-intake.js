/**
 * =========================================================
 * 🛡️ سَنَد — الإدخال الآمن للمستندات والصوت (المرحلة 4.2)
 * =========================================================
 * - لا يرفع الصورة أو ملف PDF إلى الخادم.
 * - المعاينة والتغطية واستخراج النص تتم داخل المتصفح قدر الإمكان.
 * - النص المنقح فقط هو الذي يضاف إلى وصف الواقعة بعد مراجعة المستخدم.
 * - OCR للصور يعتمد على Tesseract.js ويُحمّل عند الطلب.
 * - قراءة PDF النصي تعتمد على PDF.js ويُحمّل عند الطلب.
 * - الإملاء الصوتي يعتمد على Web Speech API عند توفره في المتصفح.
 */
(function(){
  const MAX_FILE_MB = 12;
  const MAX_PDF_PAGES = 25;
  const TESSERACT_URL = "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js";
  const PDFJS_URL = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.min.mjs";
  const PDFJS_WORKER = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs";

  const intake = {
    file:null, fileType:"", originalName:"", canvas:null, ctx:null, baseImage:null,
    redactions:[], drawing:false, startX:0, startY:0, extractedText:"", pdfDoc:null,
    pdfPage:1, pdfTotalPages:0, busy:false, speech:null, speechActive:false,
    voiceText:"", localRecording:null, localChunks:[], localAudioUrl:""
  };

  function escHtml(value){return String(value??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));}
  function toast(message){ if(typeof judicialToast==="function")judicialToast(message); else alert(message); }
  function modalRoot(){return document.getElementById("sandSecureIntakeModal");}
  function removeModal(){const root=modalRoot();if(root)root.remove();stopSpeechRecognition();stopLocalRecording(true);}
  window.closeSandSecureIntake=removeModal;

  function loadScriptOnce(src,id){
    return new Promise((resolve,reject)=>{
      if(document.getElementById(id)) return resolve();
      const script=document.createElement("script");script.src=src;script.id=id;script.async=true;
      script.onload=resolve;script.onerror=()=>reject(new Error("تعذر تحميل المكتبة المطلوبة. تأكد من اتصال الإنترنت."));
      document.head.appendChild(script);
    });
  }
  async function loadPdfJs(){
    if(window.pdfjsLib)return window.pdfjsLib;
    try{
      const mod=await import(PDFJS_URL);
      mod.GlobalWorkerOptions.workerSrc=PDFJS_WORKER;
      window.pdfjsLib=mod;
      return mod;
    }catch(err){throw new Error("تعذر تحميل أداة قراءة PDF داخل المتصفح.");}
  }

  function privacyNoticeMarkup(){
    return `<section class="secure-intake-warning"><b>🔒 تنبيه إلزامي قبل المتابعة</b><p>استخدم نسخة منزوعة البيانات الحساسة قدر الإمكان. لا تُدرج أسماء حقيقية أو أرقامًا قومية أو عناوين أو هواتف أو صور أشخاص أو أرقام قضايا فعلية. الملف لا يتم رفعه إلى خادم المنصة؛ تتم المعالجة الأولية داخل المتصفح، ثم يضاف النص المنقح فقط بعد مراجعتك.</p><label><input id="secureIntakePrivacyAck" type="checkbox" onchange="refreshSecureIntakeActions()"><span>أقر أنني سأراجع المستند والنص المستخرج وأخفي أي بيانات تسمح بالتعرف على أصحاب الواقعة قبل إدخال النص إلى جلسة التحليل.</span></label></section>`;
  }

  function documentModal(){
    return `<div class="secure-intake-overlay" id="sandSecureIntakeModal"><section class="secure-intake-modal"><header><div><span>المرحلة 4.2</span><h2>📄 الإدخال الآمن لصورة أو ملف PDF</h2><p>غطِّ البيانات الحساسة، استخرج النص، راجعه، ثم أضفه إلى وصف الواقعة.</p></div><button onclick="closeSandSecureIntake()">✕</button></header>${privacyNoticeMarkup()}<div class="secure-intake-grid"><aside class="secure-intake-tools"><label class="secure-file-picker">📁 اختيار صورة أو PDF<input type="file" accept="image/png,image/jpeg,image/webp,application/pdf" onchange="handleSecureCaseFile(this.files[0])"></label><div id="secureFileMeta" class="secure-file-meta">لم يتم اختيار ملف بعد.</div><button onclick="setSecureIntakeMode('redact')">⬛ وضع التغطية اليدوية</button><button onclick="undoSecureRedaction()">↶ تراجع عن آخر تغطية</button><button onclick="clearSecureRedactions()">🧹 مسح التغطيات</button><button onclick="extractSecureCaseText()" id="secureExtractBtn">🔎 استخراج النص داخل المتصفح</button><button onclick="scanSecureSensitiveData()">🛡️ فحص النص بحثًا عن بيانات حساسة</button><small>في الصور الممسوحة ضوئيًا، دقة OCR تعتمد على وضوح الصورة. في PDF النصي يتم استخراج النص مباشرة. راجع الناتج دائمًا قبل استخدامه.</small></aside><main class="secure-intake-workspace"><div class="secure-preview-wrap"><canvas id="securePreviewCanvas"></canvas><div id="securePreviewEmpty">اختر صورة أو ملف PDF لعرض المعاينة هنا.</div></div><div class="secure-pdf-nav" id="securePdfNav"></div><label class="secure-extracted-label"><span>النص المستخرج — راجعه وعدّله قبل الإضافة</span><textarea id="secureExtractedText" rows="10" oninput="intakeTextChanged(this.value)" placeholder="سيظهر النص المستخرج هنا..."></textarea></label><div id="secureSensitiveReport" class="secure-sensitive-report"></div></main></div><footer><div><small>⚠️ لا تعتمد على الاستخراج الآلي وحده. المراجعة البشرية لازمة قبل الإرسال إلى سَنَد.</small></div><div><button onclick="closeSandSecureIntake()">إلغاء</button><button class="primary" id="secureInsertTextBtn" onclick="insertSecureTextIntoCase()" disabled>إضافة النص المنقح إلى الواقعة</button></div></footer></section></div>`;
  }

  function voiceModal(){
    return `<div class="secure-intake-overlay" id="sandSecureIntakeModal"><section class="secure-intake-modal voice"><header><div><span>المرحلة 4.2</span><h2>🎙️ حكي الواقعة صوتيًا</h2><p>استخدم الإملاء الصوتي للنص بعد إزالة أي أسماء أو بيانات حساسة من حديثك.</p></div><button onclick="closeSandSecureIntake()">✕</button></header><section class="secure-intake-warning"><b>🎙️ ملاحظة خصوصية مهمة</b><p>ميزة الإملاء الصوتي تعتمد على إمكانيات المتصفح وقد تستخدم خدمة مزود المتصفح لمعالجة الصوت. لا تستخدمها لذكر بيانات سرية أو بيانات قضية فعلية. يمكنك بدلًا منها الكتابة يدويًا.</p><label><input id="secureVoicePrivacyAck" type="checkbox" onchange="refreshVoiceActions()"><span>أقر بأنني لن أذكر أي بيانات شخصية أو سرية أثناء الإملاء الصوتي.</span></label></section><main class="secure-voice-workspace"><div class="secure-voice-buttons"><button id="secureVoiceStart" onclick="startSpeechRecognition()" disabled>🎙️ بدء الإملاء</button><button onclick="stopSpeechRecognition()">⏹️ إيقاف الإملاء</button><button id="secureLocalRecord" onclick="toggleLocalAudioRecording()" disabled>🔴 تسجيل صوتي محلي للمراجعة</button></div><p class="secure-voice-note">التسجيل المحلي لا يُرسل ولا يُحلل آليًا، ومتاح فقط لمساعدتك في المراجعة قبل الكتابة. الإملاء الصوتي قد لا يعمل في بعض المتصفحات.</p><textarea id="secureVoiceText" rows="12" placeholder="سيظهر النص المملى هنا..." oninput="intake.voiceText=this.value"></textarea><div id="secureLocalAudioBox"></div></main><footer><div><small>راجع النص واحذف أي بيانات حساسة قبل إدخاله إلى الواقعة.</small></div><div><button onclick="closeSandSecureIntake()">إلغاء</button><button class="primary" onclick="insertVoiceTextIntoCase()">إضافة النص إلى الواقعة</button></div></footer></section></div>`;
  }

  function openSandSecureIntake(type){
    removeModal();
    const holder=document.createElement("div");holder.innerHTML=type==="voice"?voiceModal():documentModal();document.body.appendChild(holder.firstElementChild);
    if(type!=="voice")setupSecureCanvas();
  }
  window.openSandSecureIntake=openSandSecureIntake;

  function refreshSecureIntakeActions(){
    const ack=document.getElementById("secureIntakePrivacyAck")?.checked;
    const insert=document.getElementById("secureInsertTextBtn");if(insert)insert.disabled=!(ack&&intake.extractedText.trim());
  }
  window.refreshSecureIntakeActions=refreshSecureIntakeActions;
  function refreshVoiceActions(){
    const ack=document.getElementById("secureVoicePrivacyAck")?.checked;
    const start=document.getElementById("secureVoiceStart");if(start)start.disabled=!ack;
    const local=document.getElementById("secureLocalRecord");if(local)local.disabled=!ack;
  }
  window.refreshVoiceActions=refreshVoiceActions;

  function setupSecureCanvas(){
    intake.canvas=document.getElementById("securePreviewCanvas");if(!intake.canvas)return;intake.ctx=intake.canvas.getContext("2d");
    const point=e=>{const r=intake.canvas.getBoundingClientRect();return {x:(e.clientX-r.left)*(intake.canvas.width/r.width),y:(e.clientY-r.top)*(intake.canvas.height/r.height)};};
    intake.canvas.addEventListener("pointerdown",e=>{if(!intake.baseImage)return;intake.drawing=true;const p=point(e);intake.startX=p.x;intake.startY=p.y;intake.canvas.setPointerCapture(e.pointerId);});
    intake.canvas.addEventListener("pointermove",e=>{if(!intake.drawing)return;const p=point(e);renderSecureCanvas({x:intake.startX,y:intake.startY,w:p.x-intake.startX,h:p.y-intake.startY});});
    intake.canvas.addEventListener("pointerup",e=>{if(!intake.drawing)return;intake.drawing=false;const p=point(e);const rect={x:intake.startX,y:intake.startY,w:p.x-intake.startX,h:p.y-intake.startY};if(Math.abs(rect.w)>5&&Math.abs(rect.h)>5)intake.redactions.push(rect);renderSecureCanvas();});
  }

  function updateFileMeta(extra=""){
    const meta=document.getElementById("secureFileMeta");if(!meta)return;
    meta.innerHTML=intake.file?`<b>${escHtml(intake.originalName)}</b><span>${escHtml(intake.fileType)} — ${(intake.file.size/1024/1024).toFixed(2)} MB</span>${extra?`<small>${escHtml(extra)}</small>`:""}`:"لم يتم اختيار ملف بعد.";
  }

  async function handleSecureCaseFile(file){
    if(!file)return;if(file.size>MAX_FILE_MB*1024*1024)return toast(`حجم الملف أكبر من ${MAX_FILE_MB} ميجابايت.`);
    if(!["image/png","image/jpeg","image/webp","application/pdf"].includes(file.type))return toast("نوع الملف غير مسموح. استخدم صورة PNG أو JPG أو WEBP أو ملف PDF.");
    intake.file=file;intake.fileType=file.type;intake.originalName=file.name;intake.redactions=[];intake.extractedText="";
    const txt=document.getElementById("secureExtractedText");if(txt)txt.value="";updateFileMeta();
    if(file.type==="application/pdf")await preparePdf(file); else await prepareImage(file);
    refreshSecureIntakeActions();
  }
  window.handleSecureCaseFile=handleSecureCaseFile;

  async function prepareImage(file){
    const url=URL.createObjectURL(file);const img=new Image();img.onload=()=>{intake.baseImage=img;intake.canvas.width=img.naturalWidth;intake.canvas.height=img.naturalHeight;document.getElementById("securePreviewEmpty").style.display="none";renderSecureCanvas();URL.revokeObjectURL(url);};img.onerror=()=>toast("تعذر قراءة الصورة.");img.src=url;
    const nav=document.getElementById("securePdfNav");if(nav)nav.innerHTML="";
  }

  async function preparePdf(file){
    try{
      updateFileMeta("جارٍ قراءة PDF داخل المتصفح...");const pdfjs=await loadPdfJs();const bytes=new Uint8Array(await file.arrayBuffer());intake.pdfDoc=await pdfjs.getDocument({data:bytes}).promise;intake.pdfTotalPages=intake.pdfDoc.numPages;intake.pdfPage=1;
      updateFileMeta(`PDF يحتوي على ${intake.pdfTotalPages} صفحة. تتم المعالجة محليًا.`);await renderPdfPage(1);renderPdfNavigation();
    }catch(err){console.error(err);toast(err.message||"تعذر قراءة ملف PDF.");}
  }
  async function renderPdfPage(pageNo){
    if(!intake.pdfDoc)return;const page=await intake.pdfDoc.getPage(pageNo);const viewport=page.getViewport({scale:1.45});intake.canvas.width=viewport.width;intake.canvas.height=viewport.height;intake.ctx.clearRect(0,0,intake.canvas.width,intake.canvas.height);await page.render({canvasContext:intake.ctx,viewport}).promise;
    const image=new Image();image.onload=()=>{intake.baseImage=image;intake.redactions=[];document.getElementById("securePreviewEmpty").style.display="none";renderSecureCanvas();};image.src=intake.canvas.toDataURL("image/png");
  }
  function renderPdfNavigation(){const nav=document.getElementById("securePdfNav");if(!nav||!intake.pdfDoc)return;nav.innerHTML=`<button onclick="changeSecurePdfPage(-1)" ${intake.pdfPage<=1?"disabled":""}>السابق</button><span>صفحة ${intake.pdfPage} من ${intake.pdfTotalPages}</span><button onclick="changeSecurePdfPage(1)" ${intake.pdfPage>=intake.pdfTotalPages?"disabled":""}>التالي</button>`;}
  async function changeSecurePdfPage(delta){const next=intake.pdfPage+delta;if(next<1||next>intake.pdfTotalPages)return;intake.pdfPage=next;await renderPdfPage(next);renderPdfNavigation();}
  window.changeSecurePdfPage=changeSecurePdfPage;

  function renderSecureCanvas(tempRect=null){if(!intake.ctx||!intake.baseImage)return;intake.ctx.clearRect(0,0,intake.canvas.width,intake.canvas.height);intake.ctx.drawImage(intake.baseImage,0,0,intake.canvas.width,intake.canvas.height);const rects=tempRect?[...intake.redactions,tempRect]:intake.redactions;intake.ctx.fillStyle="#000";rects.forEach(r=>intake.ctx.fillRect(r.x,r.y,r.w,r.h));}
  function setSecureIntakeMode(){toast("اسحب بإصبعك أو بالماوس فوق أي بيانات حساسة داخل المعاينة لتغطيتها باللون الأسود.");}
  function undoSecureRedaction(){intake.redactions.pop();renderSecureCanvas();}
  function clearSecureRedactions(){intake.redactions=[];renderSecureCanvas();}
  window.setSecureIntakeMode=setSecureIntakeMode;window.undoSecureRedaction=undoSecureRedaction;window.clearSecureRedactions=clearSecureRedactions;

  async function extractSecureCaseText(){
    if(!intake.file)return toast("اختر ملفًا الأول.");if(intake.busy)return;intake.busy=true;const btn=document.getElementById("secureExtractBtn");if(btn){btn.disabled=true;btn.textContent="جارٍ استخراج النص...";}
    try{
      let text="";
      if(intake.fileType==="application/pdf"){
        const pageLimit=Math.min(intake.pdfTotalPages,MAX_PDF_PAGES);let parts=[];
        for(let i=1;i<=pageLimit;i++){const page=await intake.pdfDoc.getPage(i);const content=await page.getTextContent();parts.push(content.items.map(x=>x.str).join(" "));}
        text=parts.join("\n\n").trim();
        if(!text){toast("لم يظهر نص مباشر داخل PDF. جرّب استخراج OCR من الصفحة المعروضة كصورة.");text=await runCanvasOcr();}
        else if(intake.pdfTotalPages>MAX_PDF_PAGES) text+=`\n\n[تنبيه: تم استخراج أول ${MAX_PDF_PAGES} صفحة فقط للمراجعة الأولية.]`;
      }else text=await runCanvasOcr();
      intake.extractedText=text;const area=document.getElementById("secureExtractedText");if(area)area.value=text;scanSecureSensitiveData();refreshSecureIntakeActions();
    }catch(err){console.error(err);toast(err.message||"تعذر استخراج النص.");}
    finally{intake.busy=false;if(btn){btn.disabled=false;btn.textContent="🔎 استخراج النص داخل المتصفح";}}
  }
  window.extractSecureCaseText=extractSecureCaseText;

  async function runCanvasOcr(){
    await loadScriptOnce(TESSERACT_URL,"sand-tesseract-js");if(!window.Tesseract)throw new Error("تعذر تشغيل OCR.");
    const result=await window.Tesseract.recognize(intake.canvas,"ara+eng",{logger:m=>{const btn=document.getElementById("secureExtractBtn");if(btn&&m.status)btn.textContent=`OCR: ${m.status} ${m.progress?Math.round(m.progress*100)+"%":""}`;}});
    return result?.data?.text?.trim()||"";
  }

  function intakeTextChanged(value){intake.extractedText=value;refreshSecureIntakeActions();}
  window.intakeTextChanged=intakeTextChanged;

  function detectSensitive(text){
    const checks=[
      ["رقم قومي محتمل",/(?<!\d)\d{14}(?!\d)/g],
      ["رقم هاتف محتمل",/(?<!\d)(?:\+?20|0)?1[0125]\d{8}(?!\d)/g],
      ["بريد إلكتروني",/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g],
      ["رقم قضية محتمل",/(?:قضية|محضر|جنحة|جناية|إداري|حصر)\s*(?:رقم)?\s*[\d٠-٩]+(?:\s*(?:لسنة|\/|-)\s*[\d٠-٩]{2,4})?/gi],
      ["عنوان أو بيانات مكان تفصيلية محتملة",/(?:المقيم|العنوان|محل الإقامة)\s*[:：-]?\s*[^\n،,]{5,80}/gi]
    ];
    return checks.map(([label,re])=>({label,matches:[...text.matchAll(re)].map(m=>m[0]).slice(0,8)})).filter(x=>x.matches.length);
  }
  function scanSecureSensitiveData(){
    const area=document.getElementById("secureExtractedText");const text=(area?.value||intake.extractedText||"").trim();intake.extractedText=text;const report=document.getElementById("secureSensitiveReport");if(!report)return;
    const hits=detectSensitive(text);if(!text){report.innerHTML="";return;}
    if(!hits.length){report.innerHTML=`<div class="safe">✅ لم يكتشف الفحص الآلي أنماطًا واضحة لبيانات حساسة. راجع النص يدويًا رغم ذلك.</div>`;return;}
    report.innerHTML=`<div class="danger"><b>⚠️ راجع النص قبل الإضافة</b><p>اكتشف الفحص الآلي أنماطًا محتملة لبيانات حساسة. احذفها أو استبدلها بأوصاف عامة.</p>${hits.map(x=>`<div><strong>${escHtml(x.label)}</strong><span>${x.matches.map(escHtml).join(" — ")}</span></div>`).join("")}</div>`;
  }
  window.scanSecureSensitiveData=scanSecureSensitiveData;

  function appendToCaseInput(text){const input=document.getElementById("caseAnalysisInput");if(!input)return toast("افتح غرفة تحليل الواقعة الأول.");const clean=text.trim();if(!clean)return toast("لا يوجد نص لإضافته.");input.value=[input.value.trim(),clean].filter(Boolean).join("\n\n");input.focus();input.scrollIntoView({behavior:"smooth",block:"center"});}
  function insertSecureTextIntoCase(){
    if(!document.getElementById("secureIntakePrivacyAck")?.checked)return toast("فعّل إقرار مراجعة الخصوصية الأول.");
    const text=(document.getElementById("secureExtractedText")?.value||"").trim();if(!text)return toast("راجع النص المستخرج الأول.");
    const hits=detectSensitive(text);if(hits.length&&!confirm("الفحص الآلي ما زال يرصد بيانات حساسة محتملة داخل النص. هل راجعتها يدويًا وتريد الإضافة رغم ذلك؟"))return;
    appendToCaseInput(`[نص مستخرج من مستند بعد المراجعة اليدوية]\n${text}`);removeModal();toast("تمت إضافة النص المنقح إلى وصف الواقعة.");
  }
  window.insertSecureTextIntoCase=insertSecureTextIntoCase;

  function getSpeechRecognition(){return window.SpeechRecognition||window.webkitSpeechRecognition||null;}
  function startSpeechRecognition(){
    if(!document.getElementById("secureVoicePrivacyAck")?.checked)return toast("فعّل إقرار الخصوصية الأول.");
    const Recognition=getSpeechRecognition();if(!Recognition)return toast("المتصفح الحالي لا يدعم الإملاء الصوتي. استخدم الكتابة أو جرّب Chrome على الهاتف أو الكمبيوتر.");
    stopSpeechRecognition();const recognition=new Recognition();intake.speech=recognition;recognition.lang="ar-EG";recognition.continuous=true;recognition.interimResults=true;
    let finalText=intake.voiceText||document.getElementById("secureVoiceText")?.value||"";
    recognition.onresult=e=>{let interim="";for(let i=e.resultIndex;i<e.results.length;i++){const part=e.results[i][0].transcript;if(e.results[i].isFinal)finalText+=`${finalText?" ":""}${part}`;else interim+=part;}intake.voiceText=finalText;const area=document.getElementById("secureVoiceText");if(area)area.value=finalText+(interim?`\n[جارٍ الاستماع: ${interim}]`:"");};
    recognition.onerror=e=>toast(`تعذر الإملاء الصوتي: ${e.error||"خطأ غير معروف"}`);recognition.onend=()=>{intake.speechActive=false;const btn=document.getElementById("secureVoiceStart");if(btn)btn.textContent="🎙️ بدء الإملاء";};
    recognition.start();intake.speechActive=true;const btn=document.getElementById("secureVoiceStart");if(btn)btn.textContent="🟢 جاري الاستماع...";
  }
  function stopSpeechRecognition(){if(intake.speech){try{intake.speech.stop();}catch{}intake.speech=null;}intake.speechActive=false;}
  window.startSpeechRecognition=startSpeechRecognition;window.stopSpeechRecognition=stopSpeechRecognition;

  async function toggleLocalAudioRecording(){
    if(intake.localRecording){stopLocalRecording(false);return;}
    if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder)return toast("المتصفح الحالي لا يدعم التسجيل الصوتي المحلي.");
    try{const stream=await navigator.mediaDevices.getUserMedia({audio:true});intake.localChunks=[];const rec=new MediaRecorder(stream);intake.localRecording=rec;rec.ondataavailable=e=>{if(e.data.size)intake.localChunks.push(e.data);};rec.onstop=()=>{stream.getTracks().forEach(t=>t.stop());const blob=new Blob(intake.localChunks,{type:rec.mimeType||"audio/webm"});if(intake.localAudioUrl)URL.revokeObjectURL(intake.localAudioUrl);intake.localAudioUrl=URL.createObjectURL(blob);const box=document.getElementById("secureLocalAudioBox");if(box)box.innerHTML=`<audio controls src="${intake.localAudioUrl}"></audio><small>التسجيل محفوظ مؤقتًا داخل الصفحة فقط، ولا يتم إرساله أو تحليله.</small>`;};rec.start();const btn=document.getElementById("secureLocalRecord");if(btn)btn.textContent="⏹️ إيقاف التسجيل المحلي";}catch(err){toast("لم يتم السماح باستخدام الميكروفون.");}
  }
  function stopLocalRecording(silent=false){if(intake.localRecording){try{intake.localRecording.stop();}catch{}intake.localRecording=null;const btn=document.getElementById("secureLocalRecord");if(btn)btn.textContent="🔴 تسجيل صوتي محلي للمراجعة";if(!silent)toast("تم إيقاف التسجيل المحلي.");}}
  window.toggleLocalAudioRecording=toggleLocalAudioRecording;

  function insertVoiceTextIntoCase(){const text=(document.getElementById("secureVoiceText")?.value||intake.voiceText||"").replace(/\n\[جارٍ الاستماع:[\s\S]*?\]$/," ").trim();if(!text)return toast("لا يوجد نص صوتي لإضافته.");appendToCaseInput(`[وصف الواقعة بالإملاء الصوتي بعد المراجعة]\n${text}`);removeModal();toast("تمت إضافة النص المراجع إلى وصف الواقعة.");}
  window.insertVoiceTextIntoCase=insertVoiceTextIntoCase;
})();
