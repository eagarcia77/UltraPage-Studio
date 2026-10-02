# UltraPage Studio

![UltraPage Studio logo](public/brand/ultrapage-mark.svg)

## Abrir el programa

### [▶ Abrir UltraPage Studio](https://ultrapage-studio.onrender.com)

> GitHub muestra el código fuente del proyecto. Para utilizar el editor, seleccione el enlace **Abrir UltraPage Studio**.

Editor visual para crear contenido accesible y portátil entre Blackboard Ultra, Canvas, Moodle, D2L Brightspace y otros LMS basados en HTML estándar.

## Funciones

- Edición visual y edición directa de HTML.
- Perfiles de salida para Universal LMS, Blackboard Ultra, Canvas, Moodle y D2L Brightspace.
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
npm run audit:native-tools
npm run check
```

La documentación de auditoría está en:

```text
docs/NATIVE_TOOLS_AUDIT_2026-10-02.md
```

## Desarrollo local

```bash
npm install
npm run dev
```

## Seguridad

No incluya credenciales de Blackboard, contraseñas WebDAV ni secretos institucionales en el código fuente. Las credenciales se utilizan temporalmente durante la conexión y no se almacenan en GitHub.

## Implementación

La aplicación se ejecuta de forma independiente en Render y utiliza una función de servidor para proteger la conexión WebDAV. GitHub conserva el código fuente y Render publica el programa funcional.
