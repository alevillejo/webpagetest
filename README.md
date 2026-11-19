# Alejandro Villegas — Portfolio (static deployment test)

A fully independent static website: **HTML5, CSS3, vanilla JavaScript and JSON**.
No React, no Node.js, no npm, no bundler, no build step. Every file in this folder is the website.

> This is a deployment-test package. All content marked **Placeholder content / Contenido provisional**
> (12 projects, most images, the demo video and the demo audio, portrait, email, CV PDF and dates) is
> provisional and must be replaced with real material before the final launch.

---

## 1. Folder structure

```
index.html                 Project archive (home page, tag filters)
cv/index.html              CV page
projects/<slug>/index.html One folder per project (detail page)
404.html                   "Page not found" (GitHub Pages serves it automatically)
assets/css/styles.css      All styles. Colours = the dark/light tokens at the top.
assets/js/app.js           All behaviour: language, theme, filters, gallery, back-to-top
assets/images/             Local images
data/projects.json         Every project (bilingual text, tags, gallery, video, audio, links)
data/tags.json             Tag groups (Discipline, Format, Context, Recognition) and tags
data/cv.json               CV content and PDF links
data/site.json             Name, practice text, navigation and all interface text (ES/EN)
.nojekyll                  Tells GitHub Pages to publish files exactly as they are
robots.txt
```

All internal paths are **relative**. Each page declares where the site root is with
`<html data-root="...">` (`./` for the home page, `../` for `cv/`, `../../` for a project).
That is why the site works both at a domain root and inside a GitHub repository sub-folder
such as `https://username.github.io/alejandro-portfolio/`.

## 2. Test locally

The pages load JSON with `fetch`, so open the site through a small web server
(double-clicking `index.html` will not load the content).

```sh
cd path/to/this/folder
python3 -m http.server 8000
```

Open <http://localhost:8000/>.

To simulate a GitHub project site with a sub-folder:

```sh
mkdir -p /tmp/test && ln -s "$PWD" /tmp/test/alejandro-portfolio
cd /tmp/test && python3 -m http.server 8000
```

Open <http://localhost:8000/alejandro-portfolio/>.

## 3. Publish on GitHub Pages (no Actions, no build)

1. Create a new **public** repository on GitHub, e.g. `alejandro-portfolio`. Do not add a README.
2. Unzip `alejandro-villegas-portfolio-test.zip` on your computer.
3. In the new repository click **Add file → Upload files**. Open the unzipped folder, select
   **everything inside it** (including the hidden `.nojekyll` file — on macOS press
   `Cmd + Shift + .` in Finder to show hidden files) and drag it into the browser. `index.html`
   must end up at the top level of the repository, not inside another folder.
4. Click **Commit changes**.
5. Go to **Settings → Pages**. Under *Build and deployment* choose
   **Source: Deploy from a branch**, **Branch: `main`**, **Folder: `/ (root)`**, then **Save**.
6. Wait 1–2 minutes. The address appears at the top of the Pages settings:
   `https://<your-username>.github.io/alejandro-portfolio/`.

Using git instead of the browser:

```sh
cd path/to/unzipped/folder
git init && git add -A && git commit -m "Portfolio deployment test"
git branch -M main
git remote add origin https://github.com/<your-username>/alejandro-portfolio.git
git push -u origin main
```

Custom domain (later): Settings → Pages → *Custom domain*. Because all paths are relative,
nothing in the code needs to change.

Other static hosts (Cloudflare Pages, Netlify): upload the same folder; no build command,
output directory = the folder root.

## 4. Edit content

