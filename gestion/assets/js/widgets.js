/*! Widget Kit — widgets.js (fourni par le client ; adapté : aucun code inline, polices et icônes locales)
 *  Vanilla JS, zéro dépendance. Expose `window.UI`.
 *  Graphiques : UI.bars / area / lines / ring / rings / pie / hbars / spark / chartGrid
 *  Divers : UI.icon / sprite / ranges / tabs / avatars / init
 *  Couleurs acceptées : 'indigo' 'red' 'amber' 'green' 'sky' (+ '-soft'), ou n'importe quelle valeur CSS.
 *  Dans l'application, « indigo » = la couleur principale de l'entreprise active (voir assets/css/widgets.css).
 */
(function (global) {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';
  var $ = function (t) { return typeof t === 'string' ? document.querySelector(t) : t; };
  var col = function (c) { return /^(indigo|red|amber|green|sky)(-soft)?$/.test(c) ? 'var(--' + c + ')' : (c || 'var(--indigo)'); };
  var sum = function (a) { return a.reduce(function (x, y) { return x + y; }, 0); };
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };

  function el(tag, attrs, parent) {
    var n = document.createElementNS(NS, tag);
    for (var k in attrs) { if (k !== 'text' && attrs[k] != null) n.setAttribute(k, attrs[k]); }
    if (attrs && attrs.text != null) n.textContent = attrs.text;
    if (parent) parent.appendChild(n);
    return n;
  }

  /* ------------------------------------------------------------------ *
   *  Icônes (24×24, trait 1.8) — <svg class="i"><use href="#i-home"/></svg>
   * ------------------------------------------------------------------ */
  var ICONS = {
    'home': '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
    'user': '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    'users': '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    'bell': '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>',
    'calendar': '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    'clock': '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    'search': '<circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>',
    'settings': '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
    'activity': '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
    'bar-chart': '<path d="M12 20V10M18 20V4M6 20v-4"/>',
    'pie-chart': '<path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/>',
    'trending-up': '<path d="M23 6l-9.5 9.5-5-5L1 18"/><path d="M17 6h6v6"/>',
    'image': '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>',
    'heart': '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>',
    'message': '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    'mail': '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 6l-10 7L2 6"/>',
    'phone': '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>',
    'plus': '<path d="M12 5v14M5 12h14"/>',
    'minus': '<path d="M5 12h14"/>',
    'x': '<path d="M18 6L6 18M6 6l12 12"/>',
    'check': '<path d="M20 6L9 17l-5-5"/>',
    'chevron-left': '<path d="M15 18l-6-6 6-6"/>',
    'chevron-right': '<path d="M9 18l6-6-6-6"/>',
    'chevron-up': '<path d="M18 15l-6-6-6 6"/>',
    'chevron-down': '<path d="M6 9l6 6 6-6"/>',
    'arrow-left': '<path d="M19 12H5M12 19l-7-7 7-7"/>',
    'arrow-right': '<path d="M5 12h14M12 5l7 7-7 7"/>',
    'arrow-up': '<path d="M12 19V5M5 12l7-7 7 7"/>',
    'arrow-down': '<path d="M12 5v14M19 12l-7 7-7-7"/>',
    'trash': '<path d="M3 6h18M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>',
    'edit': '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    'save': '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/>',
    'download': '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
    'upload': '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>',
    'copy': '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    'lock': '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    'eye': '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"/><circle cx="12" cy="12" r="3"/>',
    'star': '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/>',
    'share': '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98"/>',
    'bookmark': '<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>',
    'filter': '<path d="M22 3H2l8 9.46V19l4 2v-8.54z"/>',
    'grid': '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>',
    'list': '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
    'cart': '<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>',
    'credit-card': '<rect x="1" y="4" width="22" height="16" rx="2"/><path d="M1 10h22"/>',
    'tag': '<path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><path d="M7 7h.01"/>',
    'gift': '<path d="M20 12v10H4V12M2 7h20v5H2zM12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>',
    'zap': '<path d="M13 2L3 14h9l-1 8 10-12h-9z"/>',
    'power': '<path d="M18.36 6.64a9 9 0 1 1-12.73 0M12 2v10"/>',
    'link': '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
    'external': '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/>',
    'folder': '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>',
    'file': '<path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M13 2v7h7"/>',
    'map-pin': '<path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
    'more': '<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
    'sun': '<circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>',
    'moon': '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>',
    'wifi': '<path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/>',
    'globe': '<circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
    'refresh': '<path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>',
    'logout': '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
    'layers': '<path d="M12 2L2 7l10 5 10-5z"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>',
    'info': '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
    'alert': '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4M12 17h.01"/>',
    'help': '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01"/>',
    'play': '<path d="M5 3l14 9-14 9z"/>',
    'shield': '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    'flame': '<path d="M12 22a7 7 0 0 0 7-7c0-4-3-6-4-10-3 2-6 5-6 8-1-1-2-2-2-4-2 2-2 4-2 6a7 7 0 0 0 7 7z"/>'
  };

  function sprite() {
    if (document.getElementById('wk-sprite')) return;
    var d = document.createElement('div');
    d.id = 'wk-sprite';
    d.setAttribute('aria-hidden', 'true');
    d.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
    d.innerHTML = '<svg xmlns="' + NS + '">' + Object.keys(ICONS).map(function (k) {
      return '<symbol id="i-' + k + '" viewBox="0 0 24 24">' + ICONS[k] + '</symbol>';
    }).join('') +
      '<symbol id="i-logo" viewBox="0 0 24 24"><path d="M12 3c3.2 3.6 5.2 6.2 5.2 9.2a5.2 5.2 0 0 1-10.4 0C6.8 9.2 8.8 6.6 12 3z" fill="currentColor" stroke="none"/></symbol></svg>';
    document.body.insertBefore(d, document.body.firstChild);
  }
  function icon(name, cls) { return '<svg class="i ' + (cls || '') + '" aria-hidden="true"><use href="#i-' + name + '"/></svg>'; }

  /* ------------------------------------------------------------------ *
   *  Moteur SVG : montage responsive + axes + courbes
   * ------------------------------------------------------------------ */
  function mount(target, o, draw) {
    var host = $(target);
    if (!host) return null;
    host.classList.add('chart');
    if (o.height) host.style.height = o.height + 'px';
    var lw = 0, lh = 0;
    function run() {
      var w = host.clientWidth, h = host.clientHeight;
      if (!w || !h) return;
      lw = w; lh = h;
      host.textContent = '';
      var s = el('svg', { width: w, height: h, viewBox: '0 0 ' + w + ' ' + h, role: 'img' }, host);
      if (o.label) s.setAttribute('aria-label', o.label);
      draw(s, w, h);
    }
    run();
    if ('ResizeObserver' in window) {
      new ResizeObserver(function () { if (host.clientWidth !== lw || host.clientHeight !== lh) run(); }).observe(host);
    }
    return { redraw: run, update: function (n) { Object.assign(o, n); run(); } };
  }

  function niceScale(min, max, count) {
    if (!(max > min)) max = min + 1;
    var raw = (max - min) / count, p = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / p;
    var step = (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p;
    var top = Math.ceil(max / step - 1e-9) * step, ticks = [];
    for (var v = min; v <= top + 1e-9; v += step) ticks.push(+v.toFixed(6));
    return { min: min, max: top, ticks: ticks };
  }

  // Repère commun : padding, échelles, grille, étiquettes.
  function axes(s, w, h, o, n, mode, dataMax) {
    var f = o.bleed ? { l: 0, r: 0, t: 0, b: 0 } : { l: o.yAxis === false ? 4 : (o.yAxisWidth || 38), r: 8, t: 8, b: o.xAxis === false ? 4 : 26 };
    f.iw = w - f.l - f.r; f.ih = h - f.t - f.b;
    var sc = niceScale(o.yMin != null ? o.yMin : 0, o.yMax != null ? o.yMax : dataMax * 1.05, o.yTicks || 5);
    var Y = function (v) { return f.t + f.ih - ((v - sc.min) / (sc.max - sc.min)) * f.ih; };
    var X = function (i) { return mode === 'band' ? f.l + f.iw * (i + .5) / n : f.l + (n > 1 ? f.iw * i / (n - 1) : f.iw / 2); };
    if (!o.bleed && o.grid !== 'none') {
      var g = el('g', { 'class': 'ch-grid' }, s);
      sc.ticks.forEach(function (v) {
        el('line', { x1: f.l, x2: f.l + f.iw, y1: Y(v), y2: Y(v) }, g);
        if (o.yAxis !== false) el('text', { 'class': 'ch-label', x: f.l - 8, y: Y(v) + 3.5, 'text-anchor': 'end', text: (o.yFormat || function (x) { return x; })(v) }, g);
      });
      if (o.grid === 'both') for (var i = 0; i < n; i++) el('line', { x1: X(i), x2: X(i), y1: f.t, y2: f.t + f.ih }, g);
    }
    if (!o.bleed && o.xAxis !== false) {
      var labels = o.xLabels || Array.apply(null, Array(n)).map(function (_, i) { return (i + 1) + '/' + n; });
      var every = o.xEvery || Math.ceil(n / Math.max(1, Math.floor(f.iw / 46)));
      labels.forEach(function (t, i) { if (i % every === 0) el('text', { 'class': 'ch-label', x: X(i), y: h - 6, 'text-anchor': 'middle', text: t }, s); });
    }
    return { f: f, X: X, Y: Y, sc: sc, base: Y(sc.min) };
  }

  // Courbe lissée : tangentes horizontales aux points (pas de dépassement).
  function smoothPath(p) {
    var d = 'M' + p[0][0] + ',' + p[0][1];
    for (var i = 1; i < p.length; i++) {
      var mx = (p[i - 1][0] + p[i][0]) / 2;
      d += 'C' + mx + ',' + p[i - 1][1] + ' ' + mx + ',' + p[i][1] + ' ' + p[i][0] + ',' + p[i][1];
    }
    return d;
  }
  function linePath(p) { return p.map(function (q, i) { return (i ? 'L' : 'M') + q[0] + ',' + q[1]; }).join(''); }
  function tip(node, text) { el('title', { text: text }, node); }
  function seriesMax(S) { return Math.max.apply(null, [].concat.apply([], S.map(function (x) { return x.data; }))); }

  /* ---- Barres : groupées, empilées (solid|pill), une barre mise en avant ---- */
  // UI.bars('#id',{series:[{name,data:[],color}], mode:'grouped'|'stacked', style:'solid'|'pill', highlight:6, height:180})
  function bars(target, o) {
    o = Object.assign({ mode: 'grouped', style: 'solid', grid: 'h' }, o);
    var S = o.series;
    return mount(target, o, function (s, w, h) {
      var n = S[0].data.length, stacked = o.mode === 'stacked', pill = o.style === 'pill';
      var dmax = stacked ? Math.max.apply(null, S[0].data.map(function (_, i) { return sum(S.map(function (d) { return d.data[i]; })); })) : seriesMax(S);
      var A = axes(s, w, h, o, n, 'band', dmax);
      var band = A.f.iw / n, gap = 3;
      var bw = o.barWidth || Math.max(4, Math.min(pill ? 22 : 12, band * (pill ? .38 : .2)));
      var gw = stacked ? bw : S.length * bw + (S.length - 1) * gap;
      var g = el('g', { 'class': 'ch-bars' }, s);
      function rect(x, y, hh, fill, i, label) {
        var r = el('rect', { x: x, y: y, width: bw, height: Math.max(0, hh), rx: Math.min(bw / 2, Math.max(0, hh) / 2), fill: fill }, g);
        r.style.setProperty('--i', i); if (label) tip(r, label); return r;
      }
      for (var i = 0; i < n; i++) {
        var x0 = A.X(i) - gw / 2;
        if (stacked) {
          if (pill || o.track) rect(x0, A.Y(A.sc.max), A.base - A.Y(A.sc.max), 'var(--track)', i);
          if (pill) {
            var bottom = A.base;
            S.forEach(function (se) {
              var hh = Math.max(bw, A.base - A.Y(se.data[i])), y = bottom - hh;
              var vide = !(se.data[i] > 0), fc = vide ? col(/^(indigo|red|amber|green|sky)$/.test(se.color) ? se.color + '-soft' : 'indigo-soft') : col(se.color);   // une valeur à zéro : pastille pâle, pas une fausse mesure
              rect(x0, y, hh, fc, i, (se.name || '') + ' ' + se.data[i]); bottom = y - gap;
            });
          } else {
            for (var k = S.length - 1; k >= 0; k--) {
              var cum = sum(S.slice(0, k + 1).map(function (d) { return d.data[i]; }));
              rect(x0, A.Y(cum), A.base - A.Y(cum), col(S[k].color), i, (S[k].name || '') + ' ' + S[k].data[i]);
            }
          }
        } else {
          S.forEach(function (se, k) {
            var v = se.data[i], fill = col(se.color);
            if (o.highlight != null && S.length === 1) fill = i === o.highlight ? col(o.highlightColor || se.color) : col(o.dimColor || 'indigo-soft');
            var y = A.Y(v);
            rect(x0 + k * (bw + gap), y, A.base - y, fill, i, (se.name || '') + ' ' + v);
          });
        }
      }
    });
  }

  /* ---- Aires : superposées ou empilées, avec ou sans contour ---- */
  // UI.area('#id',{series:[{data,color,line?}], smooth:true, stacked:false, line:false, bleed:false})
  function area(target, o) {
    o = Object.assign({ grid: 'h', smooth: true, opacity: 1 }, o);
    var S = o.series;
    return mount(target, o, function (s, w, h) {
      var n = S[0].data.length;
      var data = S.map(function (x) { return x.data; });
      if (o.stacked) data = data.map(function (d, k) { return d.map(function (v, i) { return sum(S.slice(0, k + 1).map(function (z) { return z.data[i]; })); }); });
      var A = axes(s, w, h, o, n, 'point', Math.max.apply(null, [].concat.apply([], data)));
      var g = el('g', {}, s);
      var order = S.map(function (_, k) { return k; }); if (o.stacked) order.reverse();
      order.forEach(function (k) {
        var pts = data[k].map(function (v, i) { return [A.X(i), A.Y(v)]; });
        var d = o.smooth ? smoothPath(pts) : linePath(pts);
        var a = pts[0], b = pts[pts.length - 1];
        el('path', { 'class': 'ch-area', d: d + 'L' + b[0] + ',' + A.base + 'L' + a[0] + ',' + A.base + 'Z', fill: col(S[k].color), 'fill-opacity': S[k].opacity != null ? S[k].opacity : o.opacity }, g);
        if (o.line || S[k].line) el('path', { 'class': 'ch-line', d: d, fill: 'none', stroke: col(S[k].line || S[k].color), 'stroke-width': o.lineWidth || 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g);
      });
    });
  }

  /* ---- Courbes : droites ou lissées ---- */
  // UI.lines('#id',{series:[{data,color}], smooth:true, width:2, dots:false, grid:'h'|'both'|'none'})
  function lines(target, o) {
    o = Object.assign({ grid: 'h', smooth: false, width: 2, dots: false }, o);
    var S = o.series;
    return mount(target, o, function (s, w, h) {
      var n = S[0].data.length;
      var A = axes(s, w, h, o, n, 'point', seriesMax(S));
      var g = el('g', {}, s);
      S.forEach(function (se) {
        var pts = se.data.map(function (v, i) { return [A.X(i), A.Y(v)]; });
        el('path', { 'class': 'ch-line', d: o.smooth ? smoothPath(pts) : linePath(pts), fill: 'none', stroke: col(se.color), 'stroke-width': o.width, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g);
        if (o.dots) pts.forEach(function (p) { el('circle', { cx: p[0], cy: p[1], r: 3, fill: 'var(--surface)', stroke: col(se.color), 'stroke-width': 2 }, g); });
      });
    });
  }

  // Mini courbe sans axes : UI.spark('#id',{data:[…],color:'green'})
  function spark(target, o) {
    return lines(target, { series: [{ data: o.data, color: o.color }], smooth: true, bleed: true, width: o.width || 1.6, yMin: o.yMin != null ? o.yMin : Math.min.apply(null, o.data) * .9, height: o.height });
  }

  // Données sinusoïdales (valeurs 0..1) pour courbes « onde ».
  function wave(n, p) {
    p = Object.assign({ cycles: 4, phase: 0, amp: 1, base: .5, decay: 0 }, p);
    return Array.apply(null, Array(n)).map(function (_, i) {
      var t = i / (n - 1);
      return p.base + .5 * p.amp * Math.sin(t * p.cycles * 2 * Math.PI + p.phase) * (1 - p.decay * t);
    });
  }

  /* ---- Anneaux ---- */
  // UI.ring('#id',{value:47,color:'red',track:'red-soft',inner:.42,innerColor:'red',fill:'green-soft',stroke:8,text:'47%',textColor:'#fff'})
  function ring(target, o) {
    o = Object.assign({ value: 50, color: 'indigo', track: 'indigo-soft' }, o);
    return mount(target, o, function (s, w, h) {
      var size = Math.min(w, h), cx = w / 2, cy = h / 2;
      var sw = o.stroke || Math.max(3, size * .07), r = size / 2 - sw / 2 - 1, C = 2 * Math.PI * r;
      if (o.fill) el('circle', { cx: cx, cy: cy, r: r, fill: col(o.fill) }, s);
      el('circle', { cx: cx, cy: cy, r: r, fill: 'none', stroke: col(o.track), 'stroke-width': sw }, s);
      if (o.inner) el('circle', { cx: cx, cy: cy, r: size / 2 * o.inner, fill: col(o.innerColor || o.color) }, s);
      var arc = el('circle', { cx: cx, cy: cy, r: r, fill: 'none', stroke: col(o.color), 'stroke-width': sw, 'stroke-linecap': 'round', transform: 'rotate(-90 ' + cx + ' ' + cy + ')', 'class': 'ch-arc' }, s);
      arc.style.strokeDasharray = '0 ' + C;
      requestAnimationFrame(function () { requestAnimationFrame(function () { arc.style.strokeDasharray = (C * Math.min(100, o.value) / 100) + ' ' + C; }); });
      if (o.text !== false) {
        var t = el('text', { 'class': 'ch-value', x: cx, y: cy, 'text-anchor': 'middle', 'dominant-baseline': 'central', 'font-size': o.fontSize || size * (o.inner ? .17 : .19), fill: col(o.textColor || (o.inner ? '#fff' : 'var(--ink)')) }, s);
        t.textContent = o.text != null ? o.text : Math.round(o.value) + '%';
      }
    });
  }

  // Anneaux concentriques : UI.rings('#id',{values:[100,100,100],colors:['amber','red','indigo']})
  function rings(target, o) {
    o = Object.assign({ values: [100, 100, 100], colors: ['amber', 'red', 'indigo'] }, o);
    return mount(target, o, function (s, w, h) {
      var size = Math.min(w, h), cx = w / 2, cy = h / 2, sw = o.stroke || size * .08, gap = o.gap != null ? o.gap : sw * .55;
      o.values.forEach(function (v, i) {
        var r = size / 2 - sw / 2 - 1 - i * (sw + gap), C = 2 * Math.PI * r;
        if (o.track) el('circle', { cx: cx, cy: cy, r: r, fill: 'none', stroke: col(o.colors[i] + '-soft'), 'stroke-width': sw }, s);
        var arc = el('circle', { cx: cx, cy: cy, r: r, fill: 'none', stroke: col(o.colors[i]), 'stroke-width': sw, 'stroke-linecap': v >= 100 ? 'butt' : 'round', transform: 'rotate(-90 ' + cx + ' ' + cy + ')', 'class': 'ch-arc' }, s);
        arc.style.strokeDasharray = '0 ' + C;
        requestAnimationFrame(function () { requestAnimationFrame(function () { arc.style.strokeDasharray = (C * Math.min(100, v) / 100) + ' ' + C; }); });
      });
    });
  }

  // Camembert : UI.pie('#id',{values:[1,1,1],colors:['amber','red','indigo'],start:-90})
  function pie(target, o) {
    o = Object.assign({ values: [1, 1, 1], colors: ['amber', 'red', 'indigo'], start: -90 }, o);
    return mount(target, o, function (s, w, h) {
      var size = Math.min(w, h), cx = w / 2, cy = h / 2, r = size / 2 - 1, total = sum(o.values), a0 = o.start * Math.PI / 180;
      o.values.forEach(function (v, i) {
        var a1 = a0 + v / total * 2 * Math.PI;
        var p = function (a) { return (cx + r * Math.cos(a)) + ',' + (cy + r * Math.sin(a)); };
        var d = v / total >= .9999 ? 'M' + (cx - r) + ',' + cy + 'a' + r + ',' + r + ' 0 1 0 ' + 2 * r + ',0a' + r + ',' + r + ' 0 1 0 ' + (-2 * r) + ',0'
          : 'M' + cx + ',' + cy + 'L' + p(a0) + 'A' + r + ',' + r + ' 0 ' + (a1 - a0 > Math.PI ? 1 : 0) + ' 1 ' + p(a1) + 'Z';
        var path = el('path', { d: d, fill: col(o.colors[i]) }, s); tip(path, String(v));
        a0 = a1;
      });
    });
  }

  // Barres horizontales HTML : UI.hbars('#id',{rows:[{label,value}],max:100,color:'red',axis:['01','02'],thick:true})
  function hbars(target, o) {
    var host = $(target); if (!host) return;
    host.classList.add('hbars');
    host.innerHTML = o.rows.map(function (r) {
      return '<div class="hbars__row"><span>' + esc(r.label) + '</span><i class="bar' + (o.thick ? ' bar--thick' : '') + '" style="--c:' + col(r.color || o.color || 'red') + ';--v:' + (r.value / (o.max || 100) * 100) + '%"></i></div>';
    }).join('') + (o.axis ? '<div class="hbars__axis">' + o.axis.map(function (a) { return '<span>' + esc(a) + '</span>'; }).join('') + '</div>' : '');
  }

  // Grille vide : UI.chartGrid('#id',{lines:'h'|'hv'|'v', rows:[…], cols:[…]})
  function chartGrid(target, o) {
    o = Object.assign({
      lines: 'h',
      rows: ['700', '600', '500', '400', '300', '200', '100'],
      cols: Array.apply(null, Array(12)).map(function (_, i) { return (i + 1) + '/12'; })
    }, o);
    return mount(target, o, function (s, w, h) {
      var f = { l: o.rowLabelWidth || 36, r: 8, t: 8, b: 26 }; f.iw = w - f.l - f.r; f.ih = h - f.t - f.b;
      var g = el('g', { 'class': 'ch-grid' }, s);
      o.rows.forEach(function (t, i) {
        var y = f.t + f.ih * i / (o.rows.length - 1);
        if (o.lines.indexOf('h') > -1) el('line', { x1: f.l, x2: f.l + f.iw, y1: y, y2: y }, g);
        el('text', { 'class': 'ch-label', x: f.l - 8, y: y + 3.5, 'text-anchor': 'end', text: t }, g);
      });
      o.cols.forEach(function (t, j) {
        var x = f.l + f.iw * j / (o.cols.length - 1);
        if (o.lines.indexOf('v') > -1) el('line', { x1: x, x2: x, y1: f.t, y2: f.t + f.ih }, g);
        el('text', { 'class': 'ch-label', x: x, y: h - 6, 'text-anchor': 'middle', text: t }, g);
      });
    });
  }

  /* ------------------------------------------------------------------ *
   *  Divers
   * ------------------------------------------------------------------ */
  function ranges(root) {
    (root || document).querySelectorAll('.range input[type=range]').forEach(function (inp) {
      var out = inp.dataset.out ? document.querySelector(inp.dataset.out) : null;
      var set = function () {
        inp.parentElement.style.setProperty('--v', ((inp.value - inp.min) / (inp.max - inp.min) * 100) + '%');
        if (out) out.textContent = (inp.dataset.prefix || '') + inp.value;
      };
      inp.addEventListener('input', set); set();
    });
  }

  function tabs(root) {
    (root || document).querySelectorAll('[data-tabs]').forEach(function (g) {
      g.addEventListener('click', function (e) {
        var b = e.target.closest('button,a'); if (!b || !g.contains(b)) return;
        Array.prototype.forEach.call(g.children, function (c) { c.classList.remove('is-active'); });
        b.classList.add('is-active');
      });
    });
  }

  // <div data-avatars="AL,BM,CK" data-add></div>  → pile d'avatars
  function avatars(root) {
    (root || document).querySelectorAll('[data-avatars]').forEach(function (n) {
      n.classList.add('avatars');
      var s = n.dataset.size ? ' style="--s:' + n.dataset.size + 'px"' : '';
      n.innerHTML = n.dataset.avatars.split(',').map(function (t, i) { return '<span class="avatar avatar--' + (i % 6 + 1) + '"' + s + '>' + esc(t.trim()) + '</span>'; }).join('') +
        (n.hasAttribute('data-add') ? '<span class="avatar avatar--add"' + s + '>' + icon('plus', 'i--sm') + '</span>' : '');
    });
  }

  function init(root) { sprite(); ranges(root); tabs(root); avatars(root); }

  global.UI = {
    bars: bars, area: area, lines: lines, spark: spark, wave: wave, ring: ring, rings: rings, pie: pie, hbars: hbars, chartGrid: chartGrid,
    ranges: ranges, tabs: tabs, avatars: avatars,
    icon: icon, sprite: sprite, icons: ICONS, init: init, esc: esc
  };
})(window);
