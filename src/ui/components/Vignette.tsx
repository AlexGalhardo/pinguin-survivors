import type { ReactElement } from 'react';

/** Static screen vignette (docs/design-system.md section 3.4): one per screen, never interactive. */
export function Vignette(): ReactElement {
	return <div aria-hidden="true" data-vignette className="d-vignette" />;
}
