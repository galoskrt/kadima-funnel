/* ── מצב בדיקה במכשיר (גל 02/11/2026, "מצב צוות ב־/b/: תפעיל") ──────────────────
   בדיקה מהטלפון של הצוות עוברת את כל המשפך כמו ליד אמיתי: השאלון, השליחה לשרת, ההודעות בוואטסאפ,
   בחירת המועד ודף התודה. רק דבר אחד שונה: המכשיר לא נספר במטא ולא במונים של המשפך.
   בלי זה, הפיקסל בדפדפן רשם Lead ו־Schedule מהבדיקה של 27/10, ומטא למדה מליד שלא קיים.

   הדלקה: לפתוח פעם אחת דף כלשהו עם ?tester=1. כיבוי: ?tester=0. נשמר במכשיר, בכל הדפים של הדומיין.
   כשהמצב דלוק:
   1. הפיקסל לא נטען בכלל. fbq הוא פונקציה ריקה שרק רושמת את הקריאות (THG_TESTER_LOG, לבדיקות).
   2. הדפדפן לא שולח לשרת /capi-event ו־/funnel-event. ליד בדיקה כבר מדולג בשרת (מספר QA),
      אבל אירועים מלפני השליחה עוד לא קשורים לליד.
   3. פס קטן בראש הדף: "מצב בדיקה". אם הפס לא מופיע, המכשיר נספר.
   חייב להיטען לפני הפיקסל, ולכן נטען בראש ה־head בלי defer. */
(function(){
  var K = 'thg_tester', on = false;
  try {
    var q = new URLSearchParams(location.search);
    if (q.get('tester') === '1') localStorage.setItem(K, '1');
    if (q.get('tester') === '0') localStorage.removeItem(K);
    on = localStorage.getItem(K) === '1';
  } catch(e) {}
  window.THG_TESTER = on;
  if (!on) return;

  var log = window.THG_TESTER_LOG = [];
  /* הקטע של מטא בודק if(f.fbq)return, ולכן fbq שכבר קיים מונע את טעינת fbevents.js */
  var f = function(){ log.push(['fbq'].concat([].slice.call(arguments))); };
  f.queue = []; f.loaded = true; f.version = '2.0'; f.push = f;
  window.fbq = f; window._fbq = f;

  var BLOCK = /tom-funnel\.tom-harush\.workers\.dev\/(capi-event|funnel-event)(\?|$)/;
  function blocked(u){ try { return BLOCK.test(String(u && u.url || u)); } catch(e) { return false; } }
  if (navigator.sendBeacon) {
    var sb = navigator.sendBeacon.bind(navigator);
    navigator.sendBeacon = function(u, d){ if (blocked(u)) { log.push(['blocked', String(u)]); return true; } return sb(u, d); };
  }
  if (window.fetch) {
    var of = window.fetch;
    window.fetch = function(u){
      if (blocked(u)) { log.push(['blocked', String(u && u.url || u)]); return Promise.resolve(new Response('{"ok":true,"tester":true}', { status: 200, headers: { 'Content-Type': 'application/json' } })); }
      return of.apply(this, arguments);
    };
  }

  function bar(){
    if (document.getElementById('thgTester')) return;
    var b = document.createElement('div');
    b.id = 'thgTester'; b.setAttribute('role', 'status');
    b.textContent = 'מצב בדיקה: המכשיר הזה לא נספר במטא ובסטטיסטיקה';
    b.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:2147483001;background:#157a3a;color:#fff;font:700 12.5px/1.4 Heebo,Arial,sans-serif;text-align:center;padding:5px 10px;pointer-events:none';
    document.body.appendChild(b);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bar); else bar();
})();
