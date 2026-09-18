/**
 * Page-entry fade and rise, in CSS.
 *
 * This was a framer-motion component, which renders `opacity: 0` into the server HTML and only
 * fades in once the page's JavaScript has hydrated, so every page's content (including its LCP
 * element) stayed invisible until hydration plus 0.6s, and framer-motion loaded on every route
 * just for this. The same curve and distance as a CSS animation start at first paint and need no
 * JavaScript. A template remounts on each navigation, so the animation still replays; `exit`
 * never ran before (there was no AnimatePresence), so nothing is lost.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
