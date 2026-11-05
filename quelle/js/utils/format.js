export function eur(n, d = 0) {
  return n.toLocaleString("de-DE", { minimumFractionDigits: d, maximumFractionDigits: d }) + " €";
}

export function esc(s) {
  return String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
}

export function numDE(x) {
  return (
    Number(
      String(x ?? "")
        .replace(/\s/g, "")
        .replace(/\.(?=\d{3}(\D|$))/g, "")
        .replace(",", "."),
    ) || 0
  );
}
