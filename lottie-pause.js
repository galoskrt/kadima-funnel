/* ── עצירת האנימציות שרצות בלולאה (גל 28/10/2026, "אוקיי מסכים") ─────────────
   WCAG 2.2.2: תנועה שמתחילה לבד ונמשכת יותר מ־5 שניות צריכה דרך לעצור אותה.
   לפי החוק של גל מ־22/10 אין כפתור עצירה גלוי. במקום זה:
   1. מעבר עכבר על אנימציה עוצר אותה, ויציאה ממנה מפעילה אותה שוב.
   2. נגיעה באנימציה שאינה קישור עוצרת או מפעילה אותה. נגיעה באייקון של רשת חברתית ממשיכה לקישור כרגיל.
   3. מי שהגדיר במכשיר "הפחתת תנועה" רואה את כל האנימציות עומדות.
   4. כפתור "עצירת האנימציות בדף" מופיע רק למי שמנווט במקלדת (Tab), כמו קישור דילוג.
   נטען בדפי B בלבד (/b/, /b/p/, /b/t/). דפי A מוקפאים. */
(function(){
  var SEL = 'lottie-player';
  var rm = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : null;
  var off = !!(rm && rm.matches), btn = null;

  function each(fn){ var ps = document.querySelectorAll(SEL); for (var i = 0; i < ps.length; i++) { try { fn(ps[i]); } catch(e){} } }
  /* עוצרים על פריים מאמצע האנימציה ולא על הראשון, שבחלק מהאייקונים עוד ריק */
  function freeze(p){ if (p.seek) p.seek('50%'); if (p.pause) p.pause(); }
  function run(p){ if (!off && !p.__held && p.play) p.play(); }
  function label(){ if (btn) btn.textContent = off ? 'הפעלת האנימציות בדף' : 'עצירת האנימציות בדף'; }
  function setAll(stop){ off = stop; each(function(p){ p.__held = false; if (off) freeze(p); else run(p); }); label(); }

  function hook(p){
    if (p.__lp) return; p.__lp = 1;
    /* אנימציה שעוד לא נטענה: עוצרים אותה ברגע שהיא מוכנה */
    p.addEventListener('ready', function(){ if (off || p.__held) freeze(p); });
    /* הספרייה מפעילה מחדש אנימציה שחוזרת למסך או ללשונית. מה שנעצר נשאר עצור */
    p.addEventListener('play', function(){ if (off || p.__held) freeze(p); });
    p.addEventListener('mouseenter', function(){ if (!off) freeze(p); });
    p.addEventListener('mouseleave', function(){ run(p); });
    p.addEventListener('pointerup', function(e){
      if (e.pointerType !== 'touch' || off || p.closest('a')) return;
      p.__held = !p.__held;
      if (p.__held) freeze(p); else run(p);
    });
    if (off) freeze(p);
  }

  function start(){
    if (!document.querySelector(SEL)) return;
    var st = document.createElement('style');
    st.textContent = '.lp-btn{position:fixed;top:8px;right:8px;z-index:2147483000;transform:translateY(-200%);'
      + 'background:#0f1216;color:#fff;border:2px solid #fff;border-radius:10px;padding:10px 16px;'
      + 'font:700 15px/1.2 Heebo,Assistant,Arial,sans-serif;cursor:pointer}'
      + '.lp-btn:focus{transform:none;outline:3px solid #C2151C;outline-offset:2px}';
    document.head.appendChild(st);
    btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'lp-btn';
    btn.addEventListener('click', function(){ setAll(!off); });
    label();
    document.body.insertBefore(btn, document.body.firstChild);
    each(hook);
    if (rm && rm.addEventListener) rm.addEventListener('change', function(e){ setAll(e.matches); });
  }

  /* הרכיב מוגדר רק אחרי שספריית האנימציות נטענת. עד אז מסמנים, ואז מחילים שוב */
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
  if (window.customElements && customElements.whenDefined) customElements.whenDefined(SEL).then(function(){ each(hook); if (off) each(freeze); });
})();
