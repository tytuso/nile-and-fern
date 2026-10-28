import { createContext, useContext, useEffect, useState } from 'react';
import type { AnchorHTMLAttributes, ReactNode } from 'react';
const RouterContext = createContext({ path: '/', search: '', navigate: (_path: string) => {} });
export function Router({ children }: { children: ReactNode }) {
  const [location, setLocation] = useState({ path: window.location.pathname.replace(/\/$/, '') || '/', search: window.location.search });
  useEffect(() => { const handle = () => setLocation({path:window.location.pathname.replace(/\/$/, '') || '/',search:window.location.search}); window.addEventListener('popstate', handle); return () => window.removeEventListener('popstate', handle); }, []);
  const navigate = (next: string) => { if(next !== window.location.pathname) window.history.pushState({}, '', next); const url = new URL(next, window.location.href); setLocation({path:url.pathname.replace(/\/$/, '') || '/',search:url.search}); window.scrollTo({top:0, behavior:'instant'}); };
  return <RouterContext.Provider value={{ ...location, navigate }}>{children}</RouterContext.Provider>;
}
export const useRoute = () => useContext(RouterContext);
export function Link({ href, onClick, children, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  const { navigate } = useRoute();
  return <a href={href} {...props} onClick={e => {onClick?.(e);if(!e.defaultPrevented && href.startsWith('/') && !props.target && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey && e.button===0){e.preventDefault();navigate(href);}}}>{children}</a>;
}
