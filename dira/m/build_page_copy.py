# -*- coding: utf-8 -*-
"""
build_page_copy.py · עמוד נכס אחד, תיווך יד שנייה (גל 10/11/2026)

מקור אמת אחד לקופי: עורך הקופי (קופי-הפרויקט/index.html, המשתנה var DATA, הרשימה items לפי id).
הרצה אחת מעבירה עריכה בעורך לשלושה מקומות:
  1. dira/m/index.html  → PAGE_COPY: עמוד הנכס (ad.<k>.hook/sub/place, pg.<k>.*, pg.all.*)
  2. dira/index.html    → Q_COPY: השאלון ודף התודה (q.*, ty.*, wa.label.<k> במקום {נכס}) + תיאור הדף (q.meta)
  3. --worker <path>    → WA_LABEL בקובץ השרת (wa.label.<k>, {{2}} בתבנית yad2_prop_raz). רק yad2.next.js, לעולם לא yad2.js.
כותב רק בין הסמנים BEGIN/END. לא נוגע בשום דבר אחר בקבצים.

בדיקות לפני כתיבה (כלל ברזל של תום, 05/11 ו־10/11): אסור מספר בית אחרי שם רחוב, ואסור "דולב".
הדגשות (BOLD): ביטויים מתוך הטקסט עצמו. ביטוי שכבר לא קיים בטקסט אחרי עריכה = אזהרה, והוא פשוט לא מודגש.

שימוש:
  python build_page_copy.py                 בונה וכותב את שני הדפים
  python build_page_copy.py --check         רק בודק: יוצא עם 1 אם הדפים לא מעודכנים או שיש הפרה
  python build_page_copy.py --worker C:/Users/HP/tom-harush-worker/yad2.next.js
  python build_page_copy.py --src <path to קופי-הפרויקט/index.html>
"""
import argparse
import json
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent            # dira/m
DIRA = HERE.parent                                 # dira
DEFAULT_SRC = Path.home() / 'Downloads' / 'tom-harush' / 'תיווך יד שנייה' / 'קופי-הפרויקט' / 'index.html'
KEYS = ['kr', 'bz', 'tz']                          # הנכסים שעולים עכשיו. דולב מוקפא (תום דרך רז, 10/11)

# ── הדגשות בסיפור, לפי נכס. רק ביטויים שמופיעים מילה במילה ב־pg.<k>.story (גל: נקודות, הדגשה ואייקונים בנקודות החשובות) ──
BOLD = {
    'kr': ['הסכם התמורה מול היזם חתום ברוב הדרוש', 'דירה חדשה של 135 מ״ר, עם ממ״ד, חניה ומרפסת', '2,840,000 ₪', 'זו הערכה של המשרד, לא התחייבות',
           '4.5 חדרים', 'קומה שלישית ואחרונה'],
    'bz': ['שופצה מהיסוד, בתכנון של אדריכלית', 'אין מה לשפץ ואין למה לחכות', 'בפארק גבעתיים', 'שלושה בתי ספר במרחק הליכה',
           'מקום בחניון הגדול', 'זכויות להוסיף ממ״ד ומרפסת'],
    'tz': ['כבר 4 שנים', 'נשאר גם אחרי המכירה', 'חצר צמודה עם סוכך ועצים', 'שלושה כיווני אוויר', '6,350 ₪ בחודש', 'מכרז יזמים'],
}
# ── שקף "הדמיה" בגלריה (כלל ברזל 2 של תום: נכס בפינוי בינוי מקבל את הפרויקט החדש, עם תגית הדמיה גלויה) ──
# התגית = הנוסח שעל כרטיס 2 בקרוסלה בפיגמה. התיאור לקורא מסך = התווית של אותו כרטיס בעורך (ad.kr.c2.label).
RENDER = {'kr': {'src': 'img/kr/render.jpg', 'tag': 'הדמיה להמחשה בלבד', 'label_id': 'ad.kr.c2.label'}}

