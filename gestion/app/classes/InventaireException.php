<?php
/**
 * Erreur « métier » : le message est écrit en français et peut être montré tel quel à l'utilisateur.
 * Toute autre exception est considérée comme un bogue et n'est jamais affichée.
 */
class InventaireException extends RuntimeException
{
	/** @var string|null champ fautif (pour surligner un champ de formulaire) */
	public $champ;

	public function __construct($message, $champ = null)
	{
		parent::__construct($message);
		$this->champ = $champ;
	}
}
