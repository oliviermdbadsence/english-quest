# English Quest

Juego de inglés para niños, estático, sin servidor y sin base de datos. Ocho mundos, diez retos aleatorios por partida y un perfil por jugador guardado en el navegador.

Los mundos son Numbers Island, Hello Town, Library Castle, Zoo Jungle, Olympic Stadium, Body Safari, Fashion Planet y Chocolate Kingdom. Cada ronda mezcla preguntas de opción múltiple, deletreo con fichas y ordenar palabras. Con 7 aciertos o más se abre el siguiente mundo (7 = 1 estrella, 8–9 = 2, 10 = 3). Cada acierto suma 10 monedas y, a partir de tres seguidos, 15. El botón de escuchar usa síntesis de voz en inglés británico (`en-GB`) cuando el dispositivo tiene esa voz.

## Arranque local

```bash
npm ci
npm run dev
```

La versión que se publica se genera con:

```bash
npm ci && npm run build
```

El resultado queda en `dist/`. Para verlo: `npm run preview`.

## Despliegue en Render (sitio estático)

El repo incluye [`render.yaml`](render.yaml). En el Dashboard: **New → Blueprint**, conecta este repositorio y Render crea un sitio estático (no un web service).

Si creas el sitio a mano (**New → Static Site**), usa estos valores:

| Ajuste en Render | Valor |
| --- | --- |
| Build command | `npm ci && npm run build` |
| Publish directory | `dist` |

En el Blueprint el directorio de publicación es `./dist` (`staticPublishPath`). Node 22 queda fijado con la variable `NODE_VERSION`.

Regla de reescritura, para que cualquier ruta sirva la app:

| Source | Action | Destination |
| --- | --- | --- |
| `/*` | Rewrite | `/index.html` |

Render no aplica esa regla cuando el archivo existe, así que JS y CSS de `/assets/` se sirven tal cual. No hace falta comando de arranque, disco, base de datos ni variables secretas.

## Perfiles y guardado

Al abrir aparece **¿Quién juega?**. Cada perfil tiene nombre, avatar y su propio progreso: mundos abiertos, estrellas, monedas, mejor puntuación y, si se cerró la pestaña a medias, la ronda en curso (o la pantalla de resultado). Se puede cambiar de jugador desde el mapa. En **Zona de padres** se puede renombrar, borrar el perfil o reiniciar su progreso; borrar y reiniciar piden confirmación.

La clave es `english-quest`, esquema **v1**. Un guardado antiguo `english-quest-v1` (un solo `{ stars, coins }`) se importa una vez como el jugador «Jugador». Si el navegador tiene un esquema más nuevo, el juego no lo sobrescribe.

## Limitaciones

- El progreso vive en `localStorage` de ese navegador y ese dispositivo. No se sincroniza entre aparatos, y se pierde si se borran los datos del sitio o se usa una ventana privada que no conserva almacenamiento.
- La pantalla de resultado se vuelve a mostrar si se elige al jugador otra vez; cerrar la pestaña no borra las estrellas ni las monedas ya sumadas.
- La voz depende del sistema. Se pide `en-GB` y una voz británica si existe. Sin síntesis de voz, el botón no suena y el resto del juego sigue igual.
- No hay cuentas, ranking en línea ni panel de administración fuera del propio dispositivo.