# ── כלל הכתובת: רחוב מותר (10/11), מספר בית אסור, ו"דולב" אסור לגמרי ──
STREETS = ['קריניצי', 'בן צבי', 'הצנחנים', 'דולב', 'כצנלסון', 'מבוא יהלום', 'יהל"ם', 'יהל״ם']
HOUSE_NO = re.compile(r'(?:' + '|'.join(re.escape(s) for s in STREETS) + r')\s*\d|רחוב\s+[^\s,.\d]+(?:\s+[^\s,.\d]+)?\s+\d')


def load_items(src):
    html = Path(src).read_text(encoding='utf-8')
    m = re.search(r'^var DATA = (\{.*\});?\s*$', html, re.M)
    if not m:
        sys.exit('לא נמצא var DATA בקובץ המקור: ' + str(src))
    data = json.loads(m.group(1))
    data['_labels'] = {it['id']: it.get('label', '') for it in data['items']}   # שם הפריט בעורך = כותרת הקטע בעמוד ("בשכונה", "חשוב לדעת")
    return data, {it['id']: it['text'] for it in data['items']}


def lines(t):
    return [x.strip() for x in t.split('\n') if x.strip()]


def dots(t):
    return [x.strip() for x in t.split('·') if x.strip()]


def build(src):
    data, it = load_items(src)
    need = []

    def g(i):
        if i not in it:
            need.append(i)
            return ''
        return it[i]

    warn = []
    props = {}
    for k in KEYS:
        story = g('pg.%s.story' % k)
        p = {
            'hook': g('ad.%s.hook' % k), 'sub': g('ad.%s.sub' % k), 'place': g('ad.%s.place' % k),
            'story': story, 'facts': dots(g('pg.%s.facts' % k)), 'hood': dots(g('pg.%s.hood' % k)), 'know': g('pg.%s.know' % k),
            'hoodT': data['_labels'].get('pg.%s.hood' % k, ''), 'knowT': data['_labels'].get('pg.%s.know' % k, ''),
            'bold': [b for b in BOLD.get(k, []) if b in story],
        }
        for b in BOLD.get(k, []):
            if b not in story:
                warn.append('%s: הביטוי להדגשה כבר לא בסיפור, לא יודגש: "%s"' % (k, b))
        if k in RENDER:
            r = RENDER[k]
            p['render'] = {'src': r['src'], 'tag': r['tag'], 'alt': r['tag'] + ' · ' + g(r['label_id'])}
        props[k] = p

    raz = lines(g('pg.all.raz'))
    page = {
        'v': data.get('version', ''),
        'all': {'btn': g('pg.all.btn'), 'done': g('pg.all.done'), 'more': g('pg.all.more'),
                'razName': raz[0] if raz else '', 'razRole': raz[1] if len(raz) > 1 else ''},
        'props': props,
    }

    def ts(i):   # כותרת + שורה מתחת (שאלה)
        x = lines(g(i))
        return {'t': x[0] if x else '', 's': x[1] if len(x) > 1 else ''}

    other, other_ty = lines(g('q.other.t')), lines(g('q.other.ty'))
    quiz = {
        'v': data.get('version', ''),
        'area': ts('q.area'), 'rooms': ts('q.rooms'), 'budget': ts('q.budget'), 'must': ts('q.must'),
        'ctx': g('q.ctx'), 'contactT': g('q.contact.t'), 'contactS': g('q.contact.s'), 'consent': g('q.consent'),
        'btn': g('q.btn'), 'errConsent': g('q.err.consent'),
        'otherT': other[0] if other else '', 'otherS': ' '.join(other[1:]), 'otherBtn': g('q.other.btn'),
        'otherTyT': other_ty[0] if other_ty else '', 'otherTyS': ' '.join(other_ty[1:]),
        'ty': {'title': g('ty.title'), 'sent': g('ty.sent'), 'night': g('ty.night'), 'call': g('ty.call'),
               'callNight': g('ty.call.night'), 'callShabbat': g('ty.call.shabbat'), 'btn': g('ty.btn'), 'noprop': g('ty.noprop')},
        'labels': {k: g('wa.label.%s' % k) for k in KEYS},
    }
    wa_labels = {k: g('wa.label.%s' % k) for k in KEYS}
    meta = g('q.meta')
    if need:
        sys.exit('חסרים פריטים במקור: ' + ', '.join(need))
    return page, quiz, wa_labels, meta, warn


