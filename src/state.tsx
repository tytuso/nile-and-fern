import { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Check, X } from 'lucide-react';
import { journeyIds } from './domain';
const Context=createContext({saved:[] as string[],toggleSaved:(_id:string)=>{},notify:(_message:string,_error=false)=>{},online:true});
export const useSite=()=>useContext(Context);
export function SiteProvider({children}:{children:ReactNode}) {
  const [saved,setSaved]=useState<string[]>(()=>{try{const data=JSON.parse(localStorage.getItem('nile-fern-saved-v1')||'[]');return Array.isArray(data)?data.filter(id=>journeyIds.includes(id)):[];}catch{return [];}});
  const [online,setOnline]=useState(navigator.onLine);
  const [toast,setToast]=useState<{message:string;error:boolean}|null>(null);
  const timer=useRef<ReturnType<typeof setTimeout>|null>(null);
  useEffect(()=>{const update=()=>setOnline(navigator.onLine);window.addEventListener('online',update);window.addEventListener('offline',update);return()=>{window.removeEventListener('online',update);window.removeEventListener('offline',update);};},[]);
  useEffect(()=>{try{localStorage.setItem('nile-fern-saved-v1',JSON.stringify(saved));}catch{}},[saved]);
  useEffect(()=>()=>{if(timer.current)clearTimeout(timer.current);},[]);
  const notify=(message:string,error=false)=>{if(timer.current)clearTimeout(timer.current);setToast({message,error});timer.current=setTimeout(()=>setToast(null),5000);};
  const toggleSaved=(id:string)=>{if(!journeyIds.includes(id as typeof journeyIds[number]))return;const exists=saved.includes(id);setSaved(current=>current.includes(id)?current.filter(item=>item!==id):[...current,id]);notify(exists?'Journey removed from your saved list.':'Saved. Your next journey is a little closer.');};
  return <Context.Provider value={{saved,toggleSaved,notify,online}}>{children}{toast&&<div className={'toast '+(toast.error?'error':'')} role={toast.error?'alert':'status'}>{toast.error?<X size={19}/>:<Check size={19}/>}<span>{toast.message}</span><button aria-label="Dismiss notification" onClick={()=>setToast(null)}><X size={18}/></button></div>}</Context.Provider>;
}
