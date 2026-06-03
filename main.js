import { initNavigation, loadHome } from './router';
import { loadSurprises } from './sections/conversations';

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  loadHome(); // Load the home section on initial page load
  loadSurprises();
});
