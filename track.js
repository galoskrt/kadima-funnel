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
  }
  addEventListener('pagehide', flush);
  addEventListener('visibilitychange', function(){ if(document.hidden) flush(); });
  /* רשת ביטחון למי שהדפדפן שלו לא הספיק לשלוח ביציאה */
  setTimeout(function(){ fx('view'); }, 800);
})();
