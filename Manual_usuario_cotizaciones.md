# Manual de Usuario - Módulo de Cotizaciones

Bienvenido al **Módulo de Cotizaciones** de la aplicación Comunicaciones SEIS. Este módulo está diseñado para que los ejecutivos y administradores puedan gestionar las ofertas comerciales, crear nuevas cotizaciones, realizar seguimientos (GAP de fechas) y filtrar información clave.

---

## 1. Pantalla Principal de Cotizaciones
Al ingresar al módulo, visualizarás un panel central con el listado de todas las cotizaciones registradas.

### 1.1. Barra de Herramientas Superior
- **Botón "Nueva"**: Permite iniciar el flujo de creación de una nueva cotización. *(Nota: Solo visible si tienes los permisos adecuados)*.
- **Botón "Filtros"**: Abre el panel avanzado para buscar cotizaciones específicas.
- **Barra de Búsqueda Rápida**: Puedes escribir el nombre del cliente o el ID de la cotización para encontrarla de forma inmediata.

---

## 2. Visualización de Cotizaciones (Tarjetas)
Cada cotización se muestra como una tarjeta individual. Al hacer clic en cualquier tarjeta, se abrirá el formulario para **editar o visualizar** los detalles de dicha cotización.

> **💡 RECOMENDACIÓN:**
> **Lectura Rápida de Tarjetas**
> En cada tarjeta podrás identificar rápidamente:
> - **ID y Estado:** (Ej. *Aprobada, Pendiente, Rechazada, Borrador, etc.*) resaltados por colores.
> - **Cliente y Tipo de Trabajo:** (Ej. *Redes y otros*).
> - **Fechas y Monto:** Fecha de emisión y valor total ($).
> - **GAP de Entrega:** Un indicador visual del tiempo restante para la entrega estimada (Ej. *¡Hoy!*, *Vencido*, *X días*).

---

## 3. Crear o Editar una Cotización
Al presionar el botón **"Nueva"** o al hacer clic sobre una tarjeta existente, accederás al formulario de cotización.

### 3.1. Llenado de Datos Principales
Deberás rellenar o modificar los campos obligatorios:
- **Cliente / Contacto**: Selecciona al cliente desde la base de datos.
- **Fechas**: Ingresa la fecha de validez y la fecha estimada de entrega.
- **Condiciones de Pago**: Especifica los términos comerciales.
- **Ítems / Líneas de Negocio**: Agrega los productos o servicios que componen la oferta (con cantidades y costos unitarios).

> **🚨 IMPORTANTE:**
> **Cambio de Estados**
> Si una cotización es marcada como "Rechazada", el sistema te pedirá ingresar el *Motivo de Rechazo* y el *Detalle de Rechazo* obligatoriamente.

### 3.2. Guardar y Confirmar
Una vez que hayas completado la información, haz clic en **Guardar**.
- Aparecerá una notificación central confirmando que la *"Cotización fue guardada exitosamente"*.
- Si hay errores, la notificación te indicará el problema (Ej. datos faltantes).

---

## 4. Filtrado de Información
Para un análisis preciso o para buscar grupos de cotizaciones, haz clic en el botón **Filtros**. Se abrirá una ventana con las siguientes opciones:

- **Por Cliente:** Selecciona un cliente específico del listado.
- **Por Rango de Fechas:** Selecciona "Desde" y "Hasta" para acotar por la fecha de emisión.
- **Por Estatus:** Filtra cotizaciones según su etapa comercial (Borrador, Pendiente, Enviada, En Negociación, Aprobada, Rechazada, Anulada).

Haz clic en **Aplicar** para ver los resultados o en **Limpiar** para volver a ver todas las cotizaciones.

---

## 5. Eliminar Cotizaciones
En caso de requerir borrar una cotización, puedes hacerlo desde la vista de edición.

> **⚠️ ADVERTENCIA:**
> **Regla del Sistema para Eliminación**
> Para mantener la integridad de los datos, **solo se pueden eliminar cotizaciones que se encuentren en estatus "BORRADOR" o "ANULADA"**. Si intentas eliminar una cotización en otro estado, el sistema te mostrará una advertencia indicando que primero debes cambiar el estatus a "Anulada".

Antes de la eliminación final, el sistema siempre te mostrará un **mensaje de confirmación** para evitar borrados accidentales.

---

## 6. Integridad de los Datos (Gráficos y KPIs)
> **📌 NOTA:**
> Recuerda que solo las cotizaciones en estado **"Aprobada"** (y que luego cuenten con una Orden de Trabajo) sumarán al volumen de ventas en los paneles gráficos y el ranking de clientes. Las cotizaciones rechazadas o anuladas se excluyen de la estadística de facturación.
