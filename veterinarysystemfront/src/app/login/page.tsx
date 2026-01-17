import { LoginForm } from "@/app/login/components/login-form";

/**
 * Página de Login con fondo veterinario pastel.
 * - SIN Math.random en el render (usa PRNG con seed fijo) → evita hydration mismatch.
 * - Reemplaza montañas/colinas por huellas y siluetas de animales.
 */
export default function LoginPage() {
  return (
    <div className="relative min-h-svh overflow-hidden">
      {/* Fondo pastel base */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-emerald-100 via-cyan-100 to-teal-100" />
      <VetBackground />

      {/* Contenido centrado */}
      <div className="relative mx-auto flex min-h-svh max-w-7xl items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-md md:max-w-2xl">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}

/** PRNG determinístico (LCG) para posiciones repetibles entre SSR/CSR */
function createPRNG(seed = 123456789) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

/** Fondo SVG con cielo, estrellas determinísticas, huellitas y animales */
function VetBackground() {
  const rnd = createPRNG(42);

  // Generar estrellas determinísticas
  const stars = Array.from({ length: 70 }).map((_, i) => {
    const cx = Math.floor(rnd() * 1440);
    const cy = Math.floor(rnd() * 420);
    const r = 0.6 + rnd() * 2;
    const opacity = 0.5 + rnd() * 0.4;
    return { key: i, cx, cy, r, opacity };
  });

  // Generar huellitas determinísticas (posición baja)
  const paws = Array.from({ length: 26 }).map((_, i) => {
    const x = Math.floor(rnd() * 1400) + 10;
    const y = 560 + Math.floor(rnd() * 260); // franja inferior
    const scale = 0.7 + rnd() * 0.8;
    const rotate = Math.floor(rnd() * 50) - 25;
    const opacity = 0.15 + rnd() * 0.2;
    return { key: i, x, y, scale, rotate, opacity };
  });

  return (
    <svg
      className="absolute inset-0 -z-10 h-full w-full opacity-90"
      viewBox="0 0 1440 900"
      aria-hidden
      role="img"
    >
      {/* Cielo */}
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#CFFAFE" />
          <stop offset="100%" stopColor="#A7F3D0" />
        </linearGradient>

        {/* Degradé de “suelo” suave */}
        <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#99F6E4" />
          <stop offset="100%" stopColor="#6EE7B7" />
        </linearGradient>

        {/* Sombra suave para huellas */}
        <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="0.8" />
        </filter>
      </defs>

      <rect width="1440" height="900" fill="url(#sky)" />

      {/* Luna/Sol suave */}
      <circle cx="1120" cy="180" r="42" fill="#ffffff" opacity="0.9" />

      {/* Estrellas determinísticas */}
      {stars.map((s) => (
        <circle key={s.key} cx={s.cx} cy={s.cy} r={s.r} fill="#ffffff" opacity={s.opacity} />
      ))}

      {/* Suelo: banda inferior con bordes ondulados suaves */}
      <path
        d="M0,620 C220,590 360,640 540,630 C720,620 900,660 1100,640 C1260,625 1350,650 1440,640 L1440,900 L0,900 Z"
        fill="url(#ground)"
        opacity="0.9"
      />
      <path
        d="M0,700 C260,680 440,700 620,690 C840,675 1000,720 1220,705 C1340,696 1390,705 1440,705 L1440,900 L0,900 Z"
        fill="#5EEAD4"
        opacity="0.85"
      />

      {/* Huellas (paw prints) estilizadas y discretas */}
      {paws.map((p) => (
        <g
          key={p.key}
          transform={`translate(${p.x}, ${p.y}) rotate(${p.rotate}) scale(${p.scale})`}
          opacity={p.opacity}
          filter="url(#soft)"
        >
          {/* almohadilla grande */}
          <ellipse cx="0" cy="0" rx="16" ry="12" fill="#0f766e" />
          {/* deditos */}
          <circle cx="-12" cy="-14" r="5.5" fill="#115e59" />
          <circle cx="-3.5" cy="-18" r="5" fill="#115e59" />
          <circle cx="4" cy="-18" r="5" fill="#115e59" />
          <circle cx="12" cy="-14" r="5.5" fill="#115e59" />
        </g>
      ))}

      {/* Siluetas de animales (perro, gato, ave) en el horizonte, tono suave */}
      {/* Perro (izquierda) */}
      <g transform="translate(220, 640) scale(1.4)" opacity="0.28" fill="#0f766e">
        {/* cuerpo */}
        <ellipse cx="0" cy="20" rx="60" ry="28" />
        {/* cabeza */}
        <circle cx="-58" cy="0" r="18" />
        {/* hocico */}
        <ellipse cx="-72" cy="4" rx="10" ry="6" />
        {/* oreja */}
        <path d="M-58,-16 C-66,-28 -50,-30 -48,-16 Z" />
        {/* cola */}
        <path d="M54,16 C70,0 86,8 78,22 C68,34 58,28 54,16 Z" />
        {/* patas */}
        <rect x="-28" y="36" width="8" height="18" rx="3" />
        <rect x="8" y="36" width="8" height="18" rx="3" />
      </g>

      {/* Gato (centro) */}
      <g transform="translate(760, 660) scale(1.25)" opacity="0.26" fill="#115e59">
        {/* cuerpo */}
        <ellipse cx="0" cy="16" rx="48" ry="24" />
        {/* cabeza */}
        <circle cx="-40" cy="-2" r="16" />
        {/* orejas */}
        <path d="M-50,-12 L-44,-22 L-38,-12 Z" />
        <path d="M-32,-12 L-26,-22 L-20,-12 Z" />
        {/* cola */}
        <path d="M44,14 C68,0 84,20 66,30 C54,36 46,24 44,14 Z" />
        {/* patas */}
        <rect x="-16" y="30" width="6" height="16" rx="2" />
        <rect x="6" y="30" width="6" height="16" rx="2" />
      </g>

      {/* Ave (derecha) */}
      <g transform="translate(1220, 610) scale(1.1)" opacity="0.22" fill="#0e7490">
        {/* cuerpo */}
        <ellipse cx="0" cy="0" rx="24" ry="16" />
        {/* ala */}
        <path d="M-6,0 C-26,-6 -34,-20 -18,-24 C-4,-26 6,-14 -6,0 Z" />
        {/* pico */}
        <path d="M24,-2 L34,2 L24,6 Z" />
        {/* patitas */}
        <rect x="-4" y="14" width="3" height="8" rx="1" />
        <rect x="2" y="14" width="3" height="8" rx="1" />
      </g>
    </svg>
  );
}
