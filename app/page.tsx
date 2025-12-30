import Link from "next/link";
import { Users, BarChart3, Smartphone, ArrowRight, ShieldCheck, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900 font-sans">
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-blue-700 flex items-center justify-center">
              <span className="text-white font-bold text-lg">N</span>
            </div>
            <span className="text-xl font-bold text-slate-900">Nattiva CRM</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button className="bg-blue-700 hover:bg-blue-800 text-white font-medium">
                Ingresar al Portal
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-slate-50 py-24 sm:py-32 lg:pb-40">
          {/* Grids / Background Patterns could go here */}
          <div className="container relative mx-auto px-4 md:px-6">
            <div className="mx-auto max-w-4xl text-center">
              <div className="mx-auto mb-6 flex max-w-fit items-center justify-center space-x-2 overflow-hidden rounded-full border border-slate-200 bg-white px-7 py-2 shadow-md backdrop-blur transition-all hover:border-slate-300 hover:bg-white/50">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <p className="text-sm font-semibold text-slate-700">
                  Plataforma Oficial para Sindicatos
                </p>
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-6xl mb-6">
                Nattiva CRM: Gestión Inteligente para <span className="text-blue-700">Sindicatos</span>
              </h1>
              <p className="mt-6 text-lg leading-8 text-slate-600 max-w-2xl mx-auto">
                La plataforma integral de gestión sindical que combina automatización avanzada e Inteligencia Artificial.
                Simplifique la administración de su organización hoy mismo.
              </p>
              <div className="mt-10 flex items-center justify-center gap-x-6">
                <Link href="/login">
                  <Button size="lg" className="h-14 px-8 text-lg bg-blue-700 hover:bg-blue-800 shadow-xl shadow-blue-700/20">
                    Ingresar al Portal
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 bg-white sm:py-32">
          <div className="container mx-auto px-4 md:px-6">
            <div className="mx-auto max-w-2xl text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Todo lo que su sindicato necesita
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                Herramientas poderosas diseñadas para modernizar la gestión gremial.
              </p>
            </div>
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {/* Feature 1 */}
              <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:shadow-md group">
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-50 text-blue-700 group-hover:bg-blue-700 group-hover:text-white transition-colors">
                  <Users className="h-7 w-7" />
                </div>
                <h3 className="mb-3 text-xl font-semibold text-slate-900">Gestión de Socios</h3>
                <p className="text-slate-600 leading-relaxed">
                  Administre su padrón de socios de forma eficiente. Historial completo, control de beneficios y comunicación directa.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:shadow-md group">
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-purple-50 text-purple-700 group-hover:bg-purple-700 group-hover:text-white transition-colors">
                  <BarChart3 className="h-7 w-7" />
                </div>
                <h3 className="mb-3 text-xl font-semibold text-slate-900">Analítica con IA</h3>
                <p className="text-slate-600 leading-relaxed">
                  Tome decisiones informadas con reportes inteligentes impulsados por IA. Visualice tendencias y proyecciones financieras.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:shadow-md group">
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-green-50 text-green-700 group-hover:bg-green-700 group-hover:text-white transition-colors">
                  <Smartphone className="h-7 w-7" />
                </div>
                <h3 className="mb-3 text-xl font-semibold text-slate-900">Integración App Móvil</h3>
                <p className="text-slate-600 leading-relaxed">
                  Conexión nativa con GoodBarber. Mantenga a sus socios informados con noticias y notificaciones push en tiempo real.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Trust/Footer Strip */}
        <section className="border-t border-slate-200 bg-slate-50 py-12">
          <div className="container mx-auto px-4 text-center">
            <p className="text-sm font-medium text-slate-500 mb-6 uppercase tracking-wider">Potenciado con tecnología de vanguardia</p>
            <div className="flex justify-center items-center gap-8 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-slate-600" />
                <span className="font-semibold text-slate-700">Seguridad RLS</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-slate-600" />
                <span className="font-semibold text-slate-700">99.9% Uptime</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="container mx-auto flex flex-col items-center justify-between px-4 md:flex-row">
          <p className="text-sm text-slate-500">
            © 2025 Nattiva CRM. Todos los derechos reservados.
          </p>
          <div className="mt-4 flex space-x-6 md:mt-0">
            <Link href="#" className="text-sm text-slate-500 hover:text-blue-700">
              Soporte
            </Link>
            <Link href="#" className="text-sm text-slate-500 hover:text-blue-700">
              Privacidad
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
