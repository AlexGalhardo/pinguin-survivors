// Release notes in the vukem style (https://github.com/AlexGalhardo/vukem/releases):
// Keep a Changelog groups, one line per Conventional Commit with a bold scope and a commit link.
// Every micro-commit since the last tag is listed, like a rebase merge (docs/workflow.md §6):
// docs, tests, build, CI and chores go under "Maintenance" instead of being dropped.
import { $ } from 'bun';

export const REPO_URL = 'https://github.com/AlexGalhardo/pinguin-survivors';

const GROUP_ORDER = [
	'Added',
	'Changed',
	'Deprecated',
	'Removed',
	'Fixed',
	'Security',
	'Maintenance',
] as const;
type Group = (typeof GROUP_ORDER)[number];

const TYPE_GROUP: Record<string, Group> = {
	feat: 'Added',
	fix: 'Fixed',
	perf: 'Changed',
	refactor: 'Changed',
	balance: 'Changed',
	revert: 'Removed',
	docs: 'Maintenance',
	test: 'Maintenance',
	build: 'Maintenance',
	ci: 'Maintenance',
	chore: 'Maintenance',
	style: 'Maintenance',
};

const SUBJECT_RE = /^(?<type>[a-z]+)(\((?<scope>[^)]+)\))?(?<bang>!)?:\s*(?<subject>.+)$/;

export interface CommitLine {
	group: Group;
	scope: string;
	subject: string;
	sha: string;
}

function capitalize(s: string): string {
	return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Parses `git log` lines ("<sha>\t<subject>") into grouped release lines. */
export function parseCommits(lines: string[]): CommitLine[] {
	const out: CommitLine[] = [];
	for (const line of lines) {
		const [sha, subject] = line.split('\t', 2);
		if (!sha || !subject) continue;
		const m = SUBJECT_RE.exec(subject.trim());
		if (!m?.groups) continue;
		const type = m.groups.type ?? '';
		const text = m.groups.subject ?? '';
		// The release commit itself (`chore(release): X.Y.Z`) is not a change.
		if (type === 'chore' && (m.groups.scope === 'release' || text.startsWith('release')))
			continue;
		const group = m.groups.bang ? 'Changed' : TYPE_GROUP[type];
		if (!group) continue;
		out.push({
			group,
			scope: m.groups.scope ?? 'repo',
			subject: capitalize(text),
			sha: sha.slice(0, 7),
		});
	}
	return out;
}

export function formatBody(commits: CommitLine[], repoUrl = REPO_URL): string {
	const parts: string[] = [];
	for (const group of GROUP_ORDER) {
		const items = commits.filter((c) => c.group === group);
		if (items.length === 0) continue;
		parts.push(`### ${group}\n`);
		for (const c of items) {
			parts.push(`- **${c.scope}:** ${c.subject} ([${c.sha}](${repoUrl}/commit/${c.sha}))`);
		}
		parts.push('');
	}
	return parts.join('\n').trim();
}

/** Returns the body of a `## [version]` section from CHANGELOG.md, or null. */
export function changelogSection(changelog: string, version: string): string | null {
	const start = changelog.indexOf(`## [${version}]`);
	if (start < 0) return null;
	const rest = changelog.slice(start);
	const nl = rest.indexOf('\n');
	const afterHeading = rest.slice(nl + 1);
	const next = afterHeading.search(/^## \[/m);
	const body = (next < 0 ? afterHeading : afterHeading.slice(0, next)).trim();
	return body.replace(/^\[.*$/gm, '').trim() || null;
}

/** Notes for the commits in (from, to]; falls back to the CHANGELOG section when no commit qualifies. */
export async function releaseNotes(
	from: string | null,
	to: string,
	version: string,
): Promise<string> {
	const range = from ? `${from}..${to}` : to;
	const log = await $`git log --no-merges --format=%H%x09%s ${range}`.text();
	const commits = parseCommits(log.split('\n'));
	const body = formatBody(commits);
	if (body) return body;
	const changelog = await Bun.file('CHANGELOG.md').text();
	return changelogSection(changelog, version) ?? '_No notable changes._';
}
