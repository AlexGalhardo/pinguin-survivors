import { expect, test } from 'bun:test';
import { formatBody, parseCommits } from '../scripts/lib/release-notes';

test('release notes list every micro-commit, grouped, and skip only the release commit', () => {
	const lines = [
		'aaaaaaa1\tfeat(tree): ranked nodes',
		'bbbbbbb2\tfix(art): boss sprite',
		'ccccccc3\tbalance(danger): easier Danger 0',
		'ddddddd4\tdocs(release): micro-commits',
		'eeeeeee5\ttest(sim): bot buys potions',
		'fffffff6\tbuild(site): full game at /play/',
		'ggggggg7\tchore(release): 0.5.0',
		'hhhhhhh8\tnot a conventional commit',
	];
	const commits = parseCommits(lines);
	expect(commits.map((c) => c.sha)).toEqual([
		'aaaaaaa',
		'bbbbbbb',
		'ccccccc',
		'ddddddd',
		'eeeeeee',
		'fffffff',
	]);
	const body = formatBody(commits, 'https://example.test');
	expect(body.indexOf('### Added')).toBeLessThan(body.indexOf('### Maintenance'));
	expect(body).toContain('- **danger:** Easier Danger 0');
	expect(body).toContain('- **site:** Full game at /play/');
});