def lint(obj, where):
    bad = []

    def walk(x, path):
        if isinstance(x, str):
            if HOUSE_NO.search(x):
                bad.append('%s %s: מספר בית אחרי רחוב: "%s"' % (where, path, x[:90]))
            if 'דולב' in x:
                bad.append('%s %s: "דולב" אסור: "%s"' % (where, path, x[:90]))
        elif isinstance(x, dict):
            for kk, v in x.items():
                walk(v, path + '.' + str(kk))
        elif isinstance(x, list):
            for i, v in enumerate(x):
                walk(v, path + '[%d]' % i)
    walk(obj, '')
    return bad


def js_json(o):
    return json.dumps(o, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')


def read(f):   # שומר על סוג סוף השורה של הקובץ (CRLF בעותק העבודה של git ב־Windows)
    raw = Path(f).read_bytes()
    return raw.decode('utf-8').replace('\r\n', '\n'), ('\r\n' if b'\r\n' in raw else '\n')


def splice(text, name, body, fname):
    a, b = '/* %s:BEGIN */' % name, '/* %s:END */' % name
    i, j = text.find(a), text.find(b)
    if i < 0 or j < i:
        sys.exit('לא נמצאו הסמנים %s בקובץ %s' % (name, fname))
    return text[:i + len(a)] + '\n' + body + '\n' + text[j:]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--src', default=str(DEFAULT_SRC))
    ap.add_argument('--worker', default='')
    ap.add_argument('--check', action='store_true')
    a = ap.parse_args()
    if a.worker and Path(a.worker).name == 'yad2.js':
        sys.exit('לא כותבים ל־yad2.js במקום. רק ל־yad2.next.js (ההחלפה בפריסה המתואמת).')

    page, quiz, wa_labels, meta, warn = build(a.src)
    bad = lint(page, 'עמוד הנכס') + lint(quiz, 'השאלון') + lint(wa_labels, 'WA_LABEL') + lint(meta, 'q.meta')
    for w in warn:
        print('אזהרה:', w)
    if bad:
        for x in bad:
            print('הפרה:', x)
        sys.exit(1)

    jobs = []
    f_page = HERE / 'index.html'
    t, nl = read(f_page)
    jobs.append((f_page, t, splice(t, 'PAGE_COPY', 'var PAGE_COPY = ' + js_json(page) + ';', f_page.name), nl))
    f_quiz = DIRA / 'index.html'
    t, nl = read(f_quiz)
    n = splice(t, 'Q_COPY', 'var Q_COPY = ' + js_json(quiz) + ';', f_quiz.name)
    esc_meta = meta.replace('&', '&amp;').replace('"', '&quot;').replace('<', '&lt;')
    n = re.sub(r'(<meta name="description" content=")[^"]*(")', lambda m: m.group(1) + esc_meta + m.group(2), n, count=1)
    jobs.append((f_quiz, t, n, nl))
    if a.worker:
        f_w = Path(a.worker)
        t, nl = read(f_w)
        q = lambda v: "'" + v + "'" if "'" not in v else json.dumps(v, ensure_ascii=False)
        body = 'const WA_LABEL = {\n' + ''.join('  %s: %s,\n' % (k, q(v)) for k, v in wa_labels.items()) + '};'
        jobs.append((f_w, t, splice(t, 'WA_LABEL', body, f_w.name), nl))

    stale = [f for f, old, new, nl in jobs if old != new]
    if a.check:
        for f in stale:
            print('לא מעודכן:', f)
        print('הכל מעודכן' if not stale else 'להריץ בלי --check כדי לעדכן')
        sys.exit(1 if stale else 0)
    for f, old, new, nl in jobs:
        if old != new:
            f.write_bytes(new.replace('\n', nl).encode('utf-8'))
            print('עודכן:', f)
        else:
            print('ללא שינוי:', f)
    print('גרסת הקופי:', page['v'])


if __name__ == '__main__':
    main()
