# ScaffoldGen — Plan de desarrollo completo

> Generador de CRUDs full-stack para **React Web (SPA estática) + React Native/Expo + API REST en Node.js + PostgreSQL**.
> Deployable en Coolify. Frontend hosteable gratis (Netlify/Vercel/Cloudflare Pages).

---

## Arquitectura del sistema

```
scaffoldgen/
├── apps/
│   ├── web/          # SPA React + Vite + shadcn/ui (la app generadora)
│   └── api/          # Node.js + Express + Prisma (backend de la app generadora)
└── generator/        # Motor de templates (librería compartida)
    ├── templates/
    │   ├── web/      # Templates React Web (shadcn)
    │   └── native/   # Templates React Native (Expo)
    └── engine/       # Lógica de renderizado
```

**Stack del generador (la herramienta en sí):**
- Frontend: React + Vite + shadcn/ui + TypeScript
- Backend: Node.js + Express + Prisma + PostgreSQL
- Motor de templates: Handlebars
- Empaquetado: JSZip

**Stack del código generado:**
- Web: React + Vite + TypeScript + shadcn/ui + TanStack Query + React Hook Form + Zod
- Mobile: React Native + Expo + NativeWind + React Hook Form + Zod
- API generada: Node.js + Express + Prisma + PostgreSQL
- Auth: JWT

---

## FASE 0 — Setup del monorepo

### TASK-001: Inicializar monorepo con pnpm workspaces
- Crear `package.json` raíz con `workspaces: ["apps/*", "packages/*"]`
- Configurar pnpm
- Agregar `.gitignore`, `.npmrc`, `turbo.json` (opcional para builds)
- Crear carpetas: `apps/web`, `apps/api`, `packages/generator`

### TASK-002: Setup de `apps/api` (backend de ScaffoldGen)
- Inicializar proyecto Node.js + TypeScript
- Instalar: `express`, `prisma`, `@prisma/client`, `jsonwebtoken`, `bcryptjs`, `cors`, `dotenv`, `zod`
- Instalar dev: `typescript`, `ts-node-dev`, `@types/express`, `@types/node`
- Configurar `tsconfig.json`
- Crear `src/index.ts` con servidor Express básico
- Crear `Dockerfile` y `docker-compose.yml` para Coolify
- Crear `.env.example` con `DATABASE_URL`, `JWT_SECRET`, `PORT`

### TASK-003: Setup de `apps/web` (frontend de ScaffoldGen)
- Inicializar proyecto Vite + React + TypeScript
- Instalar shadcn/ui y configurarlo (`npx shadcn@latest init`)
- Instalar: `react-router-dom`, `@tanstack/react-query`, `axios`, `react-hook-form`, `zod`, `@hookform/resolvers`
- Instalar shadcn components: `button`, `input`, `label`, `select`, `dialog`, `table`, `badge`, `card`, `form`, `toast`, `tabs`, `dropdown-menu`
- Configurar proxy a API en `vite.config.ts`

### TASK-004: Setup de `packages/generator`
- Inicializar paquete TypeScript
- Instalar: `handlebars`, `jszip`, `prettier`
- Definir tipos TypeScript del schema (ver Fase 1)
- Exportar funciones principales: `generateProject(schema)`, `generateZip(files)`

---

## FASE 1 — Definición del Schema

### TASK-010: Definir tipos TypeScript del Schema de entidades

Crear `packages/generator/src/types/schema.ts`:

```typescript
export type FieldType =
  | 'string'
  | 'text'
  | 'number'
  | 'decimal'
  | 'boolean'
  | 'date'
  | 'datetime'
  | 'email'
  | 'url'
  | 'password'
  | 'image'
  | 'enum'
  | 'relation-one'    // belongsTo
  | 'relation-many';  // hasMany

export interface FieldDefinition {
  name: string;              // camelCase: "firstName"
  label: string;             // "First Name"
  type: FieldType;
  required: boolean;
  unique?: boolean;
  default?: string | number | boolean;
  enumValues?: string[];     // solo si type === 'enum'
  relationTarget?: string;   // nombre de la entidad relacionada
  showInList?: boolean;      // mostrar en tabla listado
  searchable?: boolean;      // incluir en búsqueda
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
}

export interface EntityDefinition {
  name: string;       // PascalCase: "BlogPost"
  namePlural: string; // "BlogPosts"
  slug: string;       // kebab-case: "blog-posts"
  fields: FieldDefinition[];
  softDelete?: boolean;
  timestamps?: boolean; // createdAt, updatedAt (default: true)
}

export interface ProjectSchema {
  projectName: string;
  projectSlug: string;
  apiUrl: string;        // donde correrá la API generada
  auth: boolean;         // generar sistema de auth
  entities: EntityDefinition[];
}
```

