// ECKY THUMP v2.0.0 shared browser helpers. No CDN, no build, no runtime dependencies.
export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[character]));
}
export function formatClock(milliseconds) {
  const seconds = Math.max(0, Math.ceil(milliseconds / 1000));
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}
export function serverClockOffset(serverNow, now = Date.now()) {
  return Number.isFinite(serverNow) ? serverNow - now : 0;
}
export function resolveAvatar(registry, id) {
  return registry.find(avatar => avatar.id === id) || registry[0] || null;
}
