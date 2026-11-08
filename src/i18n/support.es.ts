/** Support items and the healing potion (SDD-014 RF-10..RF-23). */
export const supportEs = {
	'shop.kind.support': 'Apoyo',
	'shop.kind.healPotion': 'Poción de curación',
	'shop.outcome.supportNew': 'Nuevo objeto de apoyo, nivel 1: {stat}.',
	'shop.outcome.supportUp': 'Objeto de apoyo del nivel {from} al {to}: {stat}.',
	'shop.outcome.healPotion':
		'Llevas de {from} a {to} pociones de curación. Cada una cura {pct}% de la vida máx., se bebe sola al 50% de vida y empieza cada ronda vacía y llena una cada 100 bajas.',
	'support.magnetic.name': 'Magnético',
	'support.magnetic.desc': 'Atrae las bolas de XP y los Fish hacia ti.',
	'support.magnetic.stat': 'alcance de atracción +{v}',
	'support.swift.name': 'Botas veloces',
	'support.swift.desc': 'Corre más rápido.',
	'support.swift.stat': 'velocidad de movimiento +{v}',
	'support.lucky.name': 'Amuleto de la suerte',
	'support.lucky.desc': 'Más suerte con las rarezas de la tienda y los botines.',
	'support.lucky.stat': 'suerte +{v}',
	'support.level': 'Nv {n}/{max}',
	'hpotion.name': 'Poción de curación',
	'hpotion.desc':
		'Se bebe sola al 50% de vida. Cada ronda empieza vacía; cada 100 bajas llenan una.',
	'panel.support': 'APOYO',
	'panel.healPotion': '{charges}/{level} pociones · cura {pct}% · rareza {rarity}',
	'hud.potionKills': '{n}/{max} bajas',
	'hud.healPotion': 'Pociones de curación',
	'fx.potionUp': 'Poción rareza {r}',
} as const;