### TASK-011: Crear validador del schema con Zod
- Crear `packages/generator/src/validation/schemaValidator.ts`
- Validar que nombres de entidades sean PascalCase
- Validar que no haya entidades duplicadas
- Validar que relations apunten a entidades existentes
- Validar que enum fields tengan enumValues
- Exportar función `validateSchema(schema): ValidationResult`

### TASK-012: Crear utilidades de naming
Crear `packages/generator/src/utils/naming.ts` con funciones:
- `toCamelCase(str)` → `blogPost`
- `toPascalCase(str)` → `BlogPost`
- `toKebabCase(str)` → `blog-post`
- `toSnakeCase(str)` → `blog_post`
- `toPlural(str)` → pluralización básica en inglés
- `toHumanLabel(str)` → `"Blog Post"`

---

## FASE 2 — Motor de templates

### TASK-020: Estructura de templates y helpers de Handlebars
- Crear `packages/generator/src/engine/handlebars.ts`
- Registrar helpers:
  - `{{camelCase}}`, `{{pascalCase}}`, `{{kebabCase}}`, `{{snakeCase}}`
  - `{{#ifEq a b}}`, `{{#ifNot condition}}`
  - `{{#each fields}}` ya existe en HBS
  - `{{fieldToZod field}}` → convierte FieldDefinition a string Zod
  - `{{fieldToPrismaType field}}` → convierte FieldDefinition a tipo Prisma
  - `{{fieldToTSType field}}` → convierte a tipo TypeScript
  - `{{#isRelation field}}` → helper condicional

### TASK-021: Helper `fieldToZod`
Crear lógica que convierte un field a su validación Zod:
- `string` → `z.string()`
- `string` + required → `z.string().min(1)`
- `string` + maxLength → `z.string().max(100)`
- `email` → `z.string().email()`
- `url` → `z.string().url()`
- `number` → `z.number()`
- `decimal` → `z.number()`
- `boolean` → `z.boolean()`
- `date` → `z.coerce.date()`
- `enum` → `z.enum(['val1', 'val2'])`
- `relation-one` → `z.string().uuid()` (id de la relación)

### TASK-022: Helper `fieldToPrismaType`
- `string`, `email`, `url`, `password`, `image` → `String`
- `text` → `String @db.Text`
- `number` → `Int`
- `decimal` → `Decimal`
- `boolean` → `Boolean`
- `date`, `datetime` → `DateTime`
- `enum` → crear `enum EnumName { ... }` separado
- `relation-one` → `EntityName   entity   @relation(fields: [entityId], references: [id])`

---

## FASE 3 — Templates del API generado

> Todos los archivos son templates Handlebars (`.hbs`) que se renderizan por entidad.

### TASK-030: Template `prisma/schema.prisma`
- Crear `packages/generator/templates/api/prisma/schema.prisma.hbs`
- Generar datasource + generator
- Iterar sobre `entities` y generar cada model
- Incluir campos base: `id String @id @default(uuid())`, `createdAt`, `updatedAt`, `deletedAt` si softDelete
- Generar enums separados si hay fields de tipo enum
- Manejar relaciones one-to-many correctamente

### TASK-031: Template de router Express por entidad
Crear `packages/generator/templates/api/src/routes/entity.routes.ts.hbs`:
- `GET /{{slug}}` — listar con paginación y búsqueda
- `GET /{{slug}}/:id` — obtener uno
- `POST /{{slug}}` — crear
- `PUT /{{slug}}/:id` — actualizar
- `DELETE /{{slug}}/:id` — eliminar (soft o hard según config)
- Incluir middleware de auth si el proyecto tiene auth habilitado

### TASK-032: Template de controller por entidad
Crear `packages/generator/templates/api/src/controllers/entity.controller.ts.hbs`:
- Función `list`: paginación con `page` y `pageSize`, búsqueda en campos `searchable`, filtros básicos
- Función `getOne`: buscar por id, 404 si no existe
- Función `create`: validar con Zod, crear con Prisma
- Función `update`: validar, actualizar
- Función `remove`: soft delete si aplica
- Try/catch con manejo de errores consistente

### TASK-033: Template de schema Zod por entidad
Crear `packages/generator/templates/api/src/schemas/entity.schema.ts.hbs`:
- `CreateEntitySchema` — todos los campos requeridos/opcionales
- `UpdateEntitySchema` — todos los campos opcionales (para PATCH parcial)
- `EntityQuerySchema` — `page`, `pageSize`, `search`, `orderBy`, `orderDir`

### TASK-034: Template de index de rutas
Crear `packages/generator/templates/api/src/routes/index.ts.hbs`:
- Importar y registrar todas las rutas de entidades
- Ruta de health check: `GET /health`

### TASK-035: Templates de archivos estáticos del API
Crear templates (sin variables, copiados tal cual) para:
- `packages/generator/templates/api/src/middleware/auth.middleware.ts` — verificar JWT
- `packages/generator/templates/api/src/middleware/error.middleware.ts` — handler global de errores
- `packages/generator/templates/api/src/lib/prisma.ts` — singleton de PrismaClient
- `packages/generator/templates/api/src/lib/jwt.ts` — helpers sign/verify
- `packages/generator/templates/api/.env.example`
- `packages/generator/templates/api/Dockerfile`
- `packages/generator/templates/api/package.json.hbs`
- `packages/generator/templates/api/tsconfig.json`

### TASK-036: Templates de auth (si `schema.auth === true`)
- `POST /auth/register` — controller + router
- `POST /auth/login` — controller + router
- `GET /auth/me` — controller + router
- Template de modelo User en Prisma (email, password, role)

---

## FASE 4 — Templates del Web (React) generado

### TASK-040: Estructura base del proyecto web generado
Crear templates estáticos para:
- `packages/generator/templates/web/package.json.hbs` — con deps correctas
- `packages/generator/templates/web/vite.config.ts`
- `packages/generator/templates/web/tsconfig.json`
- `packages/generator/templates/web/index.html`
- `packages/generator/templates/web/src/main.tsx` — con QueryClientProvider, RouterProvider
- `packages/generator/templates/web/src/lib/axios.ts` — instancia con baseURL desde env
- `packages/generator/templates/web/src/lib/queryClient.ts`
- `packages/generator/templates/web/tailwind.config.js`
- `packages/generator/templates/web/components.json` — config shadcn
- Copiar componentes shadcn necesarios como archivos estáticos

### TASK-041: Template de tipos TypeScript por entidad
Crear `packages/generator/templates/web/src/types/entity.ts.hbs`:
- Interface `Entity` con todos los campos tipados
- Interface `CreateEntityDto`
- Interface `UpdateEntityDto`
- Interface `EntityListResponse` con `data`, `total`, `page`, `pageSize`

### TASK-042: Template de API service por entidad
Crear `packages/generator/templates/web/src/services/entity.service.ts.hbs`:
- `getAll(params)` — GET con query params de paginación/búsqueda
- `getOne(id)` — GET por id
- `create(data)` — POST
- `update(id, data)` — PUT
- `remove(id)` — DELETE

### TASK-043: Template de hooks TanStack Query por entidad
Crear `packages/generator/templates/web/src/hooks/useEntity.ts.hbs`:
- `useEntityList(params)` — useQuery para listar
- `useEntityOne(id)` — useQuery para uno
- `useCreateEntity()` — useMutation + invalidate list
- `useUpdateEntity()` — useMutation + invalidate list y detail
- `useDeleteEntity()` — useMutation + invalidate list + toast de confirmación

### TASK-044: Template de schema Zod del form (web)
Crear `packages/generator/templates/web/src/schemas/entity.schema.ts.hbs`:
- `createEntitySchema` usando Zod
- `updateEntitySchema`
- Exportar tipos inferidos: `CreateEntityInput`, `UpdateEntityInput`

### TASK-045: Template de página de listado
Crear `packages/generator/templates/web/src/pages/entity/EntityList.tsx.hbs`:
- Tabla con columnas de los campos marcados como `showInList: true`
- Paginación con controles prev/next + selector de página
- Campo de búsqueda debounced (300ms)
- Botón "Nuevo" que navega a `/entity/new`
- Botón editar por fila que navega a `/entity/:id/edit`
- Botón eliminar por fila con Dialog de confirmación
- Loading skeleton mientras carga
- Empty state si no hay datos
- Toast de éxito/error en acciones

