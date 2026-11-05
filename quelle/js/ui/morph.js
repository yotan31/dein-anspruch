// Sanftes Neuzeichnen: tauscht nur geänderte Teile aus, damit Eingabefelder und Scrollposition erhalten bleiben,
// und animiert den Wechsel zwischen Bildschirmen.
const IH = Object.getOwnPropertyDescriptor(Element.prototype, "innerHTML");

function sameNode(a, b) {
  if (a.nodeType !== b.nodeType || a.nodeName !== b.nodeName) return false;
  if (a.nodeType !== 1) return true;
  if (a.id || b.id) return a.id === b.id;
  if (a.nodeName === "INPUT" && a.type !== b.getAttribute("type")) return false;
  return true;
}

function morphKids(par, np) {
  let o = par.firstChild,
    n = np.firstChild;
  while (n) {
    const next = n.nextSibling;
    if (o && sameNode(o, n)) {
      morphNode(o, n);
      o = o.nextSibling;
    } else {
      let m = null;
      if (n.nodeType === 1 && n.id) {
        for (let c = o; c; c = c.nextSibling) {
          if (c.nodeType === 1 && c.id === n.id) {
            m = c;
            break;
          }
        }
      }
      if (m) {
        par.insertBefore(m, o);
        morphNode(m, n);
      } else par.insertBefore(n, o);
    }
    n = next;
  }
  while (o) {
    const nx = o.nextSibling;
    par.removeChild(o);
    o = nx;
  }
}

function morphNode(a, b) {
  if (a.nodeType !== 1) {
    if (a.nodeValue !== b.nodeValue) a.nodeValue = b.nodeValue;
    return;
  }
  for (const at of [...a.attributes]) if (!b.hasAttribute(at.name)) a.removeAttribute(at.name);
  for (const at of b.attributes) if (a.getAttribute(at.name) !== at.value) a.setAttribute(at.name, at.value);
  const tag = a.nodeName;
  if (tag === "INPUT") {
    if (a.type === "checkbox" || a.type === "radio") a.checked = b.hasAttribute("checked");
    else if (a.type !== "file" && document.activeElement !== a) {
      const v = b.getAttribute("value") || "";
      if (a.value !== v) a.value = v;
    }
    return;
  }
  if (tag === "TEXTAREA") {
    if (document.activeElement !== a) {
      const v = b.textContent;
      if (a.value !== v) a.value = v;
    }
    return;
  }
  morphKids(a, b);
  if (tag === "SELECT") {
    const s = a.querySelector("option[selected]");
    if (s) a.value = s.value;
    else if (a.options.length && !b.querySelector("option[selected]")) a.selectedIndex = 0;
  }
}

function smoothEl(el) {
  if (!el || el._smooth) return;
  el._smooth = true;
  Object.defineProperty(el, "innerHTML", {
    configurable: true,
    get() {
      return IH.get.call(this);
    },
    set(html) {
      const t = document.createElement("template");
      IH.set.call(t, html);
      morphKids(this, t.content);
    },
  });
}

/** Wird beim Start der App einmal aufgerufen (siehe start.js). */
export function aktiviereSanftesNeuzeichnen() {
  ["hero", "tabs", "main"].forEach((id) => smoothEl(document.getElementById(id)));
}
