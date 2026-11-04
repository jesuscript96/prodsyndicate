# Google Ads · campaña de búsqueda «Encaja»

Primera fase de la campaña, solo en la Red de Búsqueda de Google. Hay un grupo de anuncios por landing y cada búsqueda llega a la landing que responde a su intención.

- **Textos, palabras clave y recursos, con los caracteres contados:** [google-ads/textos.md](google-ads/textos.md).
- **Archivos para Google Ads Editor:** [anuncios.csv](google-ads/anuncios.csv), [palabras-clave.csv](google-ads/palabras-clave.csv) y [negativas.txt](google-ads/negativas.txt).
- **Imágenes sin logotipo superpuesto y logotipos:** `assets/encaja/google-ads/`.
- **Para cambiar cualquier texto:** edita `scripts/encaja/google-ads.mjs` y ejecuta `npm run encaja:google-ads`. El script falla si algo se pasa del límite.

## 1. Antes de lanzar

Sin estos dos puntos, los clics llegan a una landing que solo ofrece el email y no hay ninguna conversión que medir.

1. **Agenda activa.** Configura Google Calendar y Turnstile en Vercel siguiendo [agenda-google.md](../agenda-google.md). Después reserva con otro email tuyo y comprueba que llegan la invitación con Google Meet y el one pager.
2. **Conversión «Llamada reservada».** La web envía el evento `generate_lead` a Google Tag Manager cada vez que alguien reserva.
   - **En Google Ads:** ve a Objetivos, luego Conversiones y crea una acción nueva de sitio web, configurada manualmente. Llámala «Llamada reservada», con categoría «Reservar cita» y recuento «Una». Copia el ID y la etiqueta de conversión.
   - **En Tag Manager (GTM-K3ZHSP9S):** crea un activador de evento personalizado con el nombre `generate_lead` y una etiqueta «Seguimiento de conversiones de Google Ads» con ese ID y esa etiqueta. Añade la etiqueta «Vinculación de conversiones» en todas las páginas si no existe, y publica el contenedor.
   - **Prueba:** abre la vista previa de Tag Manager y haz una reserva.
   - **Opcional:** crea una conversión secundaria con el clic en el email, con un activador de clic en enlaces cuya URL empieza por `mailto:`. Márcala como secundaria para que no guíe la puja.
3. **Medición.** Deja activado el etiquetado automático y vincula Google Ads con GA4 (G-MHXH3R4RX3). El modo de consentimiento ya está en la web.

## 2. Configuración de la campaña

| Ajuste | Valor | Por qué |
|---|---|---|
| Tipo y objetivo | Búsqueda · Clientes potenciales | Captas a quien ya está buscando una solución |
| Redes | Solo la Búsqueda de Google, sin socios ni Display | Controlas en qué se gasta el presupuesto |
| Ubicación | España · personas que están o suelen estar allí | Es donde vas a vender al empezar |
| Idioma | Español | |
| Presupuesto diario | Tu presupuesto mensual entre 30,4 | Google reparte el gasto por días |
| Puja al empezar | Maximizar clics, con un límite de CPC máximo | Acumulas datos sin que se dispare el coste por clic |
| Puja después | Maximizar conversiones, cuando haya reservas de forma estable | La orientación habitual es unas 15 conversiones en 30 días |
| Concordancias | Frase y exacta, sin concordancia amplia al principio | Cada búsqueda llega al grupo que le corresponde |
| Programación | Todos los días; revisa por franjas a las 2 o 3 semanas | Primero hay que ver cuándo busca tu cliente |
| Sufijo de URL final | Ver [textos.md](google-ads/textos.md) | La web guarda los `utm_*` y los adjunta a la reserva |
| Recursos | Enlaces de sitio, textos destacados, fragmento, imágenes y logotipo | Anuncios más grandes y más clics por el mismo precio |
| Nombre de la empresa | AUTOMATO | |

## 3. Grupos de anuncios

| Grupo | Landing | Intención | Imágenes |
|---|---|---|---|
| Tiempo · trabajo manual | `/encaja/tiempo` | Quitarse trabajo manual, salir del Excel, dejar de perseguir pedidos y stock | 11, 10, 28 |
| Procesos · automatización e integraciones | `/encaja/procesos` | Automatizar procesos, conectar programas, aplicar IA | 33, 06 |
| Crecer · software a medida | `/encaja/crecer` | Software a medida, digitalizar una empresa que ha crecido | 18, 25 |

- **Cada grupo lleva un anuncio adaptable.** Tiene 15 títulos y 4 descripciones, y tres títulos del ángulo van fijados en la posición 1 para que el anuncio siempre hable de lo que busca la persona.
- **Por qué «Crecer» recibe las búsquedas de software a medida.** Su mensaje convence a quien todavía no está buscando nada. En búsqueda funciona como destino de quien ya quiere software a medida o digitalizarse, porque su titular, «Tu empresa ha crecido. Tus herramientas, todavía no.», responde a esa intención.

## 4. Subirlo con Google Ads Editor

1. Crea la campaña con la configuración del apartado 2.
2. Importa `palabras-clave.csv` y `anuncios.csv` desde Cuenta, Importar, Desde archivo. Revisa el mapeo de columnas antes de aceptar.
3. Crea una lista de palabras negativas en la biblioteca compartida, pega `negativas.txt` y aplícala a la campaña.
4. Sube las imágenes de cada grupo desde `assets/encaja/google-ads/imagenes/`, en formato cuadrado y horizontal, y los logotipos desde `assets/encaja/google-ads/logos/`.
5. Añade los enlaces de sitio, los textos destacados y el fragmento estructurado de [textos.md](google-ads/textos.md).

## 5. Las primeras semanas

- **Semana 1:** revisa cada día el informe de términos de búsqueda y añade como negativas las búsquedas que no son de un posible cliente. No cambies los anuncios: el sistema necesita impresiones para aprender.
- **Semanas 2 y 3:** pausa las palabras clave que gastan sin generar visitas útiles y mira qué grupo consigue reservas.
- **A partir de la semana 4:** compara las tres landings por porcentaje de reservas, en Google Ads y en GA4. Mueve presupuesto hacia lo que funcione y, cuando haya reservas estables, cambia la puja a Maximizar conversiones.

## 6. Fuera de esta fase

Meta (Instagram y Facebook) queda para más adelante. Los formatos 4:5 y 9:16, el vídeo y sus textos están localizados en [README.md](README.md).
