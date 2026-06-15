/** feature-flags.js — Phase 5.2 */
(function(){
  const cfg = window.SAND_APP_CONFIG || {};
  window.SAND_FEATURE_FLAGS = Object.assign({}, cfg.features || {});
  window.isSandFeatureEnabled = function(name){
    const live = (window.SAND_APP_CONFIG && window.SAND_APP_CONFIG.features) || window.SAND_FEATURE_FLAGS || {};
    return live[name] !== false;
  };
})();
