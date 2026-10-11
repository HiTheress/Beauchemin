</div>
<!-- ./wrapper -->
<?php require_once __DIR__ . '/mascotte.php'; ?>
<div id="chargement" role="status" aria-live="polite" aria-label="Chargement"><?php mascotte_html(); ?><div class="chargement-texte">Chargement…</div></div>

<script src="plugins/jquery/jquery.min.js"></script>
<script src="plugins/bootstrap/js/bootstrap.bundle.min.js"></script>
<script src="plugins/overlayScrollbars/js/jquery.overlayScrollbars.min.js"></script>
<script src="dist/js/adminlte.min.js"></script>
<script src="plugins/datatables/jquery.dataTables.min.js"></script>
<script src="plugins/datatables-bs4/js/dataTables.bootstrap4.min.js"></script>
<script src="plugins/select2/js/select2.min.js"></script>
<script src="assets/js/app.js"></script>
<script src="assets/js/chargement.js"></script>
<?php if (!empty($page_scripts)) { foreach ($page_scripts as $s) { ?>
<script src="<?php echo e($s); ?>?v=<?php echo (int) @filemtime(__DIR__ . '/../' . $s); ?>"></script>
<?php } } ?>
</body>
</html>
