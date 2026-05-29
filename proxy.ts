import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const locales = ["pt", "en"];
const defaultLocale = "pt";

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. REGRA DE OURO: Ignorar imediatamente todas as rotas de API (Stripe, Mailgun, etc.)
  if (pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // 2. Verifica se o URL já tem um idioma (ex: /pt/pesquisa ou /en/sobre)
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (pathnameHasLocale) return;

  // 3. Se não tiver (ex: /pesquisa), redireciona para o idioma padrão (/pt/pesquisa)
  request.nextUrl.pathname = `/${defaultLocale}${pathname}`;
  return NextResponse.redirect(request.nextUrl);
}

// A configuração mantém-se, mas adicionei a exceção para a "api"
export const config = {
  matcher: [
    '/((?!api|_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
  ],
};