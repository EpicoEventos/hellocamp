import Link from "next/link";
import LanguageSwitcher from "./LanguageSwitcher";
import AuthButton from "./AuthButton";

export default function Header({ dict, lang }: { dict: any, lang: string }) {
  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-100 font-sans box-border shadow-sm">
      <div className="max-w-[1280px] mx-auto px-4 py-3 md:py-4 md:px-8">
        <div className="flex flex-wrap items-center justify-between">

          {/* 1. LADO ESQUERDO: LOGOTIPO EM TEXTO PERSONALIZADO */}
          <Link href={`/${lang}`} className="text-2xl font-extrabold tracking-tight no-underline flex-shrink-0">
            <span className="text-gray-900">Hello</span>
            {/* Cor atualizada para um amarelo mais vibrante e luminoso */}
            <span className="text-[#EBA914]">Camp</span>
          </Link>

          {/* 2. IDIOMA (MOBILE) - Encostado à direita na linha do Logo */}
          <div className="ml-auto flex items-center md:hidden">
            <LanguageSwitcher lang={lang} />
          </div>

          {/* 3. ÁREA DE BOTÕES - 2ª linha no Mobile, Mesma linha no Desktop */}
          {/* No mobile: w-full e mt-3 atiram isto para a linha de baixo. justify-end encosta tudo à direita. */}
          <div className="w-full flex items-center justify-end mt-3 md:w-auto md:mt-0 gap-3 md:gap-6">
            
            {/* IDIOMA (DESKTOP) - Escondido no mobile porque já está lá em cima */}
            <div className="hidden md:flex items-center">
              <LanguageSwitcher lang={lang} />
            </div>

            {/* SEPARADOR VERTICAL (DESKTOP) */}
            <div className="hidden md:block w-px h-5 bg-gray-200"></div>

            {/* BOTÕES DE AUTH / PARCEIRO */}
            <div className="flex items-center">
              <AuthButton lang={lang} dict={dict} />
            </div>

          </div>

        </div>
      </div>
    </header>
  );
}