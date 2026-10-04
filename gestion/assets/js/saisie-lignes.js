/* Composant partagé : saisie d'une liste de lignes (pièce + quantité [+ coût]) au scanner ou à la souris.
 * Utilisé par réception, transfert, sortie, ajustement, facture interne.  Chargé avec page_script('assets/js/saisie-lignes.js')
 * AVANT le script de la page.
 *
 *   var sl = SaisieLignes.creer({
 *     conteneur: '#lignes',            // où insérer le tableau
 *     scan: '#scan',                   // champ de scan (optionnel) : scanner un code de pièce ajoute/incrémente une ligne
 *     recherche: '#recherche',         // <select> pour la recherche par nom/code (optionnel, devient un select2)
 *     coutColonne: false,              // true : colonne « Coût unitaire » saisissable (réception)
 *     coutObligatoire: true,           // avec coutColonne : refuse une ligne sans coût
 *     signe: false,                    // true : quantités négatives permises (ajustement)
 *     emplacementSource: function () { return idEmplacementOuNull; },   // affiche « Disponible » et signale les dépassements
 *     coutParDefaut: function (piece) { return Promise.resolve('12.34'); },  // préremplit le coût (ou null)
 *     onEmplacement: function (emp) { ... },  // un code d'emplacement (EMP-…) a été scanné (sinon : erreur claire)
 *     onChange: function (lignes) { ... },
 *     vide: 'Scannez une pièce ou cherchez-la ci-dessus.'
 *   });
 *   sl.lignes()   -> [{piece_id, quantite, cout_unitaire?}]   (chaînes ; le serveur accepte virgule ou point)
 *   sl.valider()  -> null ou message d'erreur en français (vérification de confort ; le serveur reste l'autorité)
 *   sl.vider(), sl.focus(), sl.rafraichir(), sl.compter(), sl.ajouterParCode(code) -> Promise
 */
