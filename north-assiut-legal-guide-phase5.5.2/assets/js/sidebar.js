/* Collapsible sidebar behavior */
function isMobileViewport(){ return window.matchMedia("(max-width: 820px)").matches; }
function setSidebarState(open){
  const sidebar=document.getElementById("appSidebar");
  const overlay=document.getElementById("mobileOverlay");
  if(!sidebar||!overlay)return;
  document.body.classList.toggle("sidebar-expanded",open);
  sidebar.classList.toggle("mobile-open",open);
  overlay.classList.toggle("open",open && isMobileViewport());
  document.body.style.overflow=(open && isMobileViewport())?"hidden":"";
}
function toggleSidebar(force){
  const open=typeof force==="boolean"?force:!document.body.classList.contains("sidebar-expanded");
  setSidebarState(open);
}
function openSidebarFromHover(){ if(!isMobileViewport()) setSidebarState(true); }
function handleSidebarMouseLeave(){ if(!isMobileViewport()) setSidebarState(false); }
function closeSidebar(){ setSidebarState(false); }
function toggleMobileMenu(force){ toggleSidebar(force); }
function closeMobileMenu(){ if(isMobileViewport()) closeSidebar(); }
window.addEventListener("resize",()=>{ if(!isMobileViewport()) document.body.style.overflow=""; });
