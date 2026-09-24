/* ── קרקעות תום הרוש · מדידת משפך ─────────────────────────────────────
   חוק ברזל של דיוק דיגיטלי למשפכי שאלון. ארבעה דברים, ולא פחות:
   נטישה לפי שלב, פילוח ממומן מול אורגני, מדידה של אנונימיים ולא רק של
   לידים, וסרטון בשני מספרים ולא באחוז יבש.

   הביקון נשלח כ-text/plain ולא כ-application/json. application/json
   אינו ברשימת ההיתר של CORS, מחייב preflight, וכרום מוחק בקשת preflight
   שנשלחת תוך כדי יציאה מהדף. כך אבדה כל הטלמטריה במשפך של דיוק דיגיטלי
   עד 09/09/2026. אל תחזיר את זה.                                       */
(function(){
  var W = 'https://tom-funnel.tom-harush.workers.dev';
  var SRC_KEY = 'thg_src';

  /* הקישור לדף יושב גם בביו, גם בסטורי, גם בהודעות. בלי הפרדה כל אחוז
     במשפך מערבב תנועה חמה של מודעה עם תנועה קרה לגמרי. */
  function detectSrc(){
    try {
      var q = new URLSearchParams(location.search);
      if(q.get('fbclid') || q.get('utm_campaign') || q.get('utm_source')){
        localStorage.setItem(SRC_KEY, JSON.stringify({ v:'paid', at:Date.now() }));
        return 'paid';
      }
      var s = JSON.parse(localStorage.getItem(SRC_KEY) || 'null');
      if(s && s.v === 'paid' && Date.now() - s.at < 30*86400000) return 'paid';
    } catch(e){}
    return 'org';
  }
  var SRC = detectSrc();
  window.THG_SRC = SRC;

  function fx(stage, extra){
    var b = { stage: stage, src: SRC };
    if(extra) for(var k in extra) b[k] = extra[k];
    var body = JSON.stringify(b);
    try {
      if(navigator.sendBeacon)
        navigator.sendBeacon(W + '/funnel-event', new Blob([body], { type:'text/plain;charset=UTF-8' }));
      else fetch(W + '/funnel-event', { method:'POST', body: body, keepalive:true });
    } catch(e){}
  }
  window.THG_FX = fx;

  /* ── נטישה לפי שלב ────────────────────────────────────────────────
     נרשם השלב הרחוק ביותר בלבד, פעם אחת, ביציאה. בלי זה יודעים כמה
     נטשו ולא איפה, ואי אפשר להוריד חיכוך במקום הנכון. */
  var maxStep = 0, atContact = false, stepSent = false;
  window.THG_STEP = function(n, contact){
    if(n > maxStep) maxStep = n;
    if(contact) atContact = true;
  };

  /* ── הסרטון ───────────────────────────────────────────────────────
     שני מספרים במכוון. אחוז לבדו לא מבדיל בין מי שצפה לבין מי שגרר
     את הסרגל, ולכן נצברות גם שניות צפייה אמיתיות. */
  var vid = { on:false, pct:0, secs:0, len:0, done:false };
  function watch(v){
    if(!v || v.__thg) return; v.__thg = 1;
    var last = null;
    v.addEventListener('play', function(){ vid.on = true; last = v.currentTime; });
    v.addEventListener('pause', function(){ last = null; });
    v.addEventListener('timeupdate', function(){
      if(last !== null){
        var dt = v.currentTime - last;
        if(dt > 0 && dt < 1.5) vid.secs += dt;   /* קפיצה קדימה אינה צפייה */
        last = v.currentTime;
      }
      var d = v.duration;
      if(d && isFinite(d) && d > 0){
        vid.len = d;
        var p = Math.min(100, Math.round(v.currentTime / d * 100));
        if(p > vid.pct) vid.pct = p;
        if(p >= 95) vid.done = true;
      }
    });
    v.addEventListener('ended', function(){ vid.pct = 100; vid.done = true; });
  }
  function hook(){
    var vs = document.getElementsByTagName('video');
    for(var i = 0; i < vs.length; i++) watch(vs[i]);
  }
  if(document.readyState === 'loading') addEventListener('DOMContentLoaded', hook);
  else hook();
  setInterval(hook, 4000);

  /* ── זמן שהייה ועומק/מהירות גלילה, בדפי הנחיתה בלבד ──────────────────
     כלל ברזל (גל 24/09): לדעת אם ליד קרא לעומק או דפדף ונטש. נמדד פר ליד
     דרך ה-lid שב-URL, נשלח ל-/page-behavior. תוספתי בלבד, לא חוסם דבר. */
  function beacon(path, obj){
    try {
      var body = JSON.stringify(obj);
      if(navigator.sendBeacon) navigator.sendBeacon(W + path, new Blob([body], { type:'text/plain;charset=UTF-8' }));
      else fetch(W + path, { method:'POST', body: body, keepalive:true });
    } catch(e){}
  }
  var PG = location.pathname.indexOf('/cpage') > -1 ? 'cold'
         : location.pathname.indexOf('/hpage') > -1 ? 'hot' : '';
  var LID = ''; try { LID = new URLSearchParams(location.search).get('lid') || ''; } catch(e){}
  var maxScroll = 0, activeSec = 0, ttbSec = 0, scrolls = 0, tStart = Date.now();
  function scrollPct(){
    try {
      var de = document.documentElement, bd = document.body;
      var sh = Math.max(de.scrollHeight, bd ? bd.scrollHeight : 0);
      var vp = window.innerHeight || de.clientHeight;
      if(sh <= vp) return 100;
      var y = window.pageYOffset || de.scrollTop || 0;
      return Math.min(100, Math.round((y + vp) / sh * 100));
    } catch(e){ return 0; }
  }
  if(PG){
    addEventListener('scroll', function(){
      scrolls++;
      var d = scrollPct(); if(d > maxScroll) maxScroll = d;
      if(maxScroll >= 90 && !ttbSec) ttbSec = Math.round((Date.now() - tStart) / 1000);
    }, { passive:true });
    setInterval(function(){ if(!document.hidden) activeSec++; }, 1000);
    setTimeout(function(){ var d = scrollPct(); if(d > maxScroll) maxScroll = d; }, 400);
  }

  function flush(){
    if(!stepSent && (maxStep || atContact)){
      stepSent = true;
      fx('step', { step: maxStep, contact: atContact ? 1 : 0 });
    }
    if(vid.on){
      fx('vsl', { vsl: { played:1, pct: vid.pct, secs: Math.round(vid.secs),
                         len: Math.round(vid.len), done: vid.done } });
      vid.on = false;
    }
    /* התנהגות בדף הנחיתה, פר ליד */
    if(PG && LID && (maxScroll || activeSec)){
      beacon('/page-behavior', {
        lead_id: LID, page: PG,
        beh: { maxScroll: maxScroll, activeSec: activeSec, ttbSec: ttbSec, scrolls: scrolls },
        vsl: (PG === 'hot' && (vid.pct || vid.secs)) ? { pct: vid.pct, secs: Math.round(vid.secs), len: Math.round(vid.len), done: vid.done } : null
      });
    }
  }
  addEventListener('pagehide', flush);
  addEventListener('visibilitychange', function(){ if(document.hidden) flush(); });
  /* רשת ביטחון למי שהדפדפן שלו לא הספיק לשלוח ביציאה */
  setTimeout(function(){ fx('view'); }, 800);
})();
