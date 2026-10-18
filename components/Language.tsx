'use client';
import {Children,cloneElement,createContext,isValidElement,useContext,useEffect,useState} from 'react';
import type {ReactNode,ReactElement} from 'react';
import {translateText} from '../lib/language-core.mjs';
type Language='ms'|'en';
const LanguageContext=createContext<{language:Language;setLanguage:(v:Language)=>void}>({language:'ms',setLanguage:()=>{}});
export function LanguageProvider({children}:{children:ReactNode}){
 const [language,setLanguage]=useState<Language>('ms');
 useEffect(()=>{try{const stored=localStorage.getItem('ti-language');if(stored==='en'||stored==='ms')setLanguage(stored)}catch{}},[]);
 useEffect(()=>{document.documentElement.lang=language},[language]);
 function change(v:Language){setLanguage(v);try{localStorage.setItem('ti-language',v)}catch{}}
 return <LanguageContext.Provider value={{language,setLanguage:change}}><div className="language-bar" role="group" aria-label="Bahasa / Language"><span>Bahasa / Language</span><button type="button" lang="ms" aria-pressed={language==='ms'} onClick={()=>change('ms')}>Bahasa Melayu</button><button type="button" lang="en" aria-pressed={language==='en'} onClick={()=>change('en')}>English</button></div>{children}</LanguageContext.Provider>
}
export function useLanguage(){const context=useContext(LanguageContext);return {...context,locale:context.language==='en'?'en-MY':'ms-MY',t:(value:any)=>translateText(value,context.language)}}
export function T({children}:{children:ReactNode}){const {t}=useLanguage();return <>{typeof children==='string'?t(children):children}</>}
export function LocalizedAttributes({children}:{children:ReactNode}){const {t}=useLanguage();const child=Children.only(children);if(!isValidElement(child))return <>{children}</>;const el=child as ReactElement<Record<string,any>>;const translated:Record<string,string>={};for(const key of ['alt','aria-label','title','placeholder'])if(typeof el.props[key]==='string')translated[key]=t(el.props[key]);return cloneElement(el,translated)}
export function translateCurrent(value:string){let language:Language='ms';try{if(localStorage.getItem('ti-language')==='en')language='en'}catch{}return translateText(value,language)}
