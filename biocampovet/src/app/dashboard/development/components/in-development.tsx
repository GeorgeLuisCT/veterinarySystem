// components/ui/in-development.tsx

"use client"

import {
  PawPrint,
  Hammer,
  Construction,
  Sparkles,
  AlertTriangle,
} from "lucide-react"

export default function InDevelopment() {
  return (
    <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-blue-100/40 via-white to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 rounded-xl shadow-lg px-6 py-10">
      <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 shadow-xl rounded-2xl p-8 max-w-2xl w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="relative inline-block">
            <div className="bg-indigo-100 dark:bg-indigo-800 p-4 rounded-full animate-bounce">
              <PawPrint className="h-8 w-8 text-indigo-600 dark:text-white" />
            </div>
            <Sparkles className="absolute -top-2 -right-2 h-5 w-5 text-yellow-400 animate-fade-in" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-indigo-700 dark:text-white">
          ¡Esta sección está en construcción!
        </h1>

        <p className="text-gray-600 dark:text-gray-300 text-base">
          Estamos creando esta parte del sistema veterinario para darte
          herramientas más completas. 🚧 Pronto estará lista para ayudarte a
          cuidar mejor a tus pacientes.
        </p>

        <div className="flex justify-center gap-6">
          <div className="flex flex-col items-center space-y-1">
            <Hammer className="h-10 w-10 text-yellow-500 animate-wiggle" />
            <span className="text-sm text-gray-500 dark:text-gray-400">En construcción</span>
          </div>
          <div className="flex flex-col items-center space-y-1">
            <Construction className="h-10 w-10 text-gray-400 dark:text-gray-600 animate-pulse" />
            <span className="text-sm text-gray-500 dark:text-gray-400">Zona cerrada</span>
          </div>
          <div className="flex flex-col items-center space-y-1">
            <AlertTriangle className="h-10 w-10 text-red-400 animate-shake" />
            <span className="text-sm text-gray-500 dark:text-gray-400">No disponible</span>
          </div>
        </div>

        <p className="text-sm italic text-muted-foreground mt-4">
          Vuelve pronto para ver todas las mejoras 🐾
        </p>
      </div>
    </div>
  )
}
