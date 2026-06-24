/* Startup sequence */
window.addEventListener("load", function(){
  const splash=document.getElementById("appSplashScreen");
  if(!splash)return;
  setTimeout(()=>splash.classList.add("splash-hidden"),7000);
  setTimeout(()=>splash.remove(),7800);
});
document.addEventListener("DOMContentLoaded",goHome);