(function (w, $) {
  'use strict';

  function el(tag, attrs, texte) {
    var e = document.createElement(tag);
    if (attrs) { Object.keys(attrs).forEach(function (k) { if (k === 'class') { e.className = attrs[k]; } else { e.setAttribute(k, attrs[k]); } }); }
    if (texte !== undefined && texte !== null) { e.textContent = texte; }
    return e;
  }
  function num(s) { var n = parseFloat(String(s).replace(/\s/g, '').replace(',', '.')); return isNaN(n) ? null : n; }

  function creer(opts) {
    var racine = typeof opts.conteneur === 'string' ? document.querySelector(opts.conteneur) : opts.conteneur;
    var lignes = [];            // {piece, quantite, cout}
    var cache = {};             // code -> détail de la pièce (avec stock)
    var tbody, vide, table;

    function construire() {
      racine.innerHTML = '';
      table = el('table', { class: 'table table-sm table-striped mb-0' });
      var thead = el('thead'), tr = el('tr');
      var cols = [['Code', ''], ['Pièce', '']];
      if (opts.emplacementSource) { cols.push(['Disponible', 'nombre']); }
      cols.push(['Quantité', 'nombre']);
      if (opts.coutColonne) { cols.push(['Coût unitaire', 'nombre']); cols.push(['Total', 'nombre']); }
      cols.push(['', '']);
      cols.forEach(function (c) { tr.appendChild(el('th', { class: c[1] }, c[0])); });
      thead.appendChild(tr); table.appendChild(thead);
      tbody = el('tbody'); table.appendChild(tbody);
      racine.appendChild(table);
      vide = el('div', { class: 'text-muted text-center p-3' }, opts.vide || 'Scannez une pièce ou cherchez-la ci-dessus.');
      racine.appendChild(vide);
    }

    function dispo(piece) {
      var id = opts.emplacementSource ? opts.emplacementSource() : null;
      if (!id || !piece.stock) { return null; }
      var q = 0;
      piece.stock.forEach(function (s) { if (String(s.emplacement_id) === String(id)) { q = parseFloat(s.quantite); } });
      return q;
    }

    function totalLigne(l) {
      var q = num(l.quantite), c = num(l.cout);
      return (q === null || c === null) ? null : Math.round(q * c * 100) / 100;
    }

    function maj(silencieux) {
      // met à jour disponibles, totaux et avertissements sans reconstruire (garde le focus)
      lignes.forEach(function (l) {
        var d = dispo(l.piece), q = num(l.quantite);
        if (l.celDispo) {
          l.celDispo.textContent = d === null ? '' : w.fmtQte(String(d));
          l.celDispo.className = 'nombre' + ((d !== null && q !== null && q > d) ? ' text-danger font-weight-bold' : '');
        }
        if (l.celTotal) { var t = totalLigne(l); l.celTotal.textContent = t === null ? '' : w.fmtArgent(String(t)); }
        if (l.inQte) { var qn = num(l.quantite); l.inQte.classList.toggle('is-invalid', qn === null || (!opts.signe && qn <= 0) || (!!opts.signe && qn === 0)); }   // booléen strict : toggle(x, undefined) inverserait l'état
      });
      vide.style.display = lignes.length ? 'none' : '';
      table.style.display = lignes.length ? '' : 'none';
      if (opts.onChange && silencieux !== true) { opts.onChange(api.lignes()); }
    }

    function dessiner(l) {
      var tr = el('tr');
      tr.appendChild(el('td', { class: 'code' }, l.piece.code));
      var tdNom = el('td'); tdNom.appendChild(document.createTextNode(l.piece.nom));
      if (l.piece.unite && l.piece.unite !== 'unité') { tdNom.appendChild(el('small', { class: 'text-muted ml-1' }, '(' + l.piece.unite + ')')); }
      tr.appendChild(tdNom);
      if (opts.emplacementSource) { l.celDispo = el('td', { class: 'nombre' }); tr.appendChild(l.celDispo); }
      var tdQ = el('td', { class: 'nombre', style: 'width:120px' });
      l.inQte = el('input', { type: 'text', inputmode: 'decimal', class: 'form-control form-control-sm text-right', 'aria-label': 'Quantité de ' + l.piece.code, value: l.quantite });
      l.inQte.addEventListener('input', function () { l.quantite = l.inQte.value; maj(); });
      tdQ.appendChild(l.inQte); tr.appendChild(tdQ);
      if (opts.coutColonne) {
        var tdC = el('td', { class: 'nombre', style: 'width:130px' });
        l.inCout = el('input', { type: 'text', inputmode: 'decimal', class: 'form-control form-control-sm text-right', 'aria-label': 'Coût unitaire de ' + l.piece.code, value: l.cout || '' });
        l.inCout.addEventListener('input', function () { l.cout = l.inCout.value; maj(); });
        tdC.appendChild(l.inCout); tr.appendChild(tdC);
        l.celTotal = el('td', { class: 'nombre' }); tr.appendChild(l.celTotal);
      }
      var tdX = el('td', { class: 'text-right', style: 'width:50px' });
      var bx = el('button', { type: 'button', class: 'btn btn-sm btn-outline-danger', title: 'Retirer la ligne', 'aria-label': 'Retirer ' + l.piece.code });
      bx.appendChild(el('i', { class: 'fas fa-times' }));
      bx.addEventListener('click', function () { lignes.splice(lignes.indexOf(l), 1); tr.remove(); maj(); api.focus(); });
      tdX.appendChild(bx); tr.appendChild(tdX);
      l.tr = tr; tbody.appendChild(tr);
    }

    function ajouterPiece(piece, qte) {
      var q = qte === undefined ? '1' : String(qte);
      var ex = lignes.filter(function (l) { return l.piece.id === piece.id; })[0];
      if (ex) {
        var n = num(ex.quantite), a = num(q);
        ex.quantite = String(Math.round(((n === null ? 0 : n) + a) * 1000) / 1000);
        ex.inQte.value = ex.quantite;
        ex.tr.classList.add('table-success'); setTimeout(function () { ex.tr.classList.remove('table-success'); }, 600);
        maj(); return ex;
      }
      var l = { piece: piece, quantite: q, cout: '' };
      lignes.push(l); dessiner(l);
      if (opts.coutColonne && opts.coutParDefaut) {
        Promise.resolve(opts.coutParDefaut(piece)).then(function (c) { if (c !== null && c !== undefined && l.cout === '') { l.cout = String(c); l.inCout.value = l.cout; maj(); } }).catch(function () {});
      }
      l.tr.classList.add('table-success'); setTimeout(function () { l.tr.classList.remove('table-success'); }, 600);
      maj(); return l;
    }

    var api = {
      ajouterParCode: function (code) {
        return w.api.get('app/ajax/scan_code.php', { code: code }).then(function (r) {
          if (!r.trouve) { throw new Error('Code inconnu : « ' + code + ' ». Cette pièce n\'existe pas dans le catalogue.'); }
          if (r.type === 'emplacement') {
            if (opts.onEmplacement) { opts.onEmplacement(r.emplacement); return true; }
            throw new Error('« ' + r.emplacement.nom + ' » est un emplacement, pas une pièce.');
          }
          if (!r.piece.actif) { throw new Error('La pièce « ' + r.piece.code + ' » est désactivée.'); }
          cache[r.piece.code] = r.piece;
          ajouterPiece(r.piece, 1);
          return true;
        });
      },
      ajouterPiece: ajouterPiece,
      lignes: function () {
        return lignes.map(function (l) {
          var o = { piece_id: l.piece.id, quantite: String(l.quantite).trim() };
          if (opts.coutColonne && String(l.cout).trim() !== '') { o.cout_unitaire = String(l.cout).trim(); }
          return o;
        });
      },
      valider: function () {
        if (!lignes.length) { return 'Ajoutez au moins une pièce.'; }
        for (var i = 0; i < lignes.length; i++) {
          var l = lignes[i], q = num(l.quantite);
          if (q === null) { return 'Quantité invalide pour « ' + l.piece.code + ' ».'; }
          if (!opts.signe && q <= 0) { return 'La quantité de « ' + l.piece.code + ' » doit être supérieure à zéro.'; }
          if (opts.signe && q === 0) { return 'La variation de « ' + l.piece.code + ' » ne peut pas être zéro.'; }
          if (opts.coutColonne && opts.coutObligatoire !== false) {
            var c = num(l.cout);
            if (c === null || c < 0) { return 'Entrez le coût unitaire de « ' + l.piece.code + ' ».'; }
          }
        }
        return null;
      },
      vider: function () { lignes = []; tbody.innerHTML = ''; maj(); },
      rafraichir: maj,
      compter: function () { return lignes.length; },
      focus: function () { if (opts.scan) { var s = typeof opts.scan === 'string' ? document.querySelector(opts.scan) : opts.scan; if (s) { s.focus(); } } }
    };

    construire(); maj(true);   // pas d'onChange pendant la création : la page n'a pas encore reçu l'objet

    if (opts.scan) { w.scanner(opts.scan, function (code) { return api.ajouterParCode(code); }); }
    if (opts.recherche && $.fn.select2) {
      var $s = $(opts.recherche);
      $s.select2({
        placeholder: 'Chercher une pièce par nom ou code…', allowClear: true, minimumInputLength: 1,
        ajax: {
          url: 'app/ajax/pieces_recherche.php', dataType: 'json', delay: 200,
          data: function (p) { return { q: p.term || '' }; },
          processResults: function (d) { return { results: (d.pieces || []).map(function (p) { return { id: p.id, text: p.code + ' — ' + p.nom, code: p.code }; }) }; }
        }
      });
      $s.on('select2:select', function (e) {
        var code = e.params.data.code;
        $s.val(null).trigger('change');
        api.ajouterParCode(code).then(function () { w.bip(true); api.focus(); }).catch(function (err) { w.bip(false); w.toast(err.message, 'danger'); });
      });
    }
    return api;
  }

  w.SaisieLignes = { creer: creer };
})(window, jQuery);
