# Baut die veröffentlichte App (site/index.html, site/app.js) aus quelle/app.html und quelle/speicher.js.
# Aufruf: python3 quelle/bauen.py
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
import re
src=open(ROOT/'quelle'/'app.html',encoding='utf-8').read()
store=open(ROOT/'quelle'/'speicher.js',encoding='utf-8').read()
css=src.split('<style>',1)[1].split('</style>',1)[0]
body=src.split('</style>',1)[1].split('<script>\n',1)[0]
js=src.split('<script>\n',1)[1].rsplit('</script>',1)[0]
def rep(s,a,b,cnt=1):
    assert a in s, a[:90]
    return s.replace(a,b,cnt)
# cut old storage section
i=js.index('let ref=null, BCOL=null, ASSETS=null')
js=js[:i]+store+"\nrender();\ninitStore();\n"
# blob urls
js=rep(js,'src="/_blob/${esc(b.asset)}"','src="${esc(blobUrl(b.asset))}"')
js=rep(js,'href="/_blob/${esc(b.asset)}"','href="${esc(blobUrl(b.asset))}"')
js=rep(js,'"/_blob/"+b.asset','blobUrl(b.asset)')
js=rep(js,'$("lbimg").src="/_blob/"+t.dataset.view','$("lbimg").src=blobUrl(t.dataset.view)')
js=rep(js,'fetch("/_blob/"+id)','fetch(blobUrl(id))')
assert '_blob' not in js
# gating
js=rep(js,'''  if(S.wiz && B.find(x=>x.k===S.wiz.k)){''','''  if(!USER && !GUEST){ $("main").innerHTML=viewLogin(); return }
  if(consentNeeded()){ $("main").innerHTML=viewConsent(); return }
  if(S.wiz && B.find(x=>x.k===S.wiz.k)){''')
js=rep(js,'const t=$("tabs"); t.hidden=!S.done||!!S.wiz||!!RECHNER;','const t=$("tabs"); t.hidden=!S.done||!!S.wiz||!!RECHNER||(!USER&&!GUEST)||consentNeeded();')
# account chip
js=rep(js,'''  const fontsw=''','''  const acct = USER?`<button type="button" class="acct" data-act="logout" title="${esc(USER.email||"")}">Abmelden</button>`:GUEST?`<button type="button" class="acct" data-act="guest-register">Konto anlegen</button>`:"";
  const fontsw=''')
js=js.replace('${fontsw}${save}','${fontsw}${save}${acct}')
js=rep(js,'<span class="btnrow" style="margin-top:8px"><button class="btn small danger" type="button" data-act="reset-yes">Ja, löschen</button><button class="btn small ghost" type="button" data-act="reset-no">Abbrechen</button></span></span></div>`;','<span class="btnrow" style="margin-top:8px"><button class="btn small danger" type="button" data-act="reset-yes">Ja, löschen</button><button class="btn small ghost" type="button" data-act="reset-no">Abbrechen</button></span></span></div>\n   ${datenBox()}`;')
# texts
js=rep(js,'Fotos speichern ist in dieser Ansicht nicht möglich (nur mit Bearbeitungsrecht). Beträge kannst du trotzdem erfassen.','Fotos speichern geht nur mit Konto. Beträge kannst du trotzdem erfassen, sie bleiben aber nur bis zum Schließen der Seite.')
# events
js=rep(js,'    case "welcome-ok":','''    case "au-google": googleLogin(); break;
    case "au-login": case "au-register": case "au-forgot": case "au-newpw": authAction(a); break;
    case "au-mode": authMode=t.dataset.mode; authMsg=""; render(); break;
    case "au-show": { const p=$("au-pw"); if(p){ p.type=p.type==="password"?"text":"password"; t.textContent=p.type==="password"?"Zeigen":"Verbergen" } break }
    case "au-guest": lsSet("dein-anspruch-modus","gast"); startGuest(); scrollTop(); break;
    case "guest-register": GUEST=false; authMode="register"; authMsg=""; lsSet("dein-anspruch-modus",""); render(); scrollTop(); break;
    case "logout": logout(); break;
    case "wipe": wipeAsk=true; render(); { const w=$("wipe-word"); if(w) try{ w.focus({preventScroll:true}) }catch(e){} } break;
    case "wipe-no": wipeAsk=false; render(); break;
    case "wipe-yes": wipeAll(); break;
    case "backup": backupData(); break;
    case "restore": { const f=$("fileJson"); if(f){ f.value=""; f.click() } break }
    case "welcome-ok":''')
