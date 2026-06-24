/* Phase 2: local personal workspace tools (favorites, collections, recent articles, comparison, focus mode) */
(function(){
  const STORAGE = {
    favorites: "judicial_favorite_articles_v1",
    collections: "judicial_article_collections_v1",
    recent: "judicial_recent_articles_v1",
    compare: "judicial_compare_articles_v1"
  };
  const DEFAULT_COLLECTION = "general";

  function safeParse(key, fallback){
    try { const value = JSON.parse(localStorage.getItem(key)); return value ?? fallback; }
    catch { return fallback; }
  }
  function write(key, value){ localStorage.setItem(key, JSON.stringify(value)); }
  function unique(list){ return [...new Set((list || []).filter(Boolean))]; }
  function allArticles(){ return typeof allAppData === "function" ? allAppData() : []; }
  function getArticle(id){ return allArticles().find(article => article.id === id) || null; }

  function getCollections(){
    const current = safeParse(STORAGE.collections, []);
    const normalized = Array.isArray(current) ? current.filter(item => item && item.id && item.name) : [];
    if(!normalized.some(item => item.id === DEFAULT_COLLECTION)) normalized.unshift({ id: DEFAULT_COLLECTION, name: "المفضلة العامة", createdAt: new Date().toISOString() });
    write(STORAGE.collections, normalized);
    return normalized;
  }
  function createCollection(name){
    const cleaned = String(name || "").trim(); if(!cleaned) return null;
    const collections = getCollections();
    const existing = collections.find(item => item.name === cleaned); if(existing) return existing;
    const item = { id: `collection-${Date.now()}`, name: cleaned, createdAt: new Date().toISOString() };
    collections.push(item); write(STORAGE.collections, collections); return item;
  }
  function renameCollection(id, name){
    const cleaned=String(name||"").trim(); if(!cleaned || id===DEFAULT_COLLECTION) return false;
    const collections=getCollections(); const item=collections.find(c=>c.id===id); if(!item)return false;
    item.name=cleaned; write(STORAGE.collections,collections); return true;
  }
  function deleteCollection(id){
    if(!id || id===DEFAULT_COLLECTION) return false;
    write(STORAGE.collections,getCollections().filter(item=>item.id!==id));
    const favorites=getFavoriteRecords().map(item=>item.collectionId===id?{...item,collectionId:DEFAULT_COLLECTION}:item);
    write(STORAGE.favorites,favorites); return true;
  }
  function getFavoriteRecords(){
    const value=safeParse(STORAGE.favorites,[]); return Array.isArray(value)?value.filter(item=>item&&item.articleId):[];
  }
  function isFavorite(id){ return getFavoriteRecords().some(item=>item.articleId===id); }
  function addFavorite(id, collectionId=DEFAULT_COLLECTION){
    if(!getArticle(id)) return false;
    const list=getFavoriteRecords(); const found=list.find(item=>item.articleId===id);
    if(found){ found.collectionId=collectionId||DEFAULT_COLLECTION; found.updatedAt=new Date().toISOString(); }
    else list.unshift({articleId:id,collectionId:collectionId||DEFAULT_COLLECTION,createdAt:new Date().toISOString()});
    write(STORAGE.favorites,list); return true;
  }
  function removeFavorite(id){ write(STORAGE.favorites,getFavoriteRecords().filter(item=>item.articleId!==id)); return true; }
  function toggleFavorite(id, collectionId=DEFAULT_COLLECTION){ if(isFavorite(id)){removeFavorite(id);return false;} addFavorite(id,collectionId);return true; }
  function getFavorites(collectionId="all"){
    return getFavoriteRecords().filter(item=>collectionId==="all"||item.collectionId===collectionId).map(item=>({...item,article:getArticle(item.articleId)})).filter(item=>item.article);
  }

  function rememberRecentArticle(id){
    if(!getArticle(id)) return;
    const list=safeParse(STORAGE.recent,[]); const current=Array.isArray(list)?list.filter(item=>item&&item.articleId!==id):[];
    current.unshift({articleId:id,openedAt:new Date().toISOString()}); write(STORAGE.recent,current.slice(0,24));
  }
  function getRecentArticles(limit=12){
    const list=safeParse(STORAGE.recent,[]); return (Array.isArray(list)?list:[]).slice(0,limit).map(item=>({...item,article:getArticle(item.articleId)})).filter(item=>item.article);
  }
  function clearRecentArticles(){ write(STORAGE.recent,[]); }

  function getCompareIds(){ const value=safeParse(STORAGE.compare,[]); return unique(Array.isArray(value)?value:[]).slice(0,2); }
  function getCompareArticles(){ return getCompareIds().map(getArticle).filter(Boolean); }
  function isCompared(id){ return getCompareIds().includes(id); }
  function addToCompare(id){
    if(!getArticle(id)) return {ok:false,message:"تعذر العثور على المادة."};
    let list=getCompareIds(); if(list.includes(id)) return {ok:true,message:"المادة موجودة بالفعل في المقارنة."};
    if(list.length>=2) return {ok:false,message:"المقارنة تستوعب مادتين فقط. احذف مادة قبل إضافة مادة أخرى."};
    list.push(id); write(STORAGE.compare,list); return {ok:true,message:list.length===2?"تم اختيار المادتين. المقارنة جاهزة للعرض.":"تمت إضافة المادة. اختر مادة ثانية لإكمال المقارنة."};
  }
  function removeFromCompare(id){ write(STORAGE.compare,getCompareIds().filter(item=>item!==id)); }
  function clearCompare(){ write(STORAGE.compare,[]); }

  window.JudicialWorkspace={
    getCollections,createCollection,renameCollection,deleteCollection,
    getFavoriteRecords,getFavorites,isFavorite,addFavorite,removeFavorite,toggleFavorite,
    rememberRecentArticle,getRecentArticles,clearRecentArticles,
    getCompareIds,getCompareArticles,isCompared,addToCompare,removeFromCompare,clearCompare
  };
})();
