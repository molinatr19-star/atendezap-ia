export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "atendezap-theme";

/**
 * Executado no <head> antes da primeira pintura para evitar o "flash" de tema errado.
 * Usa a preferência salva; sem preferência, segue o sistema operacional.
 * Padrão recomendado em node_modules/next/dist/docs (guia preventing-flash-before-hydration).
 */
export const themeInitScript = `(function(){try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");if(t!=="light"&&t!=="dark"){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.setAttribute("data-theme",t)}catch(e){}})()`;
