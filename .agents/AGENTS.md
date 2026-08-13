# Reglas de Diseño del Proyecto

## Botones de Acción y Formularios

- **Altura y Fuente Consistentes**: Todos los botones de cabecera y principales deben mantener consistentemente una altura de `48px` y un tamaño de letra (`font-size`) de `0.95rem` en todas las resoluciones de pantalla.
- **Comportamiento Responsivo**: En pantallas estrechas o dispositivos móviles, se debe evitar reducir la altura o el tamaño de la fuente de los botones. En su lugar, el contenedor de botones debe permitir el salto de línea automático (`flex-wrap: wrap`) para adaptarse y prevenir desbordamientos en el margen derecho.
- **Confirmación de Eliminación**: Siempre que se intente eliminar cualquier registro en la aplicación (cotización, ítem, cliente, etc.), se debe mostrar un diálogo/modal de confirmación antes de proceder con la acción definitiva de borrado.

## Flujo de Trabajo y Despliegues (Git / Vercel)

- **Desarrollo en rama `main`**: A partir de ahora, como regla general, todas las actualizaciones del repositorio en GitHub deben realizarse directamente en la rama `main`.

## Lógica de Negocio - Cotizaciones

- **Eliminación de Cotizaciones**:
  1. Solo se pueden eliminar cotizaciones cuyo estatus sea "BORRADOR" o "ANULADA".
  2. Si la cotización tiene cualquier otro estatus, se debe mostrar un modal/dialog de advertencia informativo indicando al usuario que debe cambiar el estatus a "ANULADA" para poder eliminarla (el usuario deberá buscar la opción de cambio de estatus por su cuenta).
  3. Esta regla debe implementarse tanto a nivel visual en el frontend (React) como a nivel de validación en el backend (API) por motivos de seguridad.
- **Ranking de Clientes**:
  1. Al generar gráficos de ranking de clientes por volumen de ventas/cotizaciones, solo se deben contabilizar aquellas cotizaciones que estén en estado "Aprobada" y que cuenten con una Orden de Trabajo (OT) asociada.
  2. Cotizaciones rechazadas, anuladas, o en cualquier otro estado no deben ser sumadas al volumen de facturación o volumen cotizado del cliente en este gráfico.
- **Uso de Datos Reales de Supabase**:
  1. Todos los gráficos, listas, paneles y cálculos estadísticos de la aplicación deben utilizar exclusivamente la información real registrada en Supabase.
  2. Se prohíbe el uso de datos simulados (mock data) para rellenar visualizaciones o informes. Si la base de datos no cuenta con registros o datos suficientes, se debe mostrar un estado vacío informativo y amigable al usuario (empty state) en su lugar.

## Experiencia de Usuario (UX)

- **Confirmación de Guardado**: Después de cualquier operación de GUARDAR o de actualizar datos en la base de datos, se debe mostrar un diálogo, notificación o modal que informe al usuario de manera clara que los cambios se actualizaron exitosamente.

## Documentación y Manuales

- **Idioma de Títulos y Alertas**: Siempre que se generen manuales de usuario, documentación o artefactos en Markdown, los títulos de las alertas de GitHub (como TIP, NOTE, WARNING, IMPORTANT) o de cualquier cuadro de información deben traducirse explícitamente al español (ej. RECOMENDACIÓN, NOTA, ADVERTENCIA, IMPORTANTE).