All content is in `data/`. Edit the JSON in any text editor, keep the quotes and commas valid
(paste into <https://jsonlint.com> if unsure), then upload the changed file again.

Bilingual text always has the form:

```json
{ "es": "Texto en español", "en": "English text" }
```

### Add a project

1. In `data/projects.json` copy an existing project block and change it. Required fields:
   `slug` (unique, lowercase, hyphens: `my-new-work`), `status` (`"published"` or `"draft"`),
   `placeholder` (`false` once the content is real), `title`, `year` (number or `null`), `type`,
   `shortDescription`, `description`, `medium`, `authorship`, `role`, `institutions`,
   `collaborators`, `credits`, `tags`, `gallery`, `videos`, `audio`, `links`.
2. Copy any folder in `projects/` and rename it to the new slug, e.g. `projects/my-new-work/`.
3. Open its `index.html` and change `data-slug="..."` to the new slug (and the `<title>` /
   description if you wish). Nothing else needs changing.

Projects with `"status": "draft"` are hidden from the archive and their pages show "not found".
Note: JSON files are public, so never put private information in drafts.

### Tags

Tags live in `data/tags.json`. A project lists tag `id`s in its `tags` array.
Filtering logic: tags **within one group** combine with OR; **different groups** combine with AND
(e.g. *Audio* or *Music*, and also *Installation*). The selection is kept in the address
(`?tags=audio,installation`), so filtered views can be shared.

### Images and captions

Put image files in `assets/images/` (optimised JPG/WebP, ~2000 px wide max) and add entries to
the project's `gallery` (the first image is also the archive thumbnail):

```json
{
  "src": "assets/images/my-work-01.jpg",
  "width": 2000, "height": 1333,
  "alt": { "es": "Descripción de la imagen", "en": "Image description" },
  "caption": { "es": "Pie de foto", "en": "Caption" },
  "credit": "Photographer name"
}
```

`src` is written from the site root (no leading `/`); full `https://` URLs also work.
`caption` and `credit` are optional; omit `src` to show a marked placeholder block.
The gallery opens a viewer with previous/next buttons, a counter, keyboard arrows, Escape to close
and swipe on mobile.

### Video (YouTube)

```json
"videos": [{ "youtubeId": "VIDEO_ID", "title": { "es": "…", "en": "…" } }]
```

`VIDEO_ID` is the part after `watch?v=` in the YouTube address. Embeds use youtube-nocookie.com.

### Audio (Cloudflare R2 or any public URL)

```json
"audio": [{ "url": "https://<your-bucket>.r2.dev/track.mp3", "mimeType": "audio/mpeg",
            "title": { "es": "…", "en": "…" }, "description": { "es": "…", "en": "…" } }]
```

The R2 bucket must allow public access. MP3 (`audio/mpeg`) plays in every browser.

### CV

Edit `data/cv.json`. To enable the PDF button, put the files in e.g. `assets/cv/` and set
`"pdf": { "es": "assets/cv/cv-es.pdf", "en": "assets/cv/cv-en.pdf" }`.

### Interface text, colours, fonts

- Interface labels (buttons, headings) in both languages: `data/site.json` → `text.es` / `text.en`.
- Colours: top of `assets/css/styles.css` (`[data-theme="dark"]` and `[data-theme="light"]`).
  Magenta (`--primary`) is the only accent.
- Fonts: IBM Plex Sans / Mono from Google Fonts, linked in each page's `<head>`.

## 5. Behaviour reference

- **Language:** ES/EN buttons. The choice is kept in the address (`?lang=en`) and remembered
  in the browser. Spanish is the default.
- **Theme:** sun/moon button. Dark is the default; the choice is remembered in the browser.
- **Back to top:** appears after scrolling down.
- **Requires JavaScript**; a short notice is shown if it is disabled.

## 6. Verified before delivery

Served from a local HTTP server at the root and under the simulated sub-folder
`/alejandro-portfolio/`: all 16 pages and every internal link, JSON loading from nested project
pages, all 300 single-tag and two-tag filter combinations against the OR/AND rule, ES/EN switching
(keeps the filters), dark/light (remembered between pages), gallery viewer (counter, arrows, Escape,
captions), image loading, audio playback, the 404 page, and layouts at 1440, 768 and 390 px in both
themes with no horizontal overflow. YouTube playback could not be exercised in the test browser;
the embed loads and should be checked once on the live GitHub address.