### TASK-046: Template de página de creación/edición
Crear `packages/generator/templates/web/src/pages/entity/EntityForm.tsx.hbs`:
- Detectar si es nuevo o edición por presencia de `:id` en la ruta
- Si edición: cargar datos y prellenar form
- Form con React Hook Form + zodResolver
- Renderizar campo correcto según `field.type`:
  - `string`, `email`, `url` → `<Input />`
  - `text` → `<Textarea />`
  - `number`, `decimal` → `<Input type="number" />`
  - `boolean` → `<Switch />` o `<Checkbox />`
  - `date` → `<Input type="date" />`
  - `datetime` → `<Input type="datetime-local" />`
  - `password` → `<Input type="password" />` con toggle mostrar/ocultar
  - `enum` → `<Select />` con las opciones del enum
  - `image` → `<Input type="file" />` con preview
  - `relation-one` → `<Select />` con datos cargados de la entidad relacionada
- Botón submit con loading state
- Botón cancelar que vuelve al listado
- Mostrar errores de validación bajo cada campo
- Mostrar error de API si falla el submit

### TASK-047: Template de página de detalle (vista)
Crear `packages/generator/templates/web/src/pages/entity/EntityDetail.tsx.hbs`:
- Mostrar todos los campos en formato label/valor
- Botón editar
- Botón eliminar con confirmación
- Breadcrumb de navegación

### TASK-048: Template de router principal
Crear `packages/generator/templates/web/src/router.tsx.hbs`:
- Iterar sobre entidades y generar rutas:
  - `/{slug}` → EntityList
  - `/{slug}/new` → EntityForm (create)
  - `/{slug}/:id` → EntityDetail
  - `/{slug}/:id/edit` → EntityForm (edit)
- Si auth: rutas protegidas con PrivateRoute
- Rutas de auth: `/login`, `/register`

### TASK-049: Template de layout y navegación
Crear `packages/generator/templates/web/src/components/Layout.tsx.hbs`:
- Sidebar con links a cada entidad
- Header con nombre del proyecto
- Área de contenido principal
- Si auth: mostrar usuario y botón logout

---

## FASE 5 — Templates del Mobile (React Native/Expo) generado

### TASK-050: Estructura base del proyecto Expo generado
Crear templates estáticos para:
- `packages/generator/templates/native/package.json.hbs`
- `packages/generator/templates/native/app.json.hbs` — config de Expo con nombre del proyecto
- `packages/generator/templates/native/tsconfig.json`
- `packages/generator/templates/native/babel.config.js` — con nativewind
- `packages/generator/templates/native/tailwind.config.js` — con preset nativewind
- `packages/generator/templates/native/src/lib/axios.ts`
- `packages/generator/templates/native/src/lib/queryClient.ts`
- `packages/generator/templates/native/app/_layout.tsx.hbs` — Expo Router root layout con providers

### TASK-051: Template de tipos por entidad (native)
- Reusar o copiar desde web — mismos tipos
- Crear `packages/generator/templates/native/src/types/entity.ts.hbs` (idéntico al web)

### TASK-052: Template de API service por entidad (native)
- Idéntico al web en lógica, mismo template reutilizable

### TASK-053: Template de hooks TanStack Query (native)
- Mismo template que web, reutilizar `useEntity.ts.hbs`

### TASK-054: Template de pantalla de listado (native)
Crear `packages/generator/templates/native/app/(entity)/index.tsx.hbs`:
- `FlatList` con los campos `showInList`
- Cada item es un `TouchableOpacity` que navega al detalle
- Pull-to-refresh
- SearchBar de React Native
- Loading con `ActivityIndicator`
- Botón FAB para crear nuevo
- Empty state component

### TASK-055: Template de pantalla de formulario (native)
Crear `packages/generator/templates/native/app/(entity)/[id]/edit.tsx.hbs` y `new.tsx.hbs`:
- ScrollView con `KeyboardAvoidingView`
- React Hook Form + zodResolver
- Componentes por tipo de campo:
  - `string`, `email` → `TextInput` con estilos
  - `text` → `TextInput multiline`
  - `number` → `TextInput` con `keyboardType="numeric"`
  - `boolean` → `Switch` nativo
  - `date` → `@react-native-community/datetimepicker`
  - `enum` → Picker o modal con opciones
  - `image` → `expo-image-picker`
  - `relation-one` → Modal con listado para seleccionar
- Botón submit
- Manejo de errores con Alert nativo o toast

### TASK-056: Template de pantalla de detalle (native)
Crear `packages/generator/templates/native/app/(entity)/[id]/index.tsx.hbs`:
- ScrollView con todos los campos
- Botones editar y eliminar
- Confirmación con `Alert.alert` antes de eliminar

### TASK-057: Template de navegación (native)
Crear `packages/generator/templates/native/app/(tabs)/_layout.tsx.hbs`:
- Tabs con un tab por entidad (hasta 5 entidades)
- Si más de 5: usar drawer o stack
- Si auth: pantallas de login/register fuera de los tabs

---

## FASE 6 — Motor de generación

### TASK-060: Función principal `generateFiles(schema)`
Crear `packages/generator/src/engine/generator.ts`:
- Recibir `ProjectSchema`
- Renderizar todos los templates del API con Handlebars
- Renderizar todos los templates web
- Renderizar todos los templates native
- Retornar array de `{ path: string, content: string }`
- Por cada entidad, renderizar los templates de entidad

### TASK-061: Función `generateZip(files)`
Crear `packages/generator/src/engine/zipper.ts`:
- Recibir array de `{ path, content }`
- Usar JSZip para crear ZIP con estructura de carpetas
- Retornar `Buffer` del ZIP
- Estructura del ZIP:
  ```
  {projectSlug}/
  ├── api/
  ├── web/
  └── native/
  ```

### TASK-062: Función de generación de README
Crear `packages/generator/templates/README.md.hbs`:
- Instrucciones de instalación para cada parte (api, web, native)
- Variables de entorno necesarias
- Comandos para correr en desarrollo
- Instrucciones de deploy en Coolify

### TASK-063: Tests del motor de generación
- Crear schema de ejemplo con entidades variadas
- Test que `generateFiles` produce los archivos esperados
- Test que los archivos TypeScript generados son sintácticamente válidos (usar `tsc --noEmit` sobre el output)
- Test que el Prisma schema generado es válido (`prisma validate`)

---

## FASE 7 — Backend de ScaffoldGen (la app generadora)

