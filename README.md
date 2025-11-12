# git-app

Pequeño script en Node.js para detectar commits en la rama `staging` relacionados con códigos/tickets específicos y comparar si ya están en `production`. Genera un archivo `commits.csv` con información útil y comandos `git cherry-pick` para aplicar commits que falten en producción.

## Requisitos
- Node.js (>=12)
- Git (configurado en el proyecto)
- El repositorio debe tener remoto `origin` y ramas `staging` y `production`.

## Instalación
1. Clona tu repositorio y sitúate en la carpeta del proyecto:
   - git clone <repo-url>
   - cd <repo-folder>
2. Asegúrate de tener Node.js instalado.

## Uso
Ejecuta el script pasando los códigos/tickets como argumentos:
- node app.js PROJ-123 PROJ-456

El script:
- Hace `git fetch --all`.
- Busca commits en `origin/staging` que contengan los códigos indicados.
- Compara esos commits con `origin/production`.
- Genera `commits.csv` en la raíz del proyecto.

Ejemplo:
- node app.js ABC-12 XYZ-99

## Salida
- commits.csv: contiene columnas
  - hash
  - author
  - date (ISO)
  - message
  - in_production (true / false)
  - cherry_pick_command (comando sugerido o nota)

Además el script imprime un resumen en consola indicando qué commits de staging no están en production y un comando `git cherry-pick` sugerido por commit.

## Notas y solución de problemas
- Si no ves resultados, asegúrate de que `origin/staging` y `origin/production` estén actualizadas (`git fetch --all`).
- El script ignora commits de merge.
- Mensajes con caracteres especiales son escapados en el CSV.
- Si aparece un error al ejecutar `git log`, revisa permisos, la existencia de las ramas y que el repositorio tenga historial en remoto.

## Licencia
Contenido y script para uso interno del proyecto.
