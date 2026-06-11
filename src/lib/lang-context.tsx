'use client'

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

export type Lang = 'en' | 'fr'

interface LangContextValue {
  lang: Lang
  setLang: (l: Lang) => void
}

const LangContext = createContext<LangContextValue>({ lang: 'en', setLang: () => {} })

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en')

  useEffect(() => {
    const saved = localStorage.getItem('invoicenudge_lang')
    if (saved === 'fr') setLangState('fr')
  }, [])

  function setLang(l: Lang) {
    setLangState(l)
    localStorage.setItem('invoicenudge_lang', l)
  }

  return <LangContext.Provider value={{ lang, setLang }}>{children}</LangContext.Provider>
}

export function useLang() {
  return useContext(LangContext)
}
