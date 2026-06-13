/**
 * 🎙️ سَنَد — الحوار الصوتي المباشر الاحترافي (المرحلة 4.2.1)
 *
 * - يحصل المتصفح على Ephemeral Token قصير العمر من Cloudflare Worker.
 * - يتصل مباشرة بـ Gemini Live API عبر WebSocket لتقليل التأخير.
 * - يرسل صوت الميكروفون PCM 16-bit / 16kHz ويشغّل رد سَنَد PCM / 24kHz.
 * - يعرض تفريغ كلام المستخدم ورد سَنَد لحظيًا للمراجعة قبل إضافته إلى الواقعة.
 * - لا يضع GEMINI_API_KEY داخل GitHub أو المتصفح.
 */
(function(){
  const LIVE_MODEL = "gemini-3.1-flash-live-preview";
  const TOKEN_PATH = "/live-token";
  const INPUT_RATE = 16000;
  const OUTPUT_RATE = 24000;
  const MAX_SESSION_MINUTES = 12;
  const SETUP_TIMEOUT_MS = 15000;

  const live = {
    ws:null,
    connected:false,
    setupReady:false,
    connecting:false,
    muted:false,
    stream:null,
    inputContext:null,
    inputSource:null,
    processor:null,
    silentGain:null,
    outputContext:null,
    nextPlaybackTime:0,
    playbackSources:new Set(),
    transcriptUser:"",
    transcriptSand:"",
    eventLines:[],
    startedAt:null,
    timer:null,
    selectedVoice:"Charon",
    mode:"audio",
    audioStreamOpen:false,
    contextMode:"facts",
    setupTimer:null,
    closeReason:""
  };

  function esc(value){return String(value??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));}
  function toast(message){if(typeof judicialToast==="function")judicialToast(message);else alert(message);}
  function proxyBase(){return String(window.AI_PROXY_URL||typeof AI_PROXY_URL!=="undefined"&&AI_PROXY_URL||"").replace(/\/$/,"");}
  function modal(){return document.getElementById("sandLiveVoiceModal");}
  function byId(id){return document.getElementById(id);}
  function nowTime(){return new Date().toLocaleTimeString("ar-EG",{hour:"2-digit",minute:"2-digit"});}

  function setStatus(text,type="idle"){
    const status=byId("sandLiveStatus");
    if(status){status.className=`sand-live-status ${type}`;status.innerHTML=`<i></i><span>${esc(text)}</span>`;}
    const shell=byId("sandLiveAvatarShell");if(shell)shell.dataset.state=type;
  }
  function addEvent(text){
    const line=`${nowTime()} — ${text}`;
    live.eventLines.push(line);
    live.eventLines=live.eventLines.slice(-12);
    console.debug("[SAND LIVE]",line);
  }
  function updateTranscript(){
    const user=byId("sandLiveUserTranscript");if(user)user.value=live.transcriptUser.trim();
    const sand=byId("sandLiveSandTranscript");if(sand)sand.value=live.transcriptSand.trim();
  }
  function appendTranscript(target,text){
    const clean=String(text||"").replace(/\s+/g," ").trim();if(!clean)return;
    if(target==="user")live.transcriptUser=(live.transcriptUser+" "+clean).trim();
    else live.transcriptSand=(live.transcriptSand+" "+clean).trim();
    updateTranscript();
  }

  function liveModalMarkup(){return `<div class="sand-live-backdrop" id="sandLiveVoiceModal">
    <section class="sand-live-dialog" role="dialog" aria-modal="true" aria-label="الحوار الصوتي المباشر مع سند">
      <header class="sand-live-head">
        <div><span>جلسة صوتية مباشرة</span><h2>🎙️ حوار صوتي مباشر مع سَنَد</h2><p>احكي الواقعة بصورة طبيعية، وسَنَد هيسمعك ويسأل عن النقط المؤثرة بهدوء. بعد انتهاء الحوار راجع الملخص قبل إضافته لغرفة التحليل.</p></div>
        <button class="sand-live-close" onclick="closeSandLiveVoiceSession()">✕</button>
      </header>
      <div class="sand-live-privacy">🔒 يرجى عدم ذكر أسماء الأشخاص أو أرقام القضايا أو أي بيانات شخصية أو سرية. استخدم أوصافًا عامة مثل: المتهم الأول، المجني عليه، الشاهد، محل الواقعة.</div>
      <div class="sand-live-grid">
        <aside class="sand-live-avatar-side">
          <div class="sand-live-avatar-shell" id="sandLiveAvatarShell" data-state="idle">
            <div class="sand-live-orbit orbit-a"></div><div class="sand-live-orbit orbit-b"></div><div class="sand-live-ground"></div>
            <img src="./assets/images/avatar-3d.png" alt="سند" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'">
            <div class="sand-live-avatar-fallback">⚖️</div>
          </div>
          <div class="sand-live-status idle" id="sandLiveStatus"><i></i><span>جاهز لبدء الحوار</span></div>
          <div class="sand-live-wave" aria-hidden="true"><b></b><b></b><b></b><b></b><b></b><b></b><b></b></div>
          <div class="sand-live-clock" id="sandLiveClock">00:00</div>
        </aside>
        <main class="sand-live-main">
          <div class="sand-live-toolbar">
            <label><span>صوت سَنَد — تلقائي مؤقتًا</span><select id="sandLiveVoice" disabled title="سيتم إعادة تفعيل اختيار الصوت بعد اختبار ثبات الاتصال"><option>الصوت الافتراضي</option></select></label>
            <button class="primary" id="sandLiveConnectBtn" onclick="startSandLiveVoiceSession()">🎙️ بدء الحوار المباشر</button>
            <button id="sandLiveMuteBtn" onclick="toggleSandLiveMute()" disabled>🔇 كتم الميكروفون</button>
            <button onclick="finishSandLiveTurn()" id="sandLiveFinishTurnBtn" disabled>✓ إنهاء دوري الحالي</button>
            <button class="danger" onclick="stopSandLiveVoiceSession()" id="sandLiveStopBtn" disabled>⏹ إنهاء الجلسة</button>
          </div>
          <div class="sand-live-note">اتكلم بصورة طبيعية، وسيظهر النص المستخلص للمراجعة أثناء الحوار. لو الاتصال اتأخر، هتظهر لك رسالة واضحة وتقدر تستخدم المسار الاحتياطي فورًا.</div>
          <div class="sand-live-transcripts">
            <label><span>📝 كلام عضو النيابة — قابل للمراجعة والتعديل</span><textarea id="sandLiveUserTranscript" rows="8" oninput="updateSandLiveTranscript('user',this.value)" placeholder="هيظهر هنا النص المستخلص من كلامك أثناء الحوار..."></textarea></label>
            <label><span>🤖 ردود سَنَد النصية المصاحبة للصوت</span><textarea id="sandLiveSandTranscript" rows="8" oninput="updateSandLiveTranscript('sand',this.value)" placeholder="هيظهر هنا نص ردود سَنَد..."></textarea></label>
          </div>
          <footer class="sand-live-actions">
            <button onclick="insertSandLiveTranscriptIntoCase()">➕ إضافة وصف الواقعة بعد المراجعة</button>
            <button onclick="copySandLiveTranscript()">📋 نسخ الحوار</button>
            <button onclick="openSandSecureIntake('voice')">🛟 المسار الاحتياطي: تسجيل ثم مراجعة</button>
          </footer>
        </main>
      </div>
    </section>
  </div>`;}

  function openSandLiveVoiceSession(mode="facts"){
    if(modal())return;
    live.contextMode=mode==="result"?"result":"facts";
    document.body.insertAdjacentHTML("beforeend",liveModalMarkup());
    updateTranscript();
  }
  window.openSandLiveVoiceSession=openSandLiveVoiceSession;

  async function closeSandLiveVoiceSession(){await stopSandLiveVoiceSession(true);modal()?.remove();}
  window.closeSandLiveVoiceSession=closeSandLiveVoiceSession;

  function setSandLiveVoice(value){if(!live.connected)live.selectedVoice=String(value||"Charon");else toast("اختيار الصوت يتطبق عند بدء جلسة جديدة.");}
  window.setSandLiveVoice=setSandLiveVoice;

  async function requestEphemeralToken(){
    const base=proxyBase();if(!base)throw new Error("رابط Cloudflare Worker غير مضبوط داخل ai-brain.js.");
    const response=await fetch(`${base}${TOKEN_PATH}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({purpose:"sand-live-voice"})});
    const data=await response.json().catch(()=>({}));
    if(!response.ok||!data.ok||!data.token)throw new Error(data.error||"تعذر إصدار رمز الجلسة الصوتية المؤقت.");
    return data;
  }

  function systemInstruction(){return `أنت سَنَد، مساعد قضائي صوتي ذكي مخصص لمعاونة أعضاء النيابة العامة في غرفة تحليل الواقعة.
اتكلم بالمصري العامي المحترم وبنبرة هادئة ورصينة وودودة. اسأل أسئلة قصيرة ومحددة، سؤالًا أو سؤالين في كل مرة، ولا تقاطع المستخدم بلا داعٍ.
الهدف في الحوار الصوتي هو جمع الوقائع وتحديد النقاط الغامضة فقط، وليس إصدار تكييف نهائي أو قرار قضائي ملزم.
لا تفترض وقائع غير مذكورة. لو المعلومة ناقصة اسأل عنها. لا تذكر أسماء مواد أو مدد أو أحكام إلا لو متأكد منها من السياق الذي يقدمه التطبيق لاحقًا.
اطلب من المستخدم في الوقت المناسب مراجعة الملخص النصي واعتماده قبل بدء التحليل القانوني المنظم.
لا تطلب ولا تكرر أي بيانات شخصية أو سرية. استخدم أوصافًا عامة: المتهم الأول، المجني عليه، الشاهد، محل الواقعة.
خلي ردودك الصوتية مختصرة ومريحة، وابتعد عن المقدمات الطويلة.`;}

  function clearSetupTimer(){
    if(live.setupTimer){clearTimeout(live.setupTimer);live.setupTimer=null;}
  }

  function startSetupTimer(){
    clearSetupTimer();
    live.setupTimer=setTimeout(()=>{
      if(live.setupReady)return;
      addEvent("انتهت مهلة انتظار تهيئة الجلسة دون وصول setupComplete.");
      try{live.ws?.close(4000,"setup-timeout");}catch{}
      cleanupLive(false);
      setStatus("تعذر تجهيز الحوار الصوتي","error");
      toast("اتصال الحوار الصوتي اتأخر عن المعتاد. جرّب مرة تانية، ولو استمر استخدم المسار الاحتياطي مؤقتًا.");
    },SETUP_TIMEOUT_MS);
  }

  async function startSandLiveVoiceSession(){
    if(live.connecting||live.connected)return;
    try{
      live.connecting=true;setStatus("بجهّز الحوار الصوتي...","thinking");addEvent("بدأ تجهيز جلسة صوتية جديدة.");toggleControls(true);
      const token=await requestEphemeralToken();
      const wsUrl=`wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContentConstrained?access_token=${encodeURIComponent(token.token)}`;
      live.ws=new WebSocket(wsUrl);
      // ArrayBuffer يقلل اختلافات المتصفحات في استقبال الرسائل الثنائية.
      live.ws.binaryType="arraybuffer";
      live.ws.onopen=()=>{
        addEvent("تم فتح الاتصال الصوتي. جاري تهيئة الجلسة.");
        startSetupTimer();
        // أول رسالة بعد فتح WebSocket يجب أن تكون إعداد جلسة بسيطًا ومتوافقًا
        // مع مسار الرموز المؤقتة. نبدأ بالحد الأدنى المستقر، ثم نضيف
        // تخصيص الصوت لاحقًا بعد التأكد من نجاح التهيئة الأساسية.
        const setupMessage={
          setup:{
            model:`models/${token.model||LIVE_MODEL}`,
            generationConfig:{
              responseModalities:["AUDIO"]
            },
            systemInstruction:{parts:[{text:systemInstruction()}]},
            inputAudioTranscription:{},
            outputAudioTranscription:{}
          }
        };
        live.ws.send(JSON.stringify(setupMessage));
      };
      live.ws.onmessage=event=>handleServerMessage(event.data);
      live.ws.onerror=event=>{
        console.error("[SAND LIVE] WebSocket error",event);
        addEvent("حدث خطأ أثناء فتح الاتصال الصوتي.");
      };
      live.ws.onclose=event=>{
        clearSetupTimer();
        live.closeReason=String(event.reason||"");
        console.warn("[SAND LIVE] WebSocket closed",{code:event.code,reason:event.reason,wasClean:event.wasClean});
        addEvent(`انتهى الاتصال الصوتي. code=${event.code||""}`);
        const wasReady=live.setupReady;
        cleanupLive(false);
        if(!wasReady){
          setStatus("تعذر تجهيز الحوار الصوتي","error");
          toast("تعذر استكمال تهيئة الحوار الصوتي. جرّب مرة تانية، ولو استمر استخدم المسار الاحتياطي مؤقتًا.");
        }else{
          setStatus("انتهت الجلسة الصوتية","idle");
        }
      };
    }catch(error){console.error(error);setStatus("تعذر بدء الجلسة","error");toast(error.message||"تعذر بدء الحوار الصوتي.");cleanupLive(false);}
    finally{live.connecting=false;}
  }
  window.startSandLiveVoiceSession=startSandLiveVoiceSession;

  async function handleServerMessage(raw){
    // رسائل WebSocket قد تصل كنص أو Blob أو ArrayBuffer حسب المتصفح.
    // تجاهل Blob كان يمنع التقاط setupComplete رغم نجاح الاتصال.
    let rawText;
    try{
      if(raw instanceof Blob) rawText=await raw.text();
      else if(raw instanceof ArrayBuffer) rawText=new TextDecoder().decode(raw);
      else rawText=String(raw??"");
    }catch(error){
      console.error("[SAND LIVE] Failed to decode server message",error);
      return;
    }
    let data;
    try{data=JSON.parse(rawText);}
    catch(error){
      console.warn("[SAND LIVE] Ignored non-JSON server message",rawText,error);
      return;
    }
    console.debug("[SAND LIVE] Server message",Object.keys(data));
    if(data.error){
      console.error("[SAND LIVE] Server error",data.error);
      addEvent("ورد خطأ من خدمة الحوار الصوتي.");
      clearSetupTimer();
      try{live.ws?.close(4001,"server-error");}catch{}
      cleanupLive(false);
      setStatus("تعذر تجهيز الحوار الصوتي","error");
      toast("تعذر تجهيز جلسة الحوار الصوتي حاليًا. جرّب مرة تانية أو استخدم المسار الاحتياطي.");
      return;
    }
    if(data.setupComplete){
      clearSetupTimer();
      live.setupReady=true;live.connected=true;live.startedAt=Date.now();
      startClock();toggleControls(false);
      setStatus("سَنَد مستعد وبيسمعك...","listening");
      addEvent("اكتمل إعداد الجلسة وبدأ التقاط الميكروفون.");
      await startMicrophone();
      if(live.contextMode==="result"&&typeof window.getCaseAnalysisVoiceContext==="function"){
        const ctx=window.getCaseAnalysisVoiceContext();
        if(ctx)live.ws.send(JSON.stringify({realtimeInput:{text:`لدينا نتيجة تحليل سابقة للمناقشة الصوتية. تعامل معها كمذكرة مراجعة داخلية قابلة للتحديث، وابدأ بسؤال المستخدم عن النقطة التي يريد مناقشتها.\n\n${ctx}`}}));
      }
      return;
    }
    if(data.goAway){addEvent("الخادم نبّه بقرب انتهاء الاتصال. أنهِ الجولة أو ابدأ جلسة متابعة.");toast("الجلسة الصوتية قربت تنتهي. راجع النص واحفظه أو ابدأ جلسة متابعة.");}
    if(data.sessionResumptionUpdate?.newHandle)live.resumeHandle=data.sessionResumptionUpdate.newHandle;
    const content=data.serverContent;
    if(!content)return;
    if(content.interrupted){stopPlayback();setStatus("سَنَد وقف الرد وبيسمعك...","listening");addEvent("تمت مقاطعة رد سَنَد طبيعيًا عند بدء كلامك.");}
    if(content.inputTranscription?.text){appendTranscript("user",content.inputTranscription.text);setStatus("سَنَد بيسمعك...","listening");}
    if(content.outputTranscription?.text){appendTranscript("sand",content.outputTranscription.text);setStatus("سَنَد بيرد عليك...","speaking");}
    const parts=content.modelTurn?.parts||[];
    for(const part of parts){
      if(part.text)appendTranscript("sand",part.text);
      const inline=part.inlineData||part.inline_data;
      if(inline?.data&&String(inline.mimeType||inline.mime_type||"").includes("audio"))playPcmChunk(inline.data,parseRate(inline.mimeType||inline.mime_type)||OUTPUT_RATE);
    }
    if(content.turnComplete){setStatus("سَنَد مستعد يسمعك...","listening");}
  }

  async function startMicrophone(){
    if(live.stream)return;
    if(!navigator.mediaDevices?.getUserMedia)throw new Error("المتصفح لا يدعم الوصول إلى الميكروفون.");
    live.stream=await navigator.mediaDevices.getUserMedia({audio:{channelCount:1,echoCancellation:true,noiseSuppression:true,autoGainControl:true}});
    const Context=window.AudioContext||window.webkitAudioContext;if(!Context)throw new Error("المتصفح لا يدعم Web Audio API.");
    live.inputContext=new Context();await live.inputContext.resume();
    live.inputSource=live.inputContext.createMediaStreamSource(live.stream);
    live.processor=live.inputContext.createScriptProcessor(4096,1,1);
    live.silentGain=live.inputContext.createGain();live.silentGain.gain.value=0;
    live.processor.onaudioprocess=e=>{
      if(!live.connected||live.muted||!live.ws||live.ws.readyState!==WebSocket.OPEN)return;
      const input=e.inputBuffer.getChannelData(0);const down=resample(input,live.inputContext.sampleRate,INPUT_RATE);const pcm=floatTo16BitPCM(down);const base64=arrayBufferToBase64(pcm.buffer);
      live.ws.send(JSON.stringify({realtimeInput:{audio:{mimeType:`audio/pcm;rate=${INPUT_RATE}`,data:base64}}}));live.audioStreamOpen=true;
    };
    live.inputSource.connect(live.processor);live.processor.connect(live.silentGain);live.silentGain.connect(live.inputContext.destination);
  }

  function resample(input,fromRate,toRate){
    if(fromRate===toRate)return input;
    const ratio=fromRate/toRate;const len=Math.max(1,Math.round(input.length/ratio));const out=new Float32Array(len);
    for(let i=0;i<len;i++){const start=Math.floor(i*ratio);const end=Math.min(input.length,Math.floor((i+1)*ratio));let sum=0,count=0;for(let j=start;j<end;j++){sum+=input[j];count++;}out[i]=count?sum/count:input[start]||0;}
    return out;
  }
  function floatTo16BitPCM(input){const out=new Int16Array(input.length);for(let i=0;i<input.length;i++){const s=Math.max(-1,Math.min(1,input[i]));out[i]=s<0?s*0x8000:s*0x7fff;}return out;}
  function arrayBufferToBase64(buffer){let binary="";const bytes=new Uint8Array(buffer);const chunk=0x8000;for(let i=0;i<bytes.length;i+=chunk)binary+=String.fromCharCode(...bytes.subarray(i,i+chunk));return btoa(binary);}
  function base64ToInt16(base64){const binary=atob(base64);const bytes=new Uint8Array(binary.length);for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);return new Int16Array(bytes.buffer);}
  function parseRate(mime){const m=String(mime||"").match(/rate=(\d+)/i);return m?Number(m[1]):null;}

  async function playPcmChunk(base64,rate){
    const Context=window.AudioContext||window.webkitAudioContext;if(!Context)return;
    if(!live.outputContext)live.outputContext=new Context({sampleRate:rate});await live.outputContext.resume();
    const pcm=base64ToInt16(base64);const floats=new Float32Array(pcm.length);for(let i=0;i<pcm.length;i++)floats[i]=pcm[i]/32768;
    const buffer=live.outputContext.createBuffer(1,floats.length,rate);buffer.copyToChannel(floats,0);const source=live.outputContext.createBufferSource();source.buffer=buffer;source.connect(live.outputContext.destination);
    const now=live.outputContext.currentTime;live.nextPlaybackTime=Math.max(live.nextPlaybackTime||now,now);source.start(live.nextPlaybackTime);live.nextPlaybackTime+=buffer.duration;live.playbackSources.add(source);source.onended=()=>live.playbackSources.delete(source);
  }
  function stopPlayback(){for(const source of live.playbackSources){try{source.stop();}catch{}}live.playbackSources.clear();if(live.outputContext)live.nextPlaybackTime=live.outputContext.currentTime;}

  function toggleSandLiveMute(){live.muted=!live.muted;const btn=byId("sandLiveMuteBtn");if(btn)btn.textContent=live.muted?"🎙️ فتح الميكروفون":"🔇 كتم الميكروفون";setStatus(live.muted?"الميكروفون مكتوم":"سَنَد مستعد يسمعك...",live.muted?"paused":"listening");}
  window.toggleSandLiveMute=toggleSandLiveMute;

  function finishSandLiveTurn(){if(live.ws?.readyState===WebSocket.OPEN){live.ws.send(JSON.stringify({realtimeInput:{audioStreamEnd:true}}));live.audioStreamOpen=false;addEvent("تم إنهاء جولة الكلام الحالية وإرسالها لسَنَد.");setStatus("سَنَد بيرتب ردّه...","thinking");}}
  window.finishSandLiveTurn=finishSandLiveTurn;

  async function stopSandLiveVoiceSession(silent=false){
    try{if(live.ws?.readyState===WebSocket.OPEN){if(live.audioStreamOpen)live.ws.send(JSON.stringify({realtimeInput:{audioStreamEnd:true}}));live.ws.close(1000,"user-ended");}}catch{}
    cleanupLive(true);if(!silent){setStatus("انتهت الجلسة — راجع النص قبل الإضافة","idle");toast("تم إنهاء الحوار الصوتي. راجع النص قبل إضافته للواقعة.");}
  }
  window.stopSandLiveVoiceSession=stopSandLiveVoiceSession;

  function cleanupLive(closeSocket){
    clearSetupTimer();
    live.connected=false;live.setupReady=false;live.audioStreamOpen=false;live.muted=false;
    if(closeSocket&&live.ws){try{live.ws.close();}catch{}}live.ws=null;
    if(live.processor){try{live.processor.disconnect();}catch{}}live.processor=null;
    if(live.inputSource){try{live.inputSource.disconnect();}catch{}}live.inputSource=null;
    if(live.silentGain){try{live.silentGain.disconnect();}catch{}}live.silentGain=null;
    if(live.stream){live.stream.getTracks().forEach(t=>t.stop());live.stream=null;}
    if(live.inputContext){live.inputContext.close().catch(()=>{});live.inputContext=null;}
    stopPlayback();if(live.outputContext){live.outputContext.close().catch(()=>{});live.outputContext=null;}
    stopClock();toggleControls(false);
  }

  function toggleControls(connecting){
    const connected=live.connected;const connect=byId("sandLiveConnectBtn");if(connect){connect.disabled=connecting||connected;connect.textContent=connecting?"جاري التجهيز...":connected?"🟢 الحوار مباشر":"🎙️ بدء الحوار المباشر";}
    ["sandLiveMuteBtn","sandLiveFinishTurnBtn","sandLiveStopBtn"].forEach(id=>{const el=byId(id);if(el)el.disabled=!connected;});
  }
  function startClock(){stopClock();const clock=byId("sandLiveClock");live.timer=setInterval(()=>{if(!clock||!live.startedAt)return;const secs=Math.floor((Date.now()-live.startedAt)/1000);clock.textContent=`${String(Math.floor(secs/60)).padStart(2,"0")}:${String(secs%60).padStart(2,"0")}`;if(secs===10*60)toast("متبقي حوالي دقيقتين قبل الحد المقترح للجلسة الحالية.");if(secs>=MAX_SESSION_MINUTES*60)stopSandLiveVoiceSession();},1000);}
  function stopClock(){if(live.timer)clearInterval(live.timer);live.timer=null;}

  function updateSandLiveTranscript(type,value){if(type==="user")live.transcriptUser=String(value||"");else live.transcriptSand=String(value||"");}
  window.updateSandLiveTranscript=updateSandLiveTranscript;

  function insertSandLiveTranscriptIntoCase(){
    const text=(byId("sandLiveUserTranscript")?.value||live.transcriptUser||"").trim();if(!text)return toast("لا يوجد نص صوتي لإضافته حتى الآن.");
    const input=document.getElementById("caseAnalysisInput");if(!input)return toast("افتح غرفة تحليل الواقعة الأول.");
    input.value=[input.value.trim(),`[وصف الواقعة من الحوار الصوتي بعد المراجعة]\n${text}`].filter(Boolean).join("\n\n");input.focus();input.scrollIntoView({behavior:"smooth",block:"center"});toast("تمت إضافة النص المراجع إلى وصف الواقعة.");
  }
  window.insertSandLiveTranscriptIntoCase=insertSandLiveTranscriptIntoCase;
  function copySandLiveTranscript(){const text=`كلام عضو النيابة:\n${live.transcriptUser}\n\nردود سَنَد:\n${live.transcriptSand}`;navigator.clipboard?.writeText(text).then(()=>toast("تم نسخ الحوار الصوتي النصي."),()=>toast("تعذر النسخ التلقائي."));}
  window.copySandLiveTranscript=copySandLiveTranscript;
})();
