# DS Deck Studio

**Active Recall Studio** — Aplicación de flashcards con repetición espaciada para aprender Data Science. SPA offline-first con sincronización en la nube via Supabase.

## Stack

- **Vite** + **React 18** + **TypeScript**
- **Tailwind CSS** + **shadcn-ui** (Radix UI)
- **Zustand** (estado local + `localStorage` via `persist`)
- **Supabase** (auth + sync en la nube)
- **TanStack Query**
- **Vitest** (tests)

## Funcionalidades

- Flashcards con frente, reverso, ejemplo de código y respuesta corta
- Algoritmo **SM-2** de repetición espaciada (ease factor, intervalo, próximo repaso)
- **Quick Quiz** — modo de opción múltiple cronometrado
- Dashboard con heatmap de actividad, dominio por categoría y timeline de repasos
- Sync bidireccional con Supabase al hacer login
- Soporte multiidioma **EN / ES**
- Tema claro / oscuro
- Importar / exportar mazos en JSON
- Paleta de comandos (`Ctrl+K`)

## Inicio rápido

```bash
# Instalar dependencias
npm install

# Servidor de desarrollo (puerto 8080)
npm run dev

# Build de producción
npm run build

# Preview del build
npm run preview
```

## Comandos útiles

```bash
npm run lint        # ESLint
npm run test        # Vitest (una vez)
npm run test:watch  # Vitest en modo watch
```

## Variables de entorno

Crea un archivo `.env` en la raíz con las credenciales de tu proyecto Supabase:

```env
VITE_SUPABASE_URL=https://<tu-proyecto>.supabase.co
VITE_SUPABASE_ANON_KEY=<tu-anon-key>
```

## Arquitectura

```
src/
├── components/       # UI compartida (TopBar, Sidebar, modales…)
│   └── ui/           # Primitivos shadcn-ui
├── contexts/         # AuthContext, LanguageContext
├── hooks/            # useSupabaseSync
├── i18n/             # translations.ts (EN/ES)
├── integrations/
│   └── supabase/     # client.ts, types.ts
├── pages/            # Dashboard, Study, QuickQuiz, AllCards, AddCard, Settings, Auth
├── store/
│   └── useDeckStore.ts  # Zustand store principal
└── utils/
    └── sm2.ts           # Algoritmo SM-2
```

### Flujo de datos

1. **Local** — Zustand store persiste tarjetas, racha y sesiones en `localStorage`.
2. **Cloud** — `useSupabaseSync` carga datos al hacer login y hace upsert/delete en cada cambio.
3. **Routing** — todo es una SPA; la navegación se gestiona con `activeNav` en el store (sin React Router para las rutas internas).

### Esquema de tarjeta

```ts
interface Flashcard {
  id: string;
  category: DSCategory;
  subcategory: string;
  front: string;
  back: string;
  shortAnswer?: string;   // respuesta breve para Quick Quiz
  codeExample?: string;   // snippet de código
  difficulty: "beginner" | "intermediate" | "advanced";
  tags: string[];
  created: string;
  lastReviewed?: string;
  nextReview?: string;
  // SM-2
  repetitions: number;
  easeFactor: number;
  interval: number;
}
```

## Tablas Supabase

| Tabla | Descripción |
|---|---|
| `flashcards` | Tarjetas del usuario |
| `study_sessions` | Historial de sesiones de estudio |
| `user_settings` | Preferencias (idioma, tema…) |
