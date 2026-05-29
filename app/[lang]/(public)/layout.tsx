import Header from "./components/header"; // Ajusta o caminho se necessário
import Footer from "./components/Footer"; // Ajusta o caminho se necessário
import { getDictionary } from "../../../lib/getDictionary";
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
export default async function PublicLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang as "pt" | "en");

  return (
    // min-h-screen + flex-col garante que o layout cobre o ecrã todo
    <div className="flex flex-col min-h-screen">
      
      <Header dict={dict} lang={lang} />

      {/* flex-grow faz com que esta main empurre o footer para o fundo */}
      <main className="flex-grow">
        {children}
      </main>
      
      <Footer dict={dict} lang={lang} />
    </div>
  );
}