# Manual de Usuario — Sistema de Trazabilidad y Gestión de Pedidos
### Comunicación 6 · Estudio Creativo

---

> [!IMPORTANTE]
> Este manual describe el funcionamiento de todos los módulos de la aplicación. El acceso a cada módulo puede variar según el **rol asignado** a su usuario (Administrador, Ventas o Producción).

---

## Tabla de Contenidos

1. [Inicio de Sesión](#1-inicio-de-sesión)
2. [Navegación General](#2-navegación-general)
3. [Módulo: Dashboard (Panel de Control)](#3-módulo-dashboard-panel-de-control)
4. [Módulo: Cotizaciones](#4-módulo-cotizaciones)
5. [Módulo: Órdenes de Trabajo (OT)](#5-módulo-órdenes-de-trabajo-ot)
6. [Módulo: Herramientas y Analíticas](#6-módulo-herramientas-y-analíticas)
7. [Módulo: Ajustes del Sistema](#7-módulo-ajustes-del-sistema)
8. [Módulo: Mi Perfil](#8-módulo-mi-perfil)
9. [Monitor Kanban (Pantalla de Producción)](#9-monitor-kanban-pantalla-de-producción)
10. [Roles y Permisos](#10-roles-y-permisos)
11. [Preguntas Frecuentes](#11-preguntas-frecuentes)

---

## 1. Inicio de Sesión

La pantalla de inicio de sesión es el punto de entrada al sistema. Solo los usuarios registrados pueden acceder.

![Pantalla de inicio de sesión del sistema](C:\Users\mggma\.gemini\antigravity-ide\brain\f45dc909-31ca-4d9f-8830-1c100a36ebe5\login_page_1786992688302.png)

### Cómo iniciar sesión

1. Abra la aplicación en su navegador o dispositivo móvil.
2. En el campo **"Usuario o Correo Electrónico"**, ingrese su nombre de usuario (ej. `jperez`) **o** su correo completo (ej. `jperez@seis.com`).
3. En el campo **"Contraseña"**, ingrese su contraseña. Puede usar el ícono 👁 para mostrar u ocultar la contraseña.
4. Presione el botón **"Iniciar Sesión"**.

> [!NOTA]
> Si ingresa solo el nombre de usuario (sin `@`), el sistema le añade automáticamente el dominio `@seis.com`. Ambas formas son válidas.

> [!ADVERTENCIA]
> Si olvida su contraseña, contacte al administrador del sistema. No existe recuperación de contraseña automática por correo en esta versión.

---

## 2. Navegación General

Una vez autenticado, verá la barra de navegación inferior disponible en todas las pantallas. Esta barra cambia según su rol.

| Ícono | Sección | Visible para |
|-------|---------|-------------|
| 🏠 Inicio | Dashboard | Todos los roles |
| 📄 Cotizaciones | Módulo de Cotizaciones | Admin, Ventas |
| 💼 Órdenes | Órdenes de Trabajo | Todos los roles |
| 🔧 Herramientas | Herramientas y Analíticas | Todos los roles |
| ⚙️ Ajustes | Configuración del sistema | Solo Admin |

> [!NOTA]
> Los usuarios con rol **"Producción"** NO ven el módulo de Cotizaciones en su menú. Los usuarios que no son **Admin** no pueden acceder a Ajustes aunque intenten navegar directamente por la URL.

---

## 3. Módulo: Dashboard (Panel de Control)

El Dashboard es la pantalla principal al iniciar sesión. Proporciona una vista de alto nivel del estado general del negocio en tiempo real.

![Panel de control con KPIs y gráficos](C:\Users\mggma\.gemini\antigravity-ide\brain\f45dc909-31ca-4d9f-8830-1c100a36ebe5\dashboard_mockup_1786993008864.png)

### Componentes del Dashboard

#### Tarjetas KPI
Al tope de la pantalla se muestran 4 tarjetas con métricas clave:
- **Total Cotizaciones**: Número total de cotizaciones activas en el sistema.
- **Aprobadas**: Cotizaciones con estatus "Aprobada".
- **En Proceso**: Cotizaciones en etapas intermedias (Enviada, En Negociación).
- **OTs Activas**: Órdenes de trabajo no finalizadas.

#### Pestañas de Análisis
Debajo de los KPIs, dos pestañas alternan las métricas mostradas:

**Pestaña "Cotizaciones":**
- Gráfico de barras horizontales con la distribución de cotizaciones por estatus.
- Gráfico de pastel con porcentajes por estatus.
- **Top 5 Clientes**: Ranking de clientes por volumen de ventas aprobadas (solo cotizaciones con OT asociada).
- **Motivos de Rechazo**: Distribución de razones de rechazo.

**Pestaña "Órdenes de Trabajo":**
- Distribución de OTs por etapa (Programación, Producción, Revisión, Finalizado, Entregado).
- Gráfico de entrega a tiempo vs. con retraso.
- Tiempo de ciclo promedio por etapa.

> [!IMPORTANTE]
> Los gráficos de ranking de clientes **solo contabilizan** cotizaciones en estado "Aprobada" **con** una Orden de Trabajo (OT) generada. Las cotizaciones rechazadas o anuladas no se suman al volumen del cliente.

#### Accesos Rápidos
Botones de acceso directo para crear nuevas cotizaciones o ver OTs pendientes.

#### Botón "Volver Arriba"
Cuando desplaza la pantalla hacia abajo, aparece un botón flotante azul para regresar rápidamente al inicio.

---

## 4. Módulo: Cotizaciones

Este módulo gestiona el ciclo completo de las propuestas comerciales enviadas a los clientes.

![Listado de cotizaciones con filtros y acciones](C:\Users\mggma\.gemini\antigravity-ide\brain\f45dc909-31ca-4d9f-8830-1c100a36ebe5\cotizaciones_mockup_1786993031745.png)

### 4.1 Listado de Cotizaciones

Al ingresar al módulo verá la lista de cotizaciones activas (aquellas **sin** Orden de Trabajo asociada). Cada tarjeta muestra:

- **Número de cotización** (ej. `COT-2025-001`)
- **Nombre del cliente**
- **Estatus** con código de color
- **Monto total**
- **Días restantes** hasta la fecha de entrega (verde, amarillo, rojo o "Vencido")
- **Ejecutivo de cuenta asignado**
- Íconos de acción: ✏️ Editar, 📄 PDF, 🗑️ Eliminar

#### Estatus de Cotizaciones

| Estatus | Color | Significado |
|---------|-------|-------------|
| Borrador | Gris | Cotización en preparación, no enviada |
| Pendiente | Amarillo | Preparada, pendiente de acción |
| Enviada | Azul | Enviada al cliente |
| En Negociación | Naranja | En proceso de negociación activa |
| Aprobada | Verde | Aceptada por el cliente |
| Rechazada | Rojo | Rechazada por el cliente o internamente |
| Anulada | Gris oscuro | Cancelada internamente |

### 4.2 Buscar y Filtrar

- **Barra de búsqueda**: Busca por nombre de cliente o número de cotización.
- **Botón "Filtros"** (⚙️): Abre un panel lateral con filtros avanzados:
  - Filtro por **Cliente**
  - Filtro por **Fecha de inicio** y **Fecha fin**
  - Filtro por **Estatus**

> [!RECOMENDACIÓN]
> Use el filtro por estatus para encontrar rápidamente cotizaciones "Pendientes" que requieren seguimiento urgente.

### 4.3 Crear Nueva Cotización

Presione el botón **"+ Nueva Cotización"** (azul, esquina superior derecha).

![Formulario de creación de nueva cotización](C:\Users\mggma\.gemini\antigravity-ide\brain\f45dc909-31ca-4d9f-8830-1c100a36ebe5\cotizacion_form_mockup_1786993066572.png)

El formulario se organiza en secciones:

#### Sección: Información General

| Campo | Descripción |
|-------|-------------|
| **Cliente** | Seleccione el cliente del catálogo (búsqueda por nombre) |
| **Contacto** | Nombre del contacto en la empresa cliente |
| **Ejecutivo de Cuenta** | Se pre-rellena con el usuario actual |
| **Fecha de Emisión** | Fecha de creación de la cotización |
| **Fecha de Entrega** | Fecha estimada de entrega al cliente |
| **Condiciones de Pago** | Ej. "50% anticipo / 50% contra entrega" |
| **Descripción General** | Nota o descripción del proyecto |

#### Sección: Ítems de Cotización

Agregue uno o más ítems. Por cada ítem, complete:

| Campo | Descripción |
|-------|-------------|
| **Línea de Negocio** | Tipo de servicio (Audiovisual, Señalización, Streaming, etc.) |
| **Descripción** | Detalle técnico del servicio o producto |
| **Cantidad** | Número de unidades |
| **Precio Unitario ($)** | Precio en dólares |

El sistema calcula automáticamente:
- **Subtotal** = Suma de (Cantidad × Precio Unitario)
- **IVA (16%)** = 16% del subtotal
- **Total** = Subtotal + IVA

Presione **"+ Agregar Ítem"** para añadir más líneas.

#### Guardar la Cotización

- **"Guardar Borrador"**: Guarda sin asignar número definitivo.
- **"Guardar Cotización"**: Confirma y asigna el número de cotización.

> [!IMPORTANTE]
> Después de guardar, el sistema mostrará una notificación de confirmación indicando que los cambios se guardaron exitosamente.

### 4.4 Editar una Cotización

Presione el ícono ✏️ en la tarjeta de la cotización. Se abre el mismo formulario con los datos cargados.

> [!NOTA]
> Solo se puede editar libremente una cotización en estado **"Borrador"** o **"Pendiente"**. Para otras, editar puede requerir permisos especiales.

### 4.5 Cambiar el Estatus

Dentro del formulario de edición, puede actualizar el estatus usando el selector de estado. Los posibles cambios son:

```
Borrador → Pendiente → Enviada → En Negociación → Aprobada / Rechazada
                                                 → Anulada
```

Cuando cambia a **"Aprobada"**, el sistema registra automáticamente la fecha de aprobación.

Cuando cambia a **"Rechazada"**, debe seleccionar el **motivo de rechazo**:
- Rechazo Interno
- Rechazo por Parte del Cliente
- Rechazo Automático

Y puede añadir un **detalle adicional** de texto libre.

### 4.6 Generar PDF de la Cotización

Presione el ícono 📄 en la tarjeta de la cotización. El sistema genera automáticamente un PDF con:
- Encabezado con logo e información de la empresa
- Datos del cliente
- Tabla de ítems con precios
- Totales (Subtotal, IVA, Total)
- Condiciones de pago

El PDF se descarga automáticamente con el nombre `cotizacion_COT-XXX.pdf`.

### 4.7 Eliminar una Cotización

> [!ADVERTENCIA]
> Solo se pueden eliminar cotizaciones en estado **"BORRADOR"** o **"ANULADA"**. Si la cotización tiene cualquier otro estatus, se mostrará un aviso indicando que debe cambiar el estatus a "Anulada" primero.

1. Presione el ícono 🗑️ en la tarjeta.
2. Aparecerá un **diálogo de confirmación** pidiendo que confirme la eliminación.
3. Solo al confirmar se procede con el borrado permanente.

### 4.8 Exportar a CSV

El botón **"Exportar"** (esquina superior derecha) permite descargar un archivo CSV con el listado completo de cotizaciones filtradas.

---

## 5. Módulo: Órdenes de Trabajo (OT)

Las Órdenes de Trabajo representan la ejecución operativa de los servicios aprobados. Se crean a partir de cotizaciones aprobadas o de forma manual.

![Listado de Órdenes de Trabajo activas](C:\Users\mggma\.gemini\antigravity-ide\brain\f45dc909-31ca-4d9f-8830-1c100a36ebe5\ordenes_trabajo_mockup_1786993042124.png)

### 5.1 Listado de OTs

Cada tarjeta de OT muestra:
- **Número de OT** (ej. `OT-2025-001`)
- **Cliente** asociado
- **Descripción / Tipo de trabajo**
- **Estatus** actual (ver etapas abajo)
- **Barra de progreso** (0% a 100%)
- **Técnico/operario asignado** (o "Sin asignar")
- **Fecha estimada de cierre**
- Indicador de **incidencias activas** (⚠️ triángulo rojo)
- Indicador de OT **pausada** 🔒

### 5.2 Etapas de una Orden de Trabajo

| Etapa | Color | Descripción |
|-------|-------|-------------|
| **Programación** | Amarillo | Planificada, pendiente de iniciar producción |
| **Producción** | Naranja | En ejecución activa |
| **Revisión** | Morado | El trabajo terminó, en revisión de calidad |
| **Finalizado** | Verde | Aprobado internamente, listo para entregar |
| **Entregado** | Verde oscuro | Entregado al cliente |

### 5.3 Ver Detalle de una OT

Presione una OT para abrir su panel de detalle completo. El panel incluye:

**Información General:**
- ID, cliente, cotización vinculada, ejecutivo
- Estatus actual y progreso

**Seguimiento de Etapas:**
- Cronología visual de los cambios de estatus con fecha y hora
- Historial completo de movimientos (log)

**Gestión del Técnico:**
- Campo para asignar o cambiar el **operario/técnico** responsable
- Registro de tiempo estimado vs. tiempo transcurrido

**Incidencias:**
- Lista de incidencias reportadas (activas y resueltas)
- Botón para **registrar nueva incidencia** con descripción y severidad (Baja, Media, Alta)
- Opción para **marcar incidencia como resuelta**

**Pausa de la OT:**
- Botón para pausar la OT, indicando el motivo de la pausa
- Mientras esté pausada, aparece el ícono de candado 🔒

### 5.4 Cambiar el Estatus de una OT

Dentro del detalle de la OT, use el selector de estatus y confirme el cambio. El sistema registra automáticamente:
- La hora del cambio
- El usuario que realizó el cambio
- Un log con la descripción del movimiento

> [!IMPORTANTE]
> Cada cambio de estatus queda registrado en el historial de la OT y puede ser auditado desde el módulo de Ajustes.

### 5.5 Crear una OT Manualmente

Presione **"+ Nueva OT"** en la esquina superior derecha. Puede crear una OT:
- **Vinculada a una Cotización**: seleccionando una cotización aprobada de la lista.
- **Manual**: sin cotización vinculada, ingresando los datos directamente.

### 5.6 Exportar OT a PDF

Desde el detalle de la OT, el botón **"Imprimir/Exportar"** genera la ficha técnica completa en PDF.

### 5.7 Filtros Disponibles

Presione el botón **"Filtros"** para filtrar por:
- **Cliente**
- **Rango de fechas**
- **Estatus**
- **Solo con Incidencias** (checkbox)

---

## 6. Módulo: Herramientas y Analíticas

Este módulo centraliza reportes avanzados, exportaciones de datos, alertas operativas y el control del Monitor de Producción (ticker).

![Módulo de Herramientas con gráficos analíticos](C:\Users\mggma\.gemini\antigravity-ide\brain\f45dc909-31ca-4d9f-8830-1c100a36ebe5\herramientas_mockup_1786993074310.png)

El módulo se organiza en **4 pestañas principales**:

### 6.1 Pestaña: Reportes

Subtabs disponibles:
- **Cotizaciones**: Métricas de ventas y comerciales.
- **Órdenes de Trabajo**: Métricas operativas de producción.

#### Reportes de Cotizaciones

| Reporte | Descripción |
|---------|-------------|
| **Tasa de Conversión** | Distribución porcentual de cotizaciones por estatus |
| **Motivos de Rechazo** | Gráfico de pastel con las causas de rechazo registradas |
| **Ranking de Clientes** | Top clientes por volumen cotizado/aprobado |
| **Tiempo Promedio de Cierre** | Días promedio desde emisión hasta aprobación |

#### Reportes de Órdenes de Trabajo

| Reporte | Descripción |
|---------|-------------|
| **Distribución de OTs por Etapa** | Gráfico de barras con conteo por estatus |
| **Entregas a Tiempo** | Porcentaje OTs entregadas a tiempo vs. con retraso |
| **Tiempo de Ciclo** | Tiempo promedio por etapa de producción |

> [!IMPORTANTE]
> Todos los reportes usan **datos reales de la base de datos**. Si no hay datos suficientes, se muestra un estado vacío informativo.

### 6.2 Pestaña: Exportar Datos

Permite descargar información en formato **CSV** para análisis externo (Excel, etc.).

Opciones de exportación:
- **Tipo de datos**: Cotizaciones u Órdenes de Trabajo
- **Filtro por Estatus**: Exportar solo un estatus específico
- **Filtro por Cliente**: Exportar solo un cliente específico

Presione **"Descargar CSV"** para iniciar la descarga.

### 6.3 Pestaña: Panel de Alertas

Muestra notificaciones automáticas sobre situaciones que requieren atención:

**Alertas de Cotizaciones:**
- Cotizaciones próximas a vencer (según umbral de días configurado en Ajustes)

**Alertas de OTs:**
- OTs sin asignar técnico por más de X horas
- OTs con progreso estancado por encima del umbral configurado
- OTs próximas a su fecha de cierre

Cada alerta muestra la cotización/OT afectada con un enlace para acceder directamente al registro.

### 6.4 Pestaña: Monitor Ticker

Herramienta para **enviar mensajes al Monitor de Producción** (pantalla de TV en el área de producción).

**Ver mensajes activos:**
- Lista de mensajes enviados con estatus (activo/inactivo), prioridad y fecha de expiración.

**Enviar nuevo mensaje:**
1. Presione **"+ Nuevo Mensaje"**.
2. Ingrese el texto del mensaje.
3. Seleccione la **prioridad**: Normal o Urgente.
4. Defina el **tiempo de expiración**: 1h, 4h, 8h, 24h o "Sin vencimiento".
5. Presione **"Enviar"**.

**Editar/desactivar mensaje:**
- Presione el ícono de edición en un mensaje para modificarlo.
- Presione el ícono de desactivar para ocultarlo del monitor.

> [!RECOMENDACIÓN]
> Use prioridad **"Urgente"** para mensajes críticos que deben resaltar visualmente en el monitor de producción.

---

## 7. Módulo: Ajustes del Sistema

> [!IMPORTANTE]
> Este módulo es exclusivo para usuarios con rol **Administrador**. Los demás roles no pueden acceder a este módulo.

![Panel de ajustes con gestión de usuarios](C:\Users\mggma\.gemini\antigravity-ide\brain\f45dc909-31ca-4d9f-8830-1c100a36ebe5\ajustes_mockup_1786993097710.png)

El módulo de Ajustes se organiza en un menú lateral con las siguientes secciones:

### 7.1 Gestión de Usuarios

Permite administrar las cuentas de acceso al sistema.

**Ver usuarios registrados:**
- Lista con foto de perfil (avatar), nombre, nombre de usuario, rol y cargo.

**Agregar nuevo usuario:**
1. Presione **"+ Agregar Usuario"**.
2. Complete los campos: Nombre Completo, Nombre de Usuario, Rol, Cargo y Teléfono.
3. El sistema crea la cuenta con una contraseña temporal que el usuario deberá cambiar en su primer inicio de sesión.

**Editar usuario existente:**
- Presione el ícono ✏️ para modificar nombre, rol, cargo, teléfono y foto de perfil.

**Eliminar usuario:**
- Presione el ícono 🗑️ y confirme en el diálogo de confirmación.

> [!ADVERTENCIA]
> La eliminación de un usuario es permanente. Asegúrese de que el usuario no tenga órdenes de trabajo activas asignadas antes de eliminarlo.

### 7.2 Roles y Permisos

Configura qué acciones puede realizar cada rol del sistema.

![Matriz de roles y permisos por módulo](C:\Users\mggma\.gemini\antigravity-ide\brain\f45dc909-31ca-4d9f-8830-1c100a36ebe5\roles_permisos_mockup_1786993133221.png)

Los roles disponibles son:
- **Admin**: Acceso total a todos los módulos y acciones.
- **Ventas**: Acceso a Cotizaciones, OTs, Dashboard y Herramientas.
- **Producción**: Acceso a OTs, Dashboard y Herramientas (sin Cotizaciones).

Para cada rol, puede activar/desactivar permisos individuales por módulo usando los **toggles** (interruptores):

| Módulo | Acciones configurables |
|--------|----------------------|
| Cotizaciones | Ver, Crear, Editar, Cambiar Estatus, Anular, Eliminar, Imprimir, Gestionar Clientes |
| Órdenes de Trabajo | Ver, Crear, Editar, Asignar Técnicos, Cambiar Estatus, Imprimir, Eliminar |
| Dashboard | Acceso General, KPIs Financieros, Métricas Operativas |
| Herramientas | Ver Reportes, Exportar CSV, Ver Alertas |
| Ajustes | Acceso, Gestionar Usuarios, Gestionar Roles, Configurar KPIs, Ver Logs |

Presione **"Guardar Permisos"** para aplicar los cambios.

### 7.3 Configurar KPIs y Alertas

Define los umbrales que activan las alertas automáticas del sistema.

**KPIs de Cotizaciones:**
- **Días para alerta de vencimiento**: Número de días antes del vencimiento en que se genera una alerta.
- Activar/desactivar cada tipo de alerta individualmente.

**KPIs de Órdenes de Trabajo:**
- **Horas sin asignar técnico**: Horas transcurridas sin técnico antes de generar alerta.
- **Porcentaje de progreso estancado**: Umbral de progreso para alertar estancamiento.
- **Horas en logística/entrega**: Umbral de tiempo en etapa final.

### 7.4 Datos de la Empresa

Configura la información de la empresa que aparece en los PDFs generados:
- Razón Social
- RIF
- Dirección
- Teléfono
- Correo Electrónico
- Sitio Web

### 7.5 Log de Auditoría

Registro histórico de todas las acciones realizadas en el sistema.

Cada entrada del log muestra:
- **Fecha y hora** de la acción
- **Usuario** que la realizó
- **Tipo de acción** (Creación, Edición, Eliminación, Cambio de Estatus, etc.)
- **Descripción** de la acción

**Filtros disponibles:**
- Búsqueda por texto libre
- Filtro por rango de fechas
- Filtro por tipo de acción
- Filtro por usuario

### 7.6 Apariencia

Permite alternar entre el **modo oscuro** (predeterminado) y el **modo claro** de la interfaz. El sistema guarda su preferencia para futuras sesiones.

---

## 8. Módulo: Mi Perfil

Accesible desde el Dashboard (ícono de usuario en el header), permite al usuario gestionar su propia cuenta.

![Pantalla de edición de perfil de usuario](C:\Users\mggma\.gemini\antigravity-ide\brain\f45dc909-31ca-4d9f-8830-1c100a36ebe5\perfil_mockup_1786993125097.png)

### 8.1 Editar Datos Personales

Los campos editables son:
- **Nombre Completo**
- **Cargo / Posición**
- **Área / Rol del Sistema** (selección)
- **Correo Electrónico de Contacto**
- **Teléfono de Contacto**

Presione **"Guardar Cambios"** para guardar. Se mostrará una notificación de confirmación al completar.

### 8.2 Cambiar Foto de Perfil

1. Presione sobre la foto/avatar en la parte superior.
2. Seleccione una imagen de su dispositivo.
3. Presione **"Guardar Cambios"** para subir la nueva foto.

La nueva foto se reflejará inmediatamente en toda la aplicación.

### 8.3 Cambiar Contraseña

1. Presione el botón **"Cambiar Contraseña"**.
2. Se abrirá un modal con los campos:
   - **Nueva Contraseña**
   - **Confirmar Contraseña**
3. Ambas contraseñas deben coincidir.
4. Presione **"Guardar Nueva Contraseña"** para confirmar.

> [!RECOMENDACIÓN]
> Use contraseñas de al menos 8 caracteres, combinando letras, números y símbolos para mayor seguridad.

### 8.4 Cambio Obligatorio de Contraseña

Si un administrador crea su cuenta con una contraseña temporal, la primera vez que inicie sesión el sistema le pedirá **obligatoriamente** que establezca una nueva contraseña antes de poder acceder a cualquier módulo.

---

## 9. Monitor Kanban (Pantalla de Producción)

El Monitor Kanban es una vista especial diseñada para ser proyectada en una **pantalla de TV** en el área de producción. Muestra en tiempo real el estado de todas las Órdenes de Trabajo activas.

![Monitor Kanban de producción para pantalla TV](C:\Users\mggma\.gemini\antigravity-ide\brain\f45dc909-31ca-4d9f-8830-1c100a36ebe5\monitor_kanban_mockup_1786993105293.png)

### Características

- **Acceso público**: No requiere inicio de sesión. La URL es: `/monitor-kanban`
- **Actualización automática**: Se actualiza en tiempo real cuando hay cambios en las OTs (tecnología Supabase Realtime)
- **Reloj en tiempo real**: Muestra la hora y fecha actuales
- **4 columnas Kanban**: Programación → Producción → Revisión → Finalizado

> [!NOTA]
> Las OTs en estado **"Entregado"** no se muestran en el monitor para optimizar el espacio en pantalla.

### Información mostrada por tarjeta

Cada tarjeta de OT en el monitor muestra:
- ID de la OT y nombre del cliente
- Descripción del trabajo
- Barra de progreso visual
- Técnico asignado
- Fecha estimada de cierre / fecha fin de trabajo
- **Indicador ⚠️** si tiene incidencias activas sin resolver
- **Indicador 🔒** si está pausada

### Ticker de Mensajes

En la parte inferior del monitor corre un **ticker (cinta de noticias)** con mensajes enviados desde el módulo de Herramientas. Los mensajes de prioridad "Urgente" se muestran resaltados en rojo.

### Cómo activar en una TV

1. Abra un navegador en el equipo conectado a la TV.
2. Navegue a `https://comunicaciones-seis-app.vercel.app/monitor-kanban`
3. Active el modo pantalla completa (tecla F11 en Windows)
4. El monitor se actualiza automáticamente, sin necesidad de recargar.

---

## 10. Roles y Permisos

Resumen de acceso por rol:

| Módulo / Acción | Admin | Ventas | Producción |
|-----------------|:-----:|:------:|:----------:|
| Dashboard (General) | ✅ | ✅ | ✅ |
| Dashboard (KPIs Financieros) | ✅ | ✅ | ❌ |
| Cotizaciones - Ver | ✅ | ✅ | ❌ |
| Cotizaciones - Crear | ✅ | ✅ | ❌ |
| Cotizaciones - Editar | ✅ | ✅ | ❌ |
| Cotizaciones - Cambiar Estatus | ✅ | ✅ | ❌ |
| Cotizaciones - Eliminar | ✅ | ❌ | ❌ |
| Cotizaciones - Exportar PDF | ✅ | ✅ | ❌ |
| Órdenes de Trabajo - Ver | ✅ | ✅ | ✅ |
| Órdenes de Trabajo - Crear | ✅ | ✅ | ❌ |
| Órdenes de Trabajo - Editar | ✅ | ✅ | ✅ |
| OT - Asignar Técnicos | ✅ | ✅ | ✅ |
| OT - Cambiar Estatus | ✅ | ✅ | ✅ |
| OT - Eliminar | ✅ | ❌ | ❌ |
| Herramientas - Reportes | ✅ | ✅ | ✅ |
| Herramientas - Exportar CSV | ✅ | ✅ | ❌ |
| Herramientas - Monitor Ticker | ✅ | ✅ | ❌ |
| Ajustes - Acceso | ✅ | ❌ | ❌ |
| Ajustes - Gestionar Usuarios | ✅ | ❌ | ❌ |
| Ajustes - Roles y Permisos | ✅ | ❌ | ❌ |
| Ajustes - Configurar KPIs | ✅ | ❌ | ❌ |
| Ajustes - Log de Auditoría | ✅ | ❌ | ❌ |

> [!NOTA]
> Los permisos listados son los valores por defecto. El Administrador puede modificarlos desde el módulo de Ajustes → Roles y Permisos.

---

## 11. Preguntas Frecuentes

**¿Por qué no puedo acceder al módulo de Cotizaciones?**
Su usuario puede tener el rol "Producción", el cual no tiene acceso a ese módulo. Consulte con el administrador para cambiar su rol si es necesario.

**¿Por qué no puedo eliminar una cotización?**
Solo se pueden eliminar cotizaciones en estado "Borrador" o "Anulada". Cambie el estatus primero a "Anulada" y luego proceda con la eliminación.

**¿Por qué mi cotización no aparece en el listado?**
El listado de Cotizaciones solo muestra aquellas **sin** una Orden de Trabajo asociada. Si la cotización ya tiene una OT, encuéntrela en el módulo de Órdenes de Trabajo.

**¿Cómo sé si mis cambios se guardaron?**
El sistema siempre muestra una notificación/toast en pantalla confirmando que los cambios se guardaron exitosamente. Si no ve esta notificación, verifique su conexión a internet.

**¿Dónde puedo ver quién hizo cada acción?**
El Administrador puede revisar el historial completo de acciones en Ajustes → Log de Auditoría.

**¿El Monitor Kanban se actualiza automáticamente?**
Sí. Está conectado en tiempo real a la base de datos. Cualquier cambio en las OTs se refleja automáticamente sin necesidad de recargar la página.

**¿Puedo usar la aplicación en mi celular?**
Sí. La aplicación está optimizada para dispositivos móviles y puede instalarse como PWA (Progressive Web App) desde el navegador de su teléfono para tener acceso desde la pantalla de inicio, similar a una app nativa.

---

*Manual generado para Comunicación 6 · Estudio Creativo — Sistema de Trazabilidad y Gestión de Pedidos*
*Versión 1.0 · Desarrollado por CloudNets 2026 · Venezuela*
