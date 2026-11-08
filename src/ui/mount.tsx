import { createRoot } from 'react-dom/client';
import { App } from './App';
import './theme.css';

export function mountUi(root: HTMLElement | null): void {
	if (!root) throw new Error('#ui container missing from index.html');
	createRoot(root).render(<App />);
}
