"use client";

import { useEffect } from "react";

export function HtmlLangProvider({ locale }: { locale: string }) {
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return null;
}