js=rep(js,'''document.addEventListener("keydown",e=>{if(e.key==="Escape"){ $("lightbox").hidden=true; const fb=$("fbbox"); if(fb) fb.hidden=true }''','''document.addEventListener("keydown",e=>{if(e.key==="Escape"){ $("lightbox").hidden=true; const fb=$("fbbox"); if(fb) fb.hidden=true }
  if(e.key==="Enter" && e.target.closest && e.target.closest(".auth") && e.target.tagName==="INPUT"){ e.preventDefault(); const b=document.querySelector('.auth .btn.big'); b&&b.click(); return }''')
css=css+'''
.testbanner{position:sticky;top:0;z-index:50;background:#b3261e;color:#fff;font-weight:700;text-align:center;padding:6px 10px;font-size:.85rem;margin:-16px -16px 12px}
.acct{border:0;background:rgba(255,255,255,.1);color:var(--hero-fg);font:inherit;font-size:.82rem;font-weight:700;border-radius:999px;padding:4px 12px;cursor:pointer}
.auth{max-width:520px;margin:0 auto;width:100%}
.gbtn{background:#fff;color:#1f1f1f;border:1.5px solid #c7c7c7;gap:12px}
.gbtn:hover{border-color:#8a8a8a}
.orline{display:flex;align-items:center;gap:12px;color:var(--muted);font-size:.88rem}
.orline::before,.orline::after{content:"";flex:1;border-top:1px solid var(--line)}
.auth input[type=email],.auth input[type=password],.auth input[type=text]{font-size:1.1rem;padding:12px 14px}
'''
# persons
js=rep(js,'  if(!USER && !GUEST){ $("main").innerHTML=viewLogin(); return }','  if(!USER && !GUEST){ $("main").innerHTML=viewLogin(); return }\n  if(USER && showPersons){ $("main").innerHTML=viewPersons(); return }')
js=rep(js,'  const acct = USER?','  const curF = USER && FAELLE.find(f=>f.id===FALL_ID);\n  const personBtn = curF ? `<button type="button" class="acct person" data-act="persons" aria-expanded="${showPersons}">${ic("user")}${esc(fallName(curF))} ▾</button>` : "";\n  const acct = USER?')
js=js.replace('${fontsw}${save}${acct}','${personBtn}${fontsw}${save}${acct}')
js=rep(js,'    case "logout": logout(); break;','''    case "logout": logout(); break;
    case "persons": showPersons=!showPersons; delPersonAsk=false; if(showPersons) loadMembers(); render(); scrollTop(); break;
    case "add-person": addPerson(); break;
    case "invite": makeInvite(); break;
    case "inv-copy": copy(inviteLink); break;
    case "del-person": delPersonAsk=true; render(); break;
    case "del-person-no": delPersonAsk=false; render(); break;
    case "del-person-yes": deletePerson(); break;''')
js=rep(js,'  if(t.dataset.font){','  if(t.dataset.rmember){ removeMember(t.dataset.rmember); return }\n  if(t.dataset.font){')
js=rep(js,'[data-wopen],[data-wnav],[data-font],[data-gotoclaim]");','[data-wopen],[data-wnav],[data-font],[data-gotoclaim],[data-rmember]");')
js=rep(js,'  if(t.id==="entl-seit")','  if(t.dataset.fall){ openFall(t.dataset.fall); scrollTop(); return }\n  if(t.id==="entl-seit")')
css=css+"""
.acct.person{display:inline-flex;align-items:center;gap:6px;max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.acct.person svg{width:16px;height:16px}
.members{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:6px}
.members li{display:flex;justify-content:space-between;gap:10px;border:1px solid var(--line);border-radius:10px;padding:8px 12px;flex-wrap:wrap}
hr.sep{border:0;border-top:1px solid var(--line);margin:4px 0}
.recip code{display:block;padding:6px 0}
"""
js=rep(js,'    <button type="button" class="btn ghost" data-act="au-guest">Ohne Konto ausprobieren</button>','    <button type="button" class="btn ghost" data-act="au-guest">Ohne Konto ausprobieren</button>\n    <button type="button" class="linkbtn" data-act="r-start">Pflegegrad-Rechner: ohne Anmeldung einschätzen, welcher Pflegegrad in Frage kommt</button>')
js=rep(js,'async function initStore(){','async function initStore(){\n  try{ if(new URLSearchParams(location.search).has("rechner")) RECHNER={i:0,a:[]} }catch(e){}')
js=rep(js,'  ${rel?`<section class="panel">\n    <div class="section-title"><h2>Beratungsbesuch</h2>','  ${eriCard()}\n  ${rel?`<section class="panel">\n    <div class="section-title"><h2>Beratungsbesuch</h2>')
js=rep(js,'    case "logout": logout(); break;','    case "logout": logout(); break;\n    case "cs-yes": giveConsent(); break;\n    case "fb-open": openFeedback(); break;\n    case "fb-close": closeFeedback(); break;\n    case "fb-send": sendFeedback(); break;\n    case "teilen": shareApp(); break;\n    case "eri-on": setEri(true,($("eri-mail")||{}).value); break;\n    case "eri-off": setEri(false); break;')
csp=("default-src 'self'; script-src 'self' https://cdn.jsdelivr.net 'wasm-unsafe-eval'; worker-src 'self' blob: https://cdn.jsdelivr.net; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://cdn.jsdelivr.net data: blob:; "
     "img-src 'self' data: blob: https://*.supabase.co; style-src 'self' 'unsafe-inline'; font-src 'self'; "
     "frame-src 'none'; object-src 'none'; base-uri 'none'; form-action 'self'")
