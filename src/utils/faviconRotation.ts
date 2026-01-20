// Use main favicon - rotating favicons removed to avoid 404s
const FAVICONS = [
  '/favicon.png',
];

function getOrCreateFaviconLink(): HTMLLinkElement {
  let link = document.querySelector<HTMLLinkElement>("link[rel='icon']");
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  return link;
}

export function updateFavicon() {
  const hour = new Date().getHours();
  const index = hour % FAVICONS.length;
  const link = getOrCreateFaviconLink();
  link.type = 'image/png';
  link.href = FAVICONS[index];
}

export function initFaviconRotation() {
  // Set immediately on load
  updateFavicon();

  // Update once per hour (3600000 milliseconds)
  setInterval(updateFavicon, 60 * 60 * 1000);
}
