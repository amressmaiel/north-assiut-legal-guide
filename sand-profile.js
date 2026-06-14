/** sand-profile.js — Phase 5.2 */
(function(){
  const cfg = window.SAND_APP_CONFIG || {};
  const sand = cfg.sand || {};
  window.SAND_PROFILE = {
    name: (cfg.app && cfg.app.assistantName) || "سَنَد",
    defaultAnswerMode: sand.defaultAnswerMode || "executive",
    maxHistoryMessages: Number(sand.maxHistoryMessages || 6),
    defaultVoice: sand.defaultVoice || "Charon",
    defaultInteractionMode: sand.defaultInteractionMode || "ptt",
    safetyNote: sand.safetyNote || "مخرجات سَنَد للمراجعة المهنية وليست قرارًا ملزمًا.",
    style: sand.style || "legal-egyptian-professional"
  };
})();
