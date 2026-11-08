import { createRoot } from 'react-dom/client';
import { App } from './App';
import { loadUiAtlases } from './atlas';
import './theme.css';

export function mountUi(root: HTMLElement | null): void {
	if (!root) throw new Error('#ui container missing from index.html');
	void loadUiAtlases();
	createRoot(root).render(<App />);
}