### TASK-070: Schema de Prisma para ScaffoldGen
Crear `apps/api/prisma/schema.prisma`:
```prisma
model User {
  id        String    @id @default(uuid())
  email     String    @unique
  password  String
  createdAt DateTime  @default(now())
  projects  Project[]
}

model Project {
  id        String   @id @default(uuid())
  name      String
  slug      String
  schema    Json     // ProjectSchema completo
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### TASK-071: Endpoints de autenticación de ScaffoldGen
- `POST /auth/register` — crear cuenta
- `POST /auth/login` — retornar JWT
- `GET /auth/me` — datos del usuario autenticado
- Middleware `requireAuth` para proteger rutas

### TASK-072: Endpoints de proyectos
- `GET /projects` — listar proyectos del usuario
- `POST /projects` — crear proyecto con schema inicial vacío
- `GET /projects/:id` — obtener proyecto con schema completo
- `PUT /projects/:id` — actualizar schema del proyecto
- `DELETE /projects/:id` — eliminar proyecto

### TASK-073: Endpoint de generación y descarga
- `POST /projects/:id/generate` — ejecutar `generateZip(project.schema)`, retornar ZIP como `application/zip`
- Validar schema antes de generar
- Log de generaciones (opcional)

### TASK-074: Endpoint de preview/validación
- `POST /projects/:id/validate` — validar el schema y retornar errores si los hay
- `POST /generate/preview` — dado un schema, retornar listado de archivos que se generarían (sin descargar)

### TASK-075: Dockerización del API de ScaffoldGen
- `Dockerfile` multi-stage (build + runtime)
- `docker-compose.yml` con servicio `api` + `postgres`
- Variables de entorno documentadas
- Health check endpoint
- Instrucciones en README para deploy en Coolify

---

## FASE 8 — Frontend de ScaffoldGen (la app generadora)

### TASK-080: Setup de autenticación en el frontend
- Páginas `/login` y `/register`
- Context de auth con `useAuth` hook
- Guardar JWT en localStorage
- Axios interceptor para incluir token en requests
- Redirect a login si 401

### TASK-081: Dashboard — lista de proyectos
- Página `/` o `/projects`
- Mostrar proyectos del usuario en cards
- Botón "Nuevo proyecto"
- Acciones: abrir, eliminar

### TASK-082: Página de creación/edición de proyecto — info general
- Formulario con: nombre del proyecto, slug (auto-generado desde nombre), URL del API, habilitar auth
- Guardar y continuar

### TASK-083: Página del editor de entidades
- Panel izquierdo: lista de entidades creadas
- Botón "Nueva entidad"
- Panel derecho: editor de la entidad seleccionada
- Nombre de entidad, nombre plural
- Tabla de campos con columnas: nombre, tipo, requerido, showInList, searchable, acciones
- Botón "Añadir campo"

### TASK-084: Modal de creación/edición de campo
- Formulario con todos los atributos de `FieldDefinition`
- Selector de tipo con iconos descriptivos
- Mostrar/ocultar opciones según tipo:
  - Si `enum`: lista de valores (añadir/quitar)
  - Si `relation-*`: selector de entidad destino
  - Si string: min/maxLength
  - Si number: min/max
- Preview del campo Zod generado (opcional, nice-to-have)

### TASK-085: Vista previa del schema JSON
- Tab o drawer que muestra el JSON del schema actual
- Útil para debug y para entender la estructura
- Botón copiar

### TASK-086: Botón de descarga y generación
- Botón "Generar y descargar" en la página del proyecto
- Llamar a `POST /projects/:id/generate`
- Descargar el ZIP resultante
- Mostrar loading y mensajes de éxito/error
- Mostrar listado de archivos generados antes de descargar (opcional)

### TASK-087: Validaciones en el editor
- Mostrar errores inline si una entidad/campo tiene problemas
- Deshabilitar botón de generar si hay errores
- Mensajes de validación claros y accionables

---

## FASE 9 — Pulido y DX

### TASK-090: Proyecto de ejemplo incluido en el ZIP
- Generar un proyecto demo que el usuario pueda inspeccionar sin tener que correr el generador

### TASK-091: README detallado por proyecto generado
- Instrucciones paso a paso para hacer funcionar API, web y native
- Sección de cómo hacer deploy en Coolify
- Variables de entorno necesarias

### TASK-092: Manejo de migraciones en el API generado
- Incluir script `npm run db:migrate` en el `package.json` generado
- Incluir `prisma/seed.ts.hbs` con datos de ejemplo básicos
- Instrucciones en README

### TASK-093: Variables de entorno bien definidas
En el proyecto generado:
- `apps/api/.env.example`: `DATABASE_URL`, `JWT_SECRET`, `PORT`, `CORS_ORIGIN`
- `apps/web/.env.example`: `VITE_API_URL`
- `apps/native/.env.example`: `EXPO_PUBLIC_API_URL`

### TASK-094: Guía de contribución y arquitectura
- `ARCHITECTURE.md` explicando cómo añadir nuevos tipos de campo
- `CONTRIBUTING.md` para el proyecto ScaffoldGen en sí
- Comentarios en los templates explicando las partes clave

---

## Orden de implementación recomendado

1. **FASE 0** — Monorepo y setup base
2. **FASE 1** — Tipos y validación del schema
3. **FASE 2** — Motor de templates (helpers HBS)
4. **FASE 3** — Templates del API generado
5. **FASE 6** — Motor de generación + tests con JSON hardcodeado
6. **FASE 4** — Templates web generado
7. **FASE 5** — Templates native generado
8. **FASE 7** — Backend de ScaffoldGen
9. **FASE 8** — Frontend de ScaffoldGen
10. **FASE 9** — Pulido

> **Regla de oro:** Antes de construir la GUI (Fase 8), asegúrate de que dado un JSON a mano el generador produzca código que compila y corre. La GUI es solo un formulario que produce ese JSON.

---

## Schema de ejemplo para testear el motor

```json
{
  "projectName": "Blog App",
  "projectSlug": "blog-app",
  "apiUrl": "https://api.myblog.com",
  "auth": true,
  "entities": [
    {
      "name": "Category",
      "namePlural": "Categories",
      "slug": "categories",
      "timestamps": true,
      "softDelete": false,
      "fields": [
        { "name": "name", "label": "Name", "type": "string", "required": true, "unique": true, "showInList": true, "searchable": true, "maxLength": 100 },
        { "name": "description", "label": "Description", "type": "text", "required": false, "showInList": false }
      ]
    },
    {
      "name": "Post",
      "namePlural": "Posts",
      "slug": "posts",
      "timestamps": true,
      "softDelete": true,
      "fields": [
        { "name": "title", "label": "Title", "type": "string", "required": true, "showInList": true, "searchable": true, "maxLength": 200 },
        { "name": "content", "label": "Content", "type": "text", "required": true, "showInList": false },
        { "name": "status", "label": "Status", "type": "enum", "required": true, "showInList": true, "enumValues": ["draft", "published", "archived"] },
        { "name": "publishedAt", "label": "Published At", "type": "datetime", "required": false, "showInList": true },
        { "name": "category", "label": "Category", "type": "relation-one", "required": true, "relationTarget": "Category", "showInList": true }
      ]
    }
  ]
}
```
