# 📺 Sistema de Enlace Seguro Implementado

He completado el desarrollo de la opción seleccionada. A partir de ahora, el Monitor (Smart TV) está completamente aislado y funciona mediante tokens dinámicos en lugar de contraseñas.

## 🛠️ ¿Qué cambió?

1. **Nueva Sección en Ajustes:** 
   Agregué una pestaña "Enlace Seguro de Monitor TV" en [Ajustes.jsx](file:///d:/Proyecto%20Comunicaciones%20SEIS%20App/src/pages/Ajustes.jsx) (identificable con el ícono de TV). Allí podrás ver el enlace actual o regenerar uno nuevo si lo necesitas.
2. **Sistema de Tokens Seguro:**
   La ruta anterior `/monitor-kanban` ha sido desactivada. Ahora el sistema exige estrictamente un parámetro de token seguro en la URL en [App.jsx](file:///d:/Proyecto%20Comunicaciones%20SEIS%20App/src/App.jsx).
3. **Validación Antihacking:**
   El componente del Monitor [MonitorKanban.jsx](file:///d:/Proyecto%20Comunicaciones%20SEIS%20App/src/pages/MonitorKanban.jsx) verifica en tiempo real que el token de la URL coincida con el activo en la base de datos (`system_settings`). Si es incorrecto, no descargará datos de la empresa y mostrará una alerta de "Acceso Denegado".

## 🧪 Cómo probarlo

1. Entra a **Ajustes** en tu menú lateral izquierdo.
2. Selecciona la opción **Enlace de Monitor TV**.
3. Haz clic en el botón azul que dice **Abrir Monitor**. 
   > Notarás que se abre una pestaña nueva donde el Monitor carga perfectamente porque el enlace es válido.
4. Para comprobar la seguridad: Cierra esa nueva pestaña. En Ajustes, presiona el botón rojo **Revocar y Regenerar Enlace**. 
5. Ahora, si intentas abrir el enlace viejo (o escribes `/monitor-kanban` en el navegador), verás inmediatamente el candado rojo de Acceso Denegado.

Este es un diseño limpio y moderno a nivel de seguridad, y mucho más cómodo para las pantallas de la planta operativa.
