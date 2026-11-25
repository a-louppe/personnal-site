import { bootGame } from './index';

const root = document.querySelector<HTMLElement>('#app');
if (root) {
  root.textContent = bootGame();
}
