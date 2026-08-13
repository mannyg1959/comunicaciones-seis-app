# Módulos y Funcionalidades de la Aplicación

A continuación se detalla el listado de módulos actuales del sistema y las posibles acciones (permisos) que un usuario podría realizar en cada uno. Este listado servirá como base para estructurar nuestra matriz de Roles y Permisos.

## 1. Módulo: Cotizaciones
Este módulo gestiona las propuestas comerciales enviadas a los clientes.
*   **Ver Cotizaciones:** Acceder al listado general de cotizaciones.
*   **Crear Cotización:** Generar una nueva cotización.
*   **Editar Cotización:** Modificar datos, ítems o valores de una cotización existente.
*   **Cambiar Estatus:** Actualizar el estado de la cotización (ej. Aprobada, Rechazada, Enviada).
*   **Anular Cotización:** Marcar una cotización como "Anulada".
*   **Eliminar Cotización:** Borrar permanentemente una cotización (restringido a estado Borrador o Anulada).
*   **Imprimir/Exportar:** Generar el PDF de la cotización para el cliente.
*   **Gestionar Clientes:** Ver y utilizar el catálogo de clientes al cotizar.

## 2. Módulo: Órdenes de Trabajo (OT)
Controla la ejecución de los servicios aprobados.
*   **Ver Órdenes de Trabajo:** Acceder al listado general de OTs.
*   **Crear OT:** Generar una nueva OT (ya sea vinculada a una cotización o manual).
*   **Editar OT:** Modificar el seguimiento, notas y detalles de la ejecución.
*   **Asignar Técnicos:** Asignar o remover empleados encargados de ejecutar la OT.
*   **Cambiar Estatus:** Actualizar el avance de la OT (ej. En proceso, Pausada, Finalizada).
*   **Imprimir/Exportar:** Generar la ficha técnica o PDF de la OT.
*   **Eliminar OT:** Borrar una OT del sistema.

## 3. Módulo: Dashboard (Panel de Control)
Área de visualización de métricas de negocio.
*   **Ver Dashboard:** Acceso general a la pantalla de métricas.
*   **Ver KPIs Financieros:** Visualizar volumen de ventas, ingresos proyectados y rankings.
*   **Ver Métricas Operativas:** Visualizar estatus de OTs, rendimiento general.

## 4. Módulo: Herramientas y Analíticas
Herramientas de análisis, reportes y exportación de datos operativos.
*   **Ver Reportes:** Visualizar gráficas avanzadas (Tasa de conversión, motivos de rechazo, tiempos de ciclo, etc.).
*   **Exportar Datos:** Generar y descargar reportes en formato CSV para Cotizaciones y Órdenes de Trabajo.
*   **Ver Alertas:** Acceder al panel de notificaciones y alertas sobre vencimientos y fechas límite.

## 5. Módulo: Ajustes (Configuración del Sistema)
Área administrativa, idealmente restringida a administradores.
*   **Acceso a Ajustes:** Permiso base para entrar al módulo de configuración.
*   **Gestionar Usuarios:** Ver, crear, editar o desactivar cuentas de usuario del sistema.
*   **Gestionar Roles y Permisos:** (En desarrollo) Crear roles y definir a qué módulos tienen acceso.
*   **Configurar KPIs:** Establecer las metas mensuales/anuales del Dashboard.
*   **Ver Logs (Auditoría):** Revisar el registro histórico de acciones realizadas en el sistema.

## 6. Módulo: Mi Perfil
Gestión de la cuenta propia del usuario.
*   **Ver Perfil Propio:** Visualizar datos personales.
*   **Cambiar Contraseña:** Actualizar credenciales de acceso propias.

---

> [!NOTE]
> Revise esta lista para confirmar si cubre todas las acciones que necesitamos controlar. Si está de acuerdo con esta estructura base, podemos proceder a diseñar la base de datos para los permisos o la interfaz de asignación de roles.
