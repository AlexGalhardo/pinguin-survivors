import { expect, test } from 'bun:test';
import { formatBody, insertRelease, parseCommits } from '../scripts/lib/release-notes';

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

test('insertRelease puts the generated notes under the new version section', () => {
	const changelog = '# CHANGELOG\n\n## [Unreleased]\n\n## [0.1.0] - 2026-01-01\n\n### Added\n';
	const out = insertRelease(changelog, '0.2.0', '2026-02-02', '### Fixed\n\n- **ui:** Thing');
	expect(out).toBe(
		'# CHANGELOG\n\n## [Unreleased]\n\n## [0.2.0] - 2026-02-02\n\n### Fixed\n\n- **ui:** Thing\n\n## [0.1.0] - 2026-01-01\n\n### Added\n',
	);
});

test('insertRelease keeps hand-written Unreleased text inside the new version', () => {
	const changelog = '## [Unreleased]\n\n### Added\n\n- By hand\n\n## [0.1.0] - 2026-01-01\n';
	const out = insertRelease(changelog, '0.2.0', '2026-02-02', '### Fixed\n\n- Generated');
	expect(out).toBe(
		'## [Unreleased]\n\n## [0.2.0] - 2026-02-02\n\n### Added\n\n- By hand\n\n### Fixed\n\n- Generated\n\n## [0.1.0] - 2026-01-01\n',
	);
});

test('insertRelease never leaves the section empty', () => {
	const out = insertRelease(
		'## [Unreleased]\n\n## [0.1.0] - 2026-01-01\n',
		'0.2.0',
		'2026-02-02',
		'_No notable changes._',
	);
	expect(out).toContain('## [0.2.0] - 2026-02-02\n\n_No notable changes._\n\n## [0.1.0]');
});

test('insertRelease merges a group that both the hand-written text and the commits have', () => {
	const changelog =
		'## [Unreleased]\n\n### Fixed\n\n- By hand\n\n### Added\n\n- New by hand\n\n## [0.1.0] - 2026-01-01\n';
	const out = insertRelease(
		changelog,
		'0.2.0',
		'2026-02-02',
		'### Fixed\n\n- From a commit\n\n### Maintenance\n\n- Chore',
	);
	expect(out).toBe(
		'## [Unreleased]\n\n## [0.2.0] - 2026-02-02\n\n### Added\n\n- New by hand\n\n### Fixed\n\n- By hand\n- From a commit\n\n### Maintenance\n\n- Chore\n\n## [0.1.0] - 2026-01-01\n',
	);
	expect(out.match(/### Fixed/g)).toHaveLength(1);
});
