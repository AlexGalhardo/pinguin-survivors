import { expect, test } from 'bun:test';
import { buildLabel } from '../src/ui/version-footer';

test('footer shows the SemVer build, tagged in dev', () => {
	expect(buildLabel('2.0.0-alpha.1', false)).toBe('v2.0.0-alpha.1');
	expect(buildLabel('2.0.0-alpha.1', true)).toBe('v2.0.0-alpha.1 (dev)');
});
