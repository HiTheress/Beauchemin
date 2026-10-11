<?php
// Mascotte : le réservoir de propane qui rebondit (animation de chargement et page de connexion).
// Le logo « B » est le vrai logo vectoriel de Beauchemin. Aucune image externe, aucun script.
function mascotte_html() { ?>
<div class="mc" aria-hidden="true">
  <div class="mc-ombre"></div>
  <div class="mc-reservoir">
    <div class="mc-tank">
      <div class="mc-couvercle"></div>
      <div class="mc-col"></div>
      <div class="mc-corps">
        <div class="mc-joint" style="top:184px"></div>
        <div class="mc-yeux"></div>
        <div class="mc-etiquette">
          <svg class="mc-logo" viewBox="2.8 5 61 39.5" xmlns="http://www.w3.org/2000/svg"><path fill="#71c66e" stroke="#71c66e" stroke-width=".5" stroke-linejoin="round" d="M3.7,5.7 H28.8 V27 L13,24.8 C8,20.5 4.2,14 3.7,5.7 Z"/><path fill="#83d1ee" stroke="#83d1ee" stroke-width=".5" stroke-linejoin="round" d="M13,24.8 C8,28.5 4.2,35 3.7,43.8 H28.8 V24 Z"/><path fill="#1cb9ad" d="M13,24.7 C17,22.3 23,20.1 29,19.8 V30.8 C23,30.7 17,28.3 13,24.7 Z"/><path fill="#044c92" fill-rule="evenodd" d="M32.2,6.9 Q32.2,5.5 33.6,5.5 H50.5 C57.5,5.5 61.7,9.3 61.7,14.8 C61.7,18.5 60.3,20.8 58.3,22.6 Q57.6,23.4 58.3,24.2 C60.5,25.8 63.1,28.4 63.1,33.2 C63.1,40 57.2,44 50.5,44 H33.6 Q32.2,44 32.2,42.6 Z M43,14.3 H48.2 C50.3,14.3 51.5,15.3 51.5,17.3 C51.5,19.3 50,20.4 48,20.4 H43 Q42.2,20.4 42.2,19.6 V15.1 Q42.2,14.3 43,14.3 Z M43,29.1 H49.6 C52,29.1 53.3,30.6 53.2,32.4 C53.1,34.4 51.4,35.6 49.2,35.6 H43 Q42.2,35.6 42.2,34.8 V29.9 Q42.2,29.1 43,29.1 Z"/></svg>
          <div class="mc-p">PROPANE</div>
          <div class="mc-tel">514 990-1901</div>
        </div>
      </div>
      <div class="mc-anse mc-g"></div>
      <div class="mc-anse mc-d"></div>
      <div class="mc-pied"></div>
    </div>
  </div>
</div>
<?php }
