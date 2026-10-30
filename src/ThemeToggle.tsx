import {useEffect,useState} from 'react';
import {Moon,Sun} from 'lucide-react';
export default function ThemeToggle(){
 const [theme,setTheme]=useState<'light'|'dark'>(()=>document.documentElement.dataset.theme==='dark'?'dark':'light');
 useEffect(()=>{document.documentElement.dataset.theme=theme;document.documentElement.style.colorScheme=theme;try{localStorage.setItem('fern-theme',theme);}catch{/* Optional preference storage. */}const meta=document.querySelector('meta[name="theme-color"]');meta?.setAttribute('content',theme==='dark'?'#101426':'#f8faff');},[theme]);
 return <button type="button" className="theme-toggle" aria-label={'Switch to '+(theme==='dark'?'light':'dark')+' mode'} title={'Switch to '+(theme==='dark'?'light':'dark')+' mode'} aria-pressed={theme==='dark'} onClick={()=>setTheme(t=>t==='dark'?'light':'dark')}>{theme==='dark'?<Sun size={18}/>:<Moon size={18}/>}</button>;
}
