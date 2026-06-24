window.NovAvatarEditor = (() => {
  const OUTPUT = 512, THUMB = 96;
  let modal, frame, imageEl, previewEl, range, zoomText, state, resolver;
  function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
  function createModal(){
    if(modal) return;
    modal=document.createElement('div');modal.className='avatar-editor-overlay hidden';modal.id='globalAvatarEditor';
    modal.innerHTML=`<div class="avatar-editor-card">
      <div class="avatar-editor-header"><div><h3>ضبط الصورة الشخصية</h3><p>اسحب الصورة وحدد الجزء المطلوب ثم اضبط التكبير.</p></div><button type="button" class="avatar-editor-close" data-avatar-close>×</button></div>
      <div class="avatar-editor-body"><div class="avatar-editor-stage"><div class="avatar-editor-frame" id="avatarEditorFrame"><img id="avatarEditorImage" draggable="false"><div class="avatar-editor-mask"></div></div></div>
      <div class="avatar-editor-side"><div class="avatar-editor-preview-box"><span>المعاينة النهائية</span><div id="avatarEditorPreview" class="avatar-editor-preview"></div></div>
      <label>درجة التكبير<input id="avatarEditorZoom" type="range" min="1" max="3" step="0.01" value="1"><b id="avatarEditorZoomText">100%</b></label>
      <div class="avatar-editor-help">• اسحب الصورة داخل الإطار.<br>• استخدم شريط التكبير.<br>• يتم حفظ نسخة موحدة ونسخة مصغرة تلقائيًا.</div></div></div>
      <div class="avatar-editor-footer"><button type="button" class="secondary-btn" data-avatar-close>إلغاء</button><button type="button" class="primary-btn" id="avatarEditorApply">اعتماد الصورة</button></div>
    </div>`;
    document.body.appendChild(modal);frame=modal.querySelector('#avatarEditorFrame');imageEl=modal.querySelector('#avatarEditorImage');previewEl=modal.querySelector('#avatarEditorPreview');range=modal.querySelector('#avatarEditorZoom');zoomText=modal.querySelector('#avatarEditorZoomText');
    modal.querySelectorAll('[data-avatar-close]').forEach(x=>x.onclick=()=>finish(null));
    modal.onclick=e=>{if(e.target===modal)finish(null)};
    modal.querySelector('#avatarEditorApply').onclick=()=>finish(exportResult());
    range.oninput=()=>{if(!state)return; const next=Number(range.value); const ratio=next/state.scale; state.offsetX*=ratio;state.offsetY*=ratio;state.scale=next;render();};
    let dragging=false,sx=0,sy=0,ox=0,oy=0;
    frame.onmousedown=e=>{if(!state)return;e.preventDefault();dragging=true;sx=e.clientX;sy=e.clientY;ox=state.offsetX;oy=state.offsetY;frame.classList.add('dragging')};
    window.addEventListener('mousemove',e=>{if(!dragging||!state)return;state.offsetX=ox+(e.clientX-sx);state.offsetY=oy+(e.clientY-sy);render()});
    window.addEventListener('mouseup',()=>{dragging=false;frame?.classList.remove('dragging')});
    frame.ontouchstart=e=>{if(!state||!e.touches?.length)return;dragging=true;sx=e.touches[0].clientX;sy=e.touches[0].clientY;ox=state.offsetX;oy=state.offsetY};
    window.addEventListener('touchmove',e=>{if(!dragging||!state||!e.touches?.length)return;state.offsetX=ox+(e.touches[0].clientX-sx);state.offsetY=oy+(e.touches[0].clientY-sy);render()},{passive:true});
    window.addEventListener('touchend',()=>{dragging=false});
  }
  function frameSize(){return frame?.clientWidth||320}
  function clamp(){if(!state)return;const size=frameSize(),w=state.nw*state.scale,h=state.nh*state.scale;const mx=Math.max(0,(w-size)/2),my=Math.max(0,(h-size)/2);state.offsetX=Math.min(mx,Math.max(-mx,state.offsetX));state.offsetY=Math.min(my,Math.max(-my,state.offsetY));}
  function cropCanvas(size){const fs=frameSize(),c=document.createElement('canvas');c.width=size;c.height=size;const ctx=c.getContext('2d');const crop=fs/state.scale;const sx=Math.max(0,Math.min(state.nw-crop,(state.nw/2)-((fs/2)+state.offsetX)/state.scale));const sy=Math.max(0,Math.min(state.nh-crop,(state.nh/2)-((fs/2)+state.offsetY)/state.scale));ctx.drawImage(state.img,sx,sy,crop,crop,0,0,size,size);return c}
  function render(){if(!state)return;clamp();const w=state.nw*state.scale,h=state.nh*state.scale;imageEl.src=state.src;imageEl.style.width=`${w}px`;imageEl.style.height=`${h}px`;imageEl.style.transform=`translate(calc(-50% + ${state.offsetX}px),calc(-50% + ${state.offsetY}px))`;range.min=String(state.min);range.max=String(state.max);range.value=String(state.scale);zoomText.textContent=`${Math.round((state.scale/state.min)*100)}%`;previewEl.innerHTML=`<img src="${cropCanvas(THUMB).toDataURL('image/png')}" alt="معاينة">`;}
  function exportResult(){return {imageDataUrl:cropCanvas(OUTPUT).toDataURL('image/png'),thumbnailDataUrl:cropCanvas(THUMB).toDataURL('image/png')}}
  function finish(value){modal?.classList.add('hidden');const r=resolver;resolver=null;state=null;if(r)r(value)}
  function fileData(file){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(new Error('تعذر قراءة الصورة'));r.readAsDataURL(file)})}
  async function editFile(file){
    if(!file)return null;if(!/^image\/(png|jpeg|webp)$/i.test(file.type))throw new Error('اختر صورة PNG أو JPG أو WEBP');if(file.size>2*1024*1024)throw new Error('حجم الصورة يجب ألا يتجاوز 2 ميجابايت');
    createModal();const src=await fileData(file);return new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>{const fs=frameSize(),min=Math.max(fs/img.naturalWidth,fs/img.naturalHeight);state={src,img,nw:img.naturalWidth,nh:img.naturalHeight,min,max:Math.max(min*3,min+1),scale:min,offsetX:0,offsetY:0};resolver=resolve;modal.classList.remove('hidden');requestAnimationFrame(render)};img.onerror=()=>reject(new Error('تعذر تحميل الصورة'));img.src=src;});
  }
  return {editFile};
})();
