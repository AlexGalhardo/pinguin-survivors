/** Local achievements (D-43). Checked at the end of every run and on some events. */
export interface AchievementDef {
	id: string;
	name: string;
	desc: string;
	icon: string;
}

export const ACHIEVEMENTS: readonly AchievementDef[] = [
	{ id: 'first_steps', name: 'FIRST STEPS', desc: 'FINISH A RUN', icon: 'moveSpeed' },
	{
		id: 'exterminator',
		name: 'EXTERMINATOR',
		desc: 'KILL 500 ENEMIES IN ONE RUN',
		icon: 'damage',
	},
	{ id: 'survivor', name: 'SURVIVOR', desc: 'REACH WAVE 10', icon: 'maxHp' },
	{ id: 'veteran', name: 'VETERAN', desc: 'REACH WAVE 20', icon: 'armor' },
	{ id: 'legend', name: 'LEGEND', desc: 'REACH WAVE 30', icon: 'luck' },
	{ id: 'boss_slayer', name: 'BOSS SLAYER', desc: 'KILL A BOSS', icon: 'critChance' },
	{ id: 'evolution', name: 'EVOLUTION', desc: 'EVOLVE AN ABILITY', icon: 'abilityPower' },
	{ id: 'full_kit', name: 'FULL KIT', desc: 'OWN 6 ABILITIES', icon: 'projectiles' },
	{ id: 'hoarder', name: 'HOARDER', desc: 'EARN 1000 GOLD IN ONE RUN', icon: 'gold' },
	{
		id: 'all_rounder',
		name: 'ALL-ROUNDER',
		desc: 'FINISH A RUN WITH EVERY CLASS',
		icon: 'revive',
	},
];
