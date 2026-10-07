# UltraPage Studio

![UltraPage Studio logo](public/brand/ultrapage-mark.svg)

## Abrir el programa

### [▶ Abrir UltraPage Studio](https://ultrapage-studio.onrender.com)

> GitHub muestra el código fuente del proyecto. Para utilizar el editor, seleccione el enlace **Abrir UltraPage Studio**.

Editor visual para crear contenido accesible y portátil entre Blackboard Ultra, Canvas, Moodle, D2L Brightspace y otros LMS basados en HTML estándar.

> **Estado del producto:** vista previa precomercial. Las ventas y las afirmaciones de certificación permanecen desactivadas hasta completar la [puerta de estabilidad y preparación comercial](docs/COMMERCIALIZATION_READINESS.md).

## Propiedad y autoría

- **Dueño y creador:** Eduardo Augusto García Rodríguez
- **Copyright:** © 2026 Eduardo Augusto García Rodríguez. Todos los derechos reservados.

“UltraPage Studio” se mantiene como nombre de trabajo mientras se completa una evaluación formal de marca. Esta declaración identifica la propiedad y autoría de la aplicación y de su código original; no afirma que el nombre comercial esté registrado o disponible en exclusiva. El proyecto es independiente y no está afiliado ni respaldado por terceros que utilicen términos similares.

## Funciones

- Edición visual y edición directa de HTML.
- Perfiles de salida para Universal LMS, Blackboard Ultra, Canvas, Moodle y D2L Brightspace.
- Publication Readiness Command Center con estado `READY`, `REVIEW` o `BLOCKED`, ocho pilares de evidencia y un Readiness Passport JSON que identifica la versión auditada sin presentarse como firma digital.
- Course Digital Twin: simulación predictiva local de cinco condiciones combinadas de LMS, dispositivo, conectividad y accesibilidad; estima estabilidad, tiempo de carga, señales supervivientes, riesgos y acciones de recuperación sin usar datos de estudiantes.
- Temporal Continuity Nexus conserva hasta 50 checkpoints transaccionales en IndexedDB, verifica contenido y recuperación con SHA-256, advierte sobre líneas temporales divergentes entre pestañas y permite exportar o importar una Recovery Capsule privada sin sobrescribir automáticamente el trabajo.
- Learning Constellation Map: gemelo semántico local que representa objetivos, secciones, actividades, evaluaciones y recursos como una galaxia navegable; detecta rutas incompletas y exporta un grafo JSON inspirado en CASE sin presentarlo como paquete certificado.
- Deep-Space Learning Trajectories simula rutas deterministas para principiantes, estudiantes con tiempo limitado y aprendizaje avanzado, con estética de ciencia ficción y sin afirmar tecnología extraterrestre real ni perfilar estudiantes.
- Inclusive Learner Journey Simulator con cinco perspectivas (teclado, lector de pantalla, baja visión/reflow, carga cognitiva y móvil), vista transformada, secuencias de foco/lectura y reporte descargable; complementa, pero no sustituye, pruebas con tecnologías de asistencia y estudiantes.
- Universal LMS Preflight con una matriz de 25 señales para comprobar contenido, estructura, imágenes, enlaces e higiene del HTML en los cinco perfiles antes de publicar.
- Learning Experience Pulse para revisar estructura pedagógica, objetivos medibles, orientación, alineación de evaluación, apoyo y carga cognitiva sin sustituir el juicio docente.
- Semantic Change Impact para comparar la página actual con la última versión guardada e identificar cambios sensibles en estructura, enlaces, imágenes, tablas y accesibilidad.
- Fragmentos HTML semánticos con estilos en línea para pegar en editores LMS que eliminan CSS externo.
- Vista previa para computadora, tableta y celular.
- Plantillas de objetivos, instrucciones y avisos.
- Conexión segura con Blackboard Content Collection mediante WebDAV.
- Revisión básica de accesibilidad.
- Herramientas APA 7 para citas narrativas y parentéticas, referencias con sangría francesa, tablas, figuras, notas, DOI y URL.
- Exportación a Microsoft Word (`.docx`) con encabezados, listas, tablas, enlaces, idioma y metadatos estructurados.
- Exportación a PDF etiquetado con perfil PDF/UA, idioma `es-PR`, fuentes incrustadas y metadatos.
- Descarga de HTML, Word y PDF en la computadora.
- Guardado de HTML, Word y PDF directamente en Blackboard Content Collection mediante WebDAV.
- Revisión previa de título, encabezados, texto alternativo, enlaces descriptivos y tablas.
- Copia de HTML adaptada al LMS seleccionado y perfil universal conservador para otras plataformas.
- Herramientas de evaluación identificadas por alcance: TXT Test Generator exporta Blackboard Ultra TXT y Moodle GIFT; QTI 2.1 conserva su perfil específico para Blackboard Ultra.
- Consola de auditoría en `/tools` para verificar las copias nativas de EstiloAPA, TXT Test Generator y QTI 2.1 Blackboard.

## Auditoría de herramientas nativas

La auditoría revisa las copias nativas ubicadas en `public/native-tools/` sin modificar los repositorios originales. El objetivo es confirmar que el Ribbon compartido, los comandos accesibles y los puntos de entrada de cada herramienta respondan correctamente.

```bash
npm run audit:design-preview
npm run audit:native-tools
npm run audit:qti21
npm run check
```

La documentación de auditoría está en:

```text
docs/NATIVE_TOOLS_AUDIT_2026-10-02.md
```

## Desarrollo local

```bash
npm ci
npm run dev
```

## Seguridad

No incluya credenciales de Blackboard, contraseñas WebDAV ni secretos institucionales en el código fuente. Las credenciales se utilizan temporalmente durante la conexión y no se almacenan en GitHub. Las rutas de importación, exportación y WebDAV aplican límites de tamaño y frecuencia; la conversión de documentos vuelve a sanitizar el HTML en el servidor.

## Implementación

La aplicación se ejecuta de forma independiente en Render y utiliza una función de servidor para proteger la conexión WebDAV. GitHub conserva el código fuente y Render publica el programa funcional.
