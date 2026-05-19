// Admin: helpers compartilhados

export function escapeHtml(s) {
    return String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}
export function escapeAttr(s) {
    return escapeHtml(s).replace(/'/g, '&#39;');
}

export function el(tag, attrs = {}, ...children) {
    const n = document.createElement(tag);
    Object.entries(attrs || {}).forEach(([k, v]) => {
        if (k === 'class') n.className = v;
        else if (k.startsWith('on') && typeof v === 'function') n.addEventListener(k.slice(2), v);
        else if (v === true) n.setAttribute(k, '');
        else if (v != null && v !== false) n.setAttribute(k, v);
    });
    for (const c of children.flat()) {
        if (c == null) continue;
        n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    }
    return n;
}

export function confirm2(msg) {
    return Promise.resolve(window.confirm(msg));
}
