import Link from "next/link";
import {
  ShieldCheck,
  Smartphone,
  Search,
  LifeBuoy,
  BarChart3,
  Bot,
  ArrowRight,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-white text-zinc-900">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-zinc-200 bg-white/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-blue-900">Nattiva</span>
          </div>
          <nav className="hidden gap-6 md:flex">
            <Link
              href="#features"
              className="text-sm font-medium hover:text-blue-600"
            >
              Características
            </Link>
            <Link
              href="#solutions"
              className="text-sm font-medium hover:text-blue-600"
            >
              Soluciones
            </Link>
            <Link
              href="#contact"
              className="text-sm font-medium hover:text-blue-600"
            >
              Contacto
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" className="text-blue-900 hover:text-blue-700">
                Iniciar Sesión
              </Button>
            </Link>
            <Link href="/register">
              <Button className="bg-blue-900 hover:bg-blue-800 text-white">
                Registrar Sindicato
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-slate-50 py-24 sm:py-32">
          <div className="container mx-auto px-4 md:px-6">
            <div className="mx-auto max-w-4xl text-center">
              <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl">
                Nattiva: Empoderando a la organización sindical a través de la{" "}
                <span className="text-blue-600">inteligencia</span> y la{" "}
                <span className="text-blue-600">tecnología</span>.
              </h1>
              <p className="mt-6 text-lg leading-8 text-slate-600">
                La plataforma multi-tenant de marca blanca que elimina el caos del
                padrón, cierra la brecha tecnológica y protege los datos de sus
                socios.
              </p>
              <div className="mt-10 flex items-center justify-center gap-x-6">
                <Link href="/login">
                  <Button size="lg" className="bg-blue-900 hover:bg-blue-800 text-white text-lg h-12 px-8">
                    Iniciar Sesión
                  </Button>
                </Link>
                <Link href="/register">
                  <Button
                    variant="outline"
                    size="lg"
                    className="text-blue-900 border-blue-900 hover:bg-blue-50 text-lg h-12 px-8"
                  >
                    Registrar Sindicato
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Pain Points Section */}
        <section id="solutions" className="py-24 sm:py-32 bg-white">
          <div className="container mx-auto px-4 md:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Resuelva los desafíos críticos de su sindicato
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                Tecnología diseñada específicamente para las necesidades de los
                dirigentes modernos.
              </p>
            </div>
            <div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {/* Card 1: Caos del Padrón */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 transition-all hover:shadow-lg">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                  <Search className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-xl font-semibold text-slate-900">
                  El Caos del Padrón
                </h3>
                <p className="text-slate-600">
                  Termine con las planillas desactualizadas. Utilice nuestro
                  buscador avanzado Server-Side y localización instantánea por RUT
                  o Email.
                </p>
              </div>

              {/* Card 2: Brecha Tecnológica */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 transition-all hover:shadow-lg">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                  <Smartphone className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-xl font-semibold text-slate-900">
                  Brecha Tecnológica
                </h3>
                <p className="text-slate-600">
                  Conecte con sus socios donde estén. Integración nativa con App
                  Móvil y experiencia de usuario simplificada para todas las
                  edades.
                </p>
              </div>

              {/* Card 3: Seguridad */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 transition-all hover:shadow-lg">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-xl font-semibold text-slate-900">
                  Seguridad Blindada
                </h3>
                <p className="text-slate-600">
                  Arquitectura Multi-Tenant con seguridad RLS (Row Level Security).
                  Sus datos están protegidos en una bóveda digital impenetrable.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Key Features Section */}
        <section id="features" className="bg-slate-900 py-24 sm:py-32 text-white">
          <div className="container mx-auto px-4 md:px-6">
            <div className="mx-auto max-w-2xl text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Funcionalidades de Clase Mundial
              </h2>
            </div>
            <div className="grid gap-12 lg:grid-cols-3">
              <div className="flex flex-col items-center text-center">
                <div className="mb-6 rounded-full bg-blue-600/20 p-4 text-blue-400">
                  <LifeBuoy className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-semibold">Mesa de Ayuda Centralizada</h3>
                <p className="mt-4 text-slate-400">
                  Gestione solicitudes y problemas de sus socios desde un único
                  panel de control eficiente y organizado.
                </p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="mb-6 rounded-full bg-blue-600/20 p-4 text-blue-400">
                  <BarChart3 className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-semibold">Analítica en Tiempo Real</h3>
                <p className="mt-4 text-slate-400">
                  Dashboards intuitivos para la toma de decisiones basada en datos.
                  Estadísticas de afiliación y beneficios al instante.
                </p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="mb-6 rounded-full bg-purple-600/20 p-4 text-purple-400">
                  <Bot className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-semibold">
                  Copiloto Nattiva AI <span className="ml-2 text-xs bg-purple-600 text-white py-0.5 px-2 rounded-full">Hito 18</span>
                </h3>
                <p className="mt-4 text-slate-400">
                  Su asistente inteligente experto en estatutos y leyes laborales.
                  Respuestas precisas y asistencia legal 24/7.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white py-12">
        <div className="container mx-auto flex flex-col items-center justify-between gap-6 px-4 md:flex-row md:px-6">
          <p className="text-sm text-slate-500">
            © 2025 Nattiva Sindicatos. Todos los derechos reservados.
          </p>
          <div className="flex gap-6">
            <Link href="#" className="text-sm text-slate-500 hover:text-blue-900">
              Privacidad
            </Link>
            <Link href="#" className="text-sm text-slate-500 hover:text-blue-900">
              Términos
            </Link>
            <Link href="#" className="text-sm text-slate-500 hover:text-blue-900">
              Contacto
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