head=f'''<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta http-equiv="Content-Security-Policy" content="{csp}">
<meta name="referrer" content="no-referrer">
<meta name="robots" content="noindex, nofollow">
<meta name="description" content="Pflegegrad oder Schwerbehinderung: Welche Leistungen stehen noch zu? Mit fertigen Anträgen, Belege-Ablage und Fristen.">
<meta name="theme-color" content="#13233a">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Dein Anspruch">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="icon-192.png">
<title>Dein Anspruch</title>
<meta property="og:type" content="website">
<meta property="og:site_name" content="Dein Anspruch">
<meta property="og:title" content="Dein Anspruch – welche Pflege-Leistungen stehen euch noch zu?">
<meta property="og:description" content="Kostenlos prüfen, was bei Pflegegrad oder Schwerbehinderung noch offen ist. Mit fertigen Anträgen, Belege-Ablage und Erinnerung an Fristen.">
<meta property="og:image" content="https://yotan31.github.io/dein-anspruch/teilen.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:url" content="https://yotan31.github.io/dein-anspruch/">
<meta name="twitter:card" content="summary_large_image">
<link rel="preload" href="vendor/schrift/AtkinsonHyperlegible-Regular.woff2" as="font" type="font/woff2" crossorigin>
<style>@font-face{{font-family:"Atkinson Hyperlegible";src:url(vendor/schrift/AtkinsonHyperlegible-Regular.woff2) format("woff2");font-weight:400;font-style:normal;font-display:swap}}
@font-face{{font-family:"Atkinson Hyperlegible";src:url(vendor/schrift/AtkinsonHyperlegible-Bold.woff2) format("woff2");font-weight:700;font-style:normal;font-display:swap}}
@font-face{{font-family:"Atkinson Hyperlegible";src:url(vendor/schrift/AtkinsonHyperlegible-Italic.woff2) format("woff2");font-weight:400;font-style:italic;font-display:swap}}
@font-face{{font-family:"Source Serif 4";src:url(vendor/schrift/SourceSerif4.woff) format("woff");font-weight:500 700;font-style:normal;font-display:swap}}
:root{{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}}body{{margin:0}}img{{max-width:100%}}[hidden]{{display:none!important}}
{css}</style>
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js" integrity="sha256-hZaWX+kY5lZgChtWjToWj1wNPSKmAIhrtvRKZVXbAec=" crossorigin="anonymous"></script>
<script src="vendor/jspdf.umd.min.js?v=4.2.1" defer></script>
</head>
<body>
'''
body=re.sub(r'<title>.*?</title>','',body)
body=body.replace('<p>Diese App ersetzt keine Rechtsberatung.','<p>Deine Daten werden verschlüsselt übertragen und in einer Datenbank in Frankfurt gespeichert. Nur du und Personen, die du einlädst, können sie sehen. <a href="datenschutz.html">Datenschutz</a> · <a href="nutzungsbedingungen.html">Nutzungsbedingungen</a> · <a href="impressum.html">Impressum</a> · <button type="button" class="linkbtn" data-act="fb-open">Feedback geben</button> · <button type="button" class="linkbtn" data-act="teilen">App weiterempfehlen</button></p>\n    <p>Diese App ersetzt keine Rechtsberatung.')
import hashlib
APPJS='"use strict";\n'+js.replace('"use strict";','',1)
VER=hashlib.sha1(APPJS.encode()).hexdigest()[:8]
APPJS=APPJS.replace('__APPVERSION__',VER)
out=head+body+f'<script src="app.js?v={VER}"></script>\n</body>\n</html>\n'
open(ROOT/'site'/'index.html','w',encoding='utf-8').write(out)
open(ROOT/'site'/'app.js','w',encoding='utf-8').write(APPJS)
print("built", len(out), len(js))
