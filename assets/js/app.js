/*
 * Alejandro Villegas — static portfolio.
 * One plain script for every page. Content lives in /data/*.json.
 * Every page sets <html data-root="..."> to the relative path of the site root,
 * so the site works on a domain root and inside a GitHub Pages sub-folder.
 */
(function () {
  "use strict";

  var ROOT = document.documentElement.getAttribute("data-root") || "./";
  var PAGE = document.body.getAttribute("data-page");
  var LANGS = ["es", "en"];
  var DEFAULT_LANG = "es";
  var params = new URLSearchParams(window.location.search);

  /* ---------- Small helpers ---------- */

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  /** Relative asset or page path → path from the current page. Absolute URLs are untouched. */
  function url(path) {
    if (/^(https?:)?\/\//.test(path) || path.indexOf("mailto:") === 0 || path.indexOf("tel:") === 0) return path;
    return ROOT + path;
  }

  function loadJson(name) {
    return fetch(url("data/" + name)).then(function (response) {
      if (!response.ok) throw new Error("Could not load " + name);
      return response.json();
    });
  }

  function storageGet(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }
  function storageSet(key, value) { try { localStorage.setItem(key, value); } catch (e) { /* Storage may be disabled. */ } }

  var ICONS = {
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>',
    moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
    chevronDown: '<path d="m6 9 6 6 6-6"/>',
    chevronLeft: '<path d="m15 18-6-6 6-6"/>',
    chevronRight: '<path d="m9 18 6-6-6-6"/>',
    close: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    arrowUp: '<path d="m5 12 7-7 7 7"/><path d="M12 19V5"/>'
  };
  function icon(name, size, className) {
    return '<svg' + (className ? ' class="' + className + '"' : "") + ' xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size +
      '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICONS[name] + "</svg>";
  }

  /* ---------- Language ---------- */

  function resolveLanguage() {
    var fromUrl = params.get("lang");
    if (LANGS.indexOf(fromUrl) !== -1) return fromUrl;
    var saved = storageGet("portfolio-language");
    return LANGS.indexOf(saved) !== -1 ? saved : DEFAULT_LANG;
  }
  var lang = resolveLanguage();
  storageSet("portfolio-language", lang);
  document.documentElement.lang = lang;

  /** Internal link that keeps the language (and optional extra query values). */
  function link(path, extra) {
    var query = new URLSearchParams(extra || {});
    query.set("lang", lang);
    return url(path) + "?" + query.toString();
  }

  /* ---------- Theme (applied early by the inline script in <head>) ---------- */

  function currentTheme() { return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark"; }

  /* ---------- Shared layout ---------- */

  function renderHeader(site, text) {
    var nav = site.navigation.map(function (item) {
      var active = (PAGE === "archive" && item.path === "") || (PAGE === "cv" && item.path === "cv/");
      return '<a href="' + link(item.path) + '"' + (active ? ' aria-current="page"' : "") + ">" + escapeHtml(item.label[lang]) + "</a>";
    }).join("");
    var languages = LANGS.map(function (option) {
      return '<button type="button" lang="' + option + '" data-lang="' + option + '" aria-pressed="' + (option === lang) + '">' + option.toUpperCase() + "</button>";
    }).join("");
    var header = document.getElementById("site-header");
    header.innerHTML =
      '<a class="wordmark" href="' + link("") + '">' + escapeHtml(site.profile.name) + "</a>" +
      '<nav aria-label="' + escapeHtml(text.mainNavigation) + '" class="main-nav">' + nav + "</nav>" +
      '<div class="header-controls">' +
      '<div role="group" aria-label="' + escapeHtml(text.language) + '" class="language-controls">' + languages + "</div>" +
      '<button type="button" class="theme-toggle"></button></div>';

    header.querySelectorAll("[data-lang]").forEach(function (button) {
      button.addEventListener("click", function () {
        var next = new URLSearchParams(window.location.search);
        next.set("lang", button.getAttribute("data-lang"));
        storageSet("portfolio-language", button.getAttribute("data-lang"));
        window.location.search = next.toString().replace(/%2C/gi, ",");
      });
    });

    var toggle = header.querySelector(".theme-toggle");
    function paintToggle() {
      var dark = currentTheme() === "dark";
      var label = dark ? text.lightTheme : text.darkTheme;
      toggle.setAttribute("aria-label", label);
      toggle.title = label;
      toggle.innerHTML = icon(dark ? "sun" : "moon", 16);
    }
    toggle.addEventListener("click", function () {
      var next = currentTheme() === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      storageSet("portfolio-theme", next);
      paintToggle();
    });
    paintToggle();

    var skip = document.querySelector(".skip-link");
    if (skip) skip.textContent = text.skipToContent;
  }

  function renderFooter(lang) {
    document.getElementById("site-footer").innerHTML = "<span>© Alejandro Villegas</span><span>" +
      (lang === "es" ? "Archivo en construcción · contenido provisional señalado" : "Archive in progress · placeholder content marked") + "</span>";
  }

  function renderBackToTop(text) {
    var button = document.createElement("button");
    button.type = "button";
    button.className = "back-to-top";
    button.setAttribute("aria-label", text.backToTop);
    button.title = text.backToTop;
    button.innerHTML = icon("arrowUp", 18);
    document.body.appendChild(button);
    function update() {
      var visible = window.scrollY > 600;
      button.setAttribute("data-visible", String(visible));
      button.setAttribute("aria-hidden", String(!visible));
      button.tabIndex = visible ? 0 : -1;
    }
    button.addEventListener("click", function () {
      var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
    });
    window.addEventListener("scroll", update, { passive: true });
    update();
  }

  function setMeta(title, description) {
    document.title = title;
    var meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", description);
  }

  /* ---------- Shared content pieces ---------- */

  function placeholderBadge(text, show) { return show ? '<span class="placeholder-badge mono">' + escapeHtml(text.placeholder) + "</span>" : ""; }

  function imageHtml(image, text, eager) {
    if (!image.src) {
      return '<div class="image-placeholder" role="img" aria-label="' + escapeHtml(image.alt[lang]) + '" style="aspect-ratio:' + image.width + " / " + image.height + '"><span>' + escapeHtml(text.placeholderImage) + "</span></div>";
    }
    return '<img src="' + escapeHtml(url(image.src)) + '" alt="' + escapeHtml(image.alt[lang]) + '" width="' + image.width + '" height="' + image.height + '" loading="' + (eager ? "eager" : "lazy") + '" decoding="async">';
  }

  function captionHtml(image, text) {
    if (!image.caption && !image.credit) return "";
    return "<figcaption>" + escapeHtml(image.caption ? image.caption[lang] : "") +
      (image.credit ? '<span class="image-credit"> · ' + escapeHtml(text.photoCredit) + ": " + escapeHtml(image.credit) + "</span>" : "") + "</figcaption>";
  }

  function tagLabel(tags, id) {
    for (var i = 0; i < tags.length; i++) if (tags[i].id === id) return tags[i].label[lang];
    return id;
  }

  function published(projects) { return projects.filter(function (project) { return project.status === "published"; }); }

  /* ---------- Tag filtering: OR inside a group, AND across groups ---------- */

  function filterProjects(projects, selected, tags) {
    var byGroup = {};
    selected.forEach(function (id) {
      var tag = tags.find(function (item) { return item.id === id; });
      if (tag) (byGroup[tag.group] = byGroup[tag.group] || []).push(id);
    });
    var groups = Object.keys(byGroup).map(function (key) { return byGroup[key]; });
    return projects.filter(function (project) {
      return groups.every(function (ids) { return ids.some(function (id) { return project.tags.indexOf(id) !== -1; }); });
    });
  }

  function countText(text, n) { return (n === 1 ? text.projectsFound.one : text.projectsFound.other).replace("{n}", n); }

  /* ---------- Archive page ---------- */

  function renderArchive(site, text, projects, tagData) {
    var tags = tagData.tags;
    var list = published(projects);
    var selected = (params.get("tags") || "").split(",").map(function (id) { return id.trim(); })
      .filter(function (id) { return id && tags.some(function (tag) { return tag.id === id; }); });
    var main = document.getElementById("main-content");
    var panelOpen = false;

    setMeta(site.profile.name + " — " + text.portfolio, site.profile.practice[lang]);

    function writeUrl() {
      var next = new URLSearchParams(window.location.search);
      if (selected.length) next.set("tags", selected.join(",")); else next.delete("tags");
      next.set("lang", lang);
      // Keep commas readable in the address bar: ?tags=audio,installation
      history.replaceState(null, "", "?" + next.toString().replace(/%2C/gi, ","));
    }

    function toggle(id) {
      selected = selected.indexOf(id) === -1 ? selected.concat(id) : selected.filter(function (item) { return item !== id; });
      writeUrl(); draw();
    }
    function reset() { selected = []; writeUrl(); draw(); }

    function filtersHtml(matchCount) {
      var groups = tagData.groups.map(function (group) {
        var buttons = tags.filter(function (tag) { return tag.group === group.id; }).map(function (tag) {
          return '<button type="button" class="filter-tag" data-tag="' + escapeHtml(tag.id) + '" aria-pressed="' + (selected.indexOf(tag.id) !== -1) + '">' + escapeHtml(tag.label[lang]) + "</button>";
        }).join("");
        return '<div class="filter-group" role="group" aria-labelledby="filter-group-' + group.id + '"><h3 id="filter-group-' + group.id + '" class="filter-group-label mono">' +
          escapeHtml(group.label[lang]) + '</h3><div class="filter-tags">' + buttons + "</div></div>";
      }).join("");
      var chips = selected.map(function (id) {
        var label = tagLabel(tags, id);
        return '<li><button type="button" data-tag="' + escapeHtml(id) + '" aria-label="' + escapeHtml(text.removeFilter + ": " + label) + '">' + escapeHtml(label) + " ×</button></li>";
      }).join("");
      return '<section class="filters" aria-label="' + escapeHtml(text.filters) + '"><div class="filter-bar">' +
        '<details class="filter-disclosure"' + (panelOpen ? " open" : "") + '><summary class="mono"><span>' + escapeHtml(text.filters) + "</span>" +
        (selected.length ? '<span class="filter-count">' + selected.length + "</span>" : "") + icon("chevronDown", 14, "filter-chevron") + "</summary>" +
        '<div class="filter-groups">' + groups + "</div></details></div>" +
        '<div class="filter-status mono" aria-live="polite"><span>' + escapeHtml(countText(text, matchCount)) + "</span>" +
        (selected.length ? '<ul class="active-filters" aria-label="' + escapeHtml(text.activeFilters) + '">' + chips + '</ul><button type="button" class="reset-filters" data-reset>' + escapeHtml(text.clearAll) + "</button>" : "") +
        "</div></section>";
    }

    function rowHtml(project) {
      var image = project.gallery[0];
      var rowTags = project.tags.map(function (id) { return "<li>" + escapeHtml(tagLabel(tags, id)) + "</li>"; }).join("");
      return '<li><a class="project-row" href="' + link("projects/" + project.slug + "/") + '">' +
        '<div class="row-image">' + (image ? imageHtml(image, text, false) : "") + "</div>" +
        '<h2 class="row-title">' + escapeHtml(project.title[lang]) + placeholderBadge(text, project.placeholder) + "</h2>" +
        '<span class="row-year mono">' + (project.year || "—") + "</span>" +
        '<span class="row-medium mono">' + escapeHtml(project.medium[lang]) + "</span>" +
        '<ul class="row-tags mono" aria-label="' + escapeHtml(text.tags) + '">' + rowTags + "</ul></a></li>";
    }

    function draw() {
      var details = main.querySelector(".filter-disclosure");
      if (details) panelOpen = details.open;
      var visible = filterProjects(list, selected, tags);
      var intro = '<section class="archive-intro"><h1 class="mono">' + escapeHtml(text.archive) + "</h1><p>" + escapeHtml(site.profile.practice[lang]) + "</p></section>";
      if (!list.length) { main.innerHTML = intro + '<p class="empty-state">' + escapeHtml(text.noProjects) + "</p>"; return; }
      var results = visible.length
        ? '<ol class="project-rows">' + visible.map(rowHtml).join("") + "</ol>"
        : '<div class="empty-state"><p>' + escapeHtml(text.noMatches) + '</p><button type="button" class="reset-filters mono" data-reset>' + escapeHtml(text.resetFilters) + "</button></div>";
      var focused = document.activeElement && document.activeElement.classList.contains("filter-tag") ? document.activeElement.getAttribute("data-tag") : null;
      main.innerHTML = intro + filtersHtml(visible.length) + results;
      main.querySelectorAll("[data-tag]").forEach(function (button) {
        button.addEventListener("click", function () { toggle(button.getAttribute("data-tag")); });
      });
      main.querySelectorAll("[data-reset]").forEach(function (button) { button.addEventListener("click", reset); });
      // Keep keyboard focus on the filter that was just pressed.
      if (focused) { var again = main.querySelector('.filter-tag[data-tag="' + focused + '"]'); if (again) again.focus(); }
    }
    draw();
  }

  /* ---------- Gallery and lightbox ---------- */

  function galleryHtml(project, text) {
    var total = project.gallery.length;
    if (!total) return "";
    var items = project.gallery.map(function (image, index) {
      return "<li" + (index === 0 ? ' class="gallery-lead"' : "") + '><figure><button type="button" class="gallery-open" data-index="' + index + '" aria-label="' +
        escapeHtml(text.openImage + " " + (index + 1) + " / " + total) + '">' + imageHtml(image, text, index === 0) + "</button>" + captionHtml(image, text) + "</figure></li>";
    }).join("");
    var arrows = total > 1
      ? '<button type="button" class="lightbox-button lightbox-prev" aria-label="' + escapeHtml(text.previousImage) + '" title="' + escapeHtml(text.previousImage) + '">' + icon("chevronLeft", 22) + "</button>" +
        '<button type="button" class="lightbox-button lightbox-next" aria-label="' + escapeHtml(text.nextImage) + '" title="' + escapeHtml(text.nextImage) + '">' + icon("chevronRight", 22) + "</button>"
      : "";
    return '<section class="detail-section" aria-label="' + escapeHtml(text.gallery) + '"><h2 class="section-label">' + escapeHtml(text.gallery) + ' <span class="gallery-total">· ' + total + "</span></h2>" +
      '<ol class="gallery">' + items + "</ol>" +
      '<dialog class="lightbox" aria-label="' + escapeHtml(text.imageViewer) + '"><div class="lightbox-bar mono"><span aria-live="polite" class="lightbox-counter"></span>' +
      '<button type="button" class="lightbox-button lightbox-close" aria-label="' + escapeHtml(text.closeViewer) + '" title="' + escapeHtml(text.closeViewer) + '">' + icon("close", 18) + "</button></div>" +
      '<figure class="lightbox-figure"></figure>' + arrows + "</dialog></section>";
  }

  function setupGallery(project, text) {
    var dialog = document.querySelector(".lightbox");
    if (!dialog) return;
    var images = project.gallery;
    var index = 0;
    var touchStartX = null;
    var figure = dialog.querySelector(".lightbox-figure");

    function show() {
      var image = images[index];
      dialog.querySelector(".lightbox-counter").textContent = (index + 1) + " / " + images.length;
      figure.innerHTML = '<div class="lightbox-image">' + imageHtml(image, text, true) + "</div>" + captionHtml(image, text);
    }
    function step(delta) { index = (index + delta + images.length) % images.length; show(); }

    document.querySelectorAll(".gallery-open").forEach(function (button) {
      button.addEventListener("click", function () { index = Number(button.getAttribute("data-index")); show(); dialog.showModal(); });
    });
    dialog.querySelector(".lightbox-close").addEventListener("click", function () { dialog.close(); });
    var prev = dialog.querySelector(".lightbox-prev");
    var next = dialog.querySelector(".lightbox-next");
    if (prev) prev.addEventListener("click", function () { step(-1); });
    if (next) next.addEventListener("click", function () { step(1); });
    dialog.addEventListener("click", function (event) { if (event.target === dialog) dialog.close(); });
    // Escape closes <dialog> natively.
    window.addEventListener("keydown", function (event) {
      if (!dialog.open || images.length < 2) return;
      if (event.key === "ArrowLeft") step(-1);
      if (event.key === "ArrowRight") step(1);
    });
    figure.addEventListener("touchstart", function (event) { touchStartX = event.touches[0] ? event.touches[0].clientX : null; }, { passive: true });
    figure.addEventListener("touchend", function (event) {
      if (touchStartX === null || images.length < 2) return;
      var distance = event.changedTouches[0].clientX - touchStartX;
      touchStartX = null;
      if (Math.abs(distance) >= 40) step(distance < 0 ? 1 : -1);
    });
  }

  /* ---------- Project page ---------- */

  function notFoundHtml(text, title) {
    return '<section class="not-found"><p class="code mono">404</p><h1 class="detail-title">' + escapeHtml(title) + "</h1>" +
      '<a class="back-link mono" href="' + link("") + '">← ' + escapeHtml(text.backToProjects) + "</a></section>";
  }

  function renderProject(site, text, projects, tagData) {
    var slug = document.body.getAttribute("data-slug");
    var project = published(projects).find(function (item) { return item.slug === slug; });
    var main = document.getElementById("main-content");
    if (!project) {
      setMeta(text.projectNotFound + " — " + site.profile.name, text.projectNotFound);
      main.innerHTML = notFoundHtml(text, text.projectNotFound);
      return;
    }
    setMeta(project.title[lang] + " — " + site.profile.name, project.shortDescription[lang]);

    var facts = [
      [text.year, project.year ? String(project.year) : text.yearPending],
      [text.medium, project.medium[lang]],
      [text.type, text.projectTypes[project.type]],
      [text.authorship, text[project.authorship]],
      [text.role, project.role[lang]]
    ];
    if (project.institutions.length) facts.push([text.institutions, project.institutions.join(", ")]);
    if (project.collaborators.length) facts.push([text.collaborators, project.collaborators.join(", ")]);
    var factsHtml = facts.map(function (fact) { return '<div><dt class="mono">' + escapeHtml(fact[0]) + "</dt><dd>" + escapeHtml(fact[1]) + "</dd></div>"; }).join("");
    var tagLinks = project.tags.map(function (id) { return '<li><a href="' + link("", { tags: id }) + '">' + escapeHtml(tagLabel(tagData.tags, id)) + "</a></li>"; }).join("");

    var videos = project.videos.length
      ? '<section class="detail-section"><h2 class="section-label">' + escapeHtml(text.video) + "</h2>" + project.videos.map(function (video) {
          return '<figure class="video-frame"><iframe src="https://www.youtube-nocookie.com/embed/' + encodeURIComponent(video.youtubeId) + '" title="' + escapeHtml(video.title[lang]) +
            '" loading="lazy" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe><figcaption>' +
            escapeHtml(video.title[lang]) + "</figcaption></figure>";
        }).join("") + "</section>"
      : "";
    var audio = project.audio.length
      ? '<section class="detail-section"><h2 class="section-label">' + escapeHtml(text.audio) + '</h2><ol class="audio-list">' + project.audio.map(function (track, index) {
          return '<li><div class="audio-meta"><span class="mono">' + String(index + 1).padStart(2, "0") + "</span><div><p>" + escapeHtml(track.title[lang]) + "</p>" +
            (track.description ? '<p class="muted">' + escapeHtml(track.description[lang]) + "</p>" : "") + "</div></div>" +
            '<audio controls preload="none" aria-label="' + escapeHtml(track.title[lang]) + '"><source src="' + escapeHtml(track.url) + '" type="' + escapeHtml(track.mimeType) + '"></audio></li>';
        }).join("") + "</ol></section>"
      : "";
    var credits = project.credits.length
      ? '<section class="detail-section"><h2 class="section-label">' + escapeHtml(text.credits) + '</h2><ul class="plain-list">' + project.credits.map(function (credit) {
          return "<li><span>" + escapeHtml(credit.name) + '</span><span class="muted">' + escapeHtml(credit.contribution[lang]) + "</span></li>";
        }).join("") + "</ul></section>"
      : "";
    var links = project.links.length
      ? '<section class="detail-section"><h2 class="section-label">' + escapeHtml(text.externalLinks) + '</h2><ul class="plain-list">' + project.links.map(function (item) {
          return '<li><a href="' + escapeHtml(item.url) + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(item.label[lang]) + " ↗</a></li>";
        }).join("") + "</ul></section>"
      : "";

    main.className = "page project-detail";
    main.innerHTML =
      '<a class="back-link mono" href="' + link("") + '">← ' + escapeHtml(text.backToProjects) + "</a>" +
      '<header class="detail-header">' + (project.placeholder ? '<p class="placeholder-badge mono">' + escapeHtml(text.placeholder) + "</p>" : "") +
      '<h1 class="detail-title">' + escapeHtml(project.title[lang]) + '</h1><p class="detail-lede">' + escapeHtml(project.shortDescription[lang]) + "</p></header>" +
      '<div class="detail-body"><dl class="facts">' + factsHtml + '<div><dt class="mono">' + escapeHtml(text.tags) + '</dt><dd><ul class="row-tags mono">' + tagLinks + "</ul></dd></div></dl>" +
      '<p class="detail-description">' + escapeHtml(project.description[lang]) + "</p></div>" +
      galleryHtml(project, text) + videos + audio + credits + links;
    setupGallery(project, text);
  }

  /* ---------- CV page ---------- */

  function renderCv(site, text, projects, cv) {
    setMeta("CV — " + site.profile.name, lang === "es" ? "Biografía, experiencia, obras y reconocimientos de Alejandro Villegas." : "Biography, experience, works and recognitions of Alejandro Villegas.");
    function entries(list) {
      return '<ul class="cv-entries">' + list.map(function (entry) {
        return '<li><span class="mono muted">' + escapeHtml(entry.period) + "</span><div><p>" + escapeHtml(entry.title[lang]) + placeholderBadge(text, entry.placeholder) +
          '</p><p class="muted">' + escapeHtml(entry.detail[lang]) + "</p></div></li>";
      }).join("") + "</ul>";
    }
    function section(label, body) { return '<section class="cv-section"><h2 class="section-label">' + escapeHtml(label) + "</h2>" + body + "</section>"; }
    var pdf = cv.pdf[lang];
    var contact = '<ul class="cv-entries">' + cv.contact.map(function (item) {
      var value = item.href ? '<a href="' + escapeHtml(item.href) + '">' + escapeHtml(item.value) + "</a>" : escapeHtml(item.value);
      return '<li><span class="mono muted">' + escapeHtml(item.label[lang]) + "</span><div><p>" + value + placeholderBadge(text, item.placeholder) + "</p></div></li>";
    }).join("") + "</ul>";
    var works = '<ul class="cv-entries">' + cv.selectedWorks.map(function (slug) {
      return published(projects).find(function (project) { return project.slug === slug; });
    }).filter(Boolean).map(function (project) {
      return '<li><span class="mono muted">' + (project.year || "—") + '</span><div><p><a href="' + link("projects/" + project.slug + "/") + '">' + escapeHtml(project.title[lang]) + "</a></p></div></li>";
    }).join("") + "</ul>";

    document.getElementById("main-content").innerHTML =
      '<section class="cv-head"><div class="portrait image-placeholder" role="img" aria-label="' + escapeHtml(cv.portrait.alt[lang]) + '"><span>' + escapeHtml(text.placeholderImage) + "</span></div>" +
      '<div><h1 class="detail-title">' + escapeHtml(site.profile.name) + '</h1><h2 class="section-label">' + escapeHtml(text.biography) + '</h2><p class="detail-description">' + escapeHtml(cv.biography[lang]) + "</p>" +
      (pdf ? '<a class="cv-download mono" href="' + escapeHtml(url(pdf)) + '" download>' + escapeHtml(text.downloadCv) + " ↓</a>" : '<span class="cv-download mono" aria-disabled="true">' + escapeHtml(text.cvPending) + "</span>") +
      "</div></section>" +
      section(text.contact, contact) + section(text.experience, entries(cv.experience)) + section(text.selectedWorks, works) +
      section(text.exhibitions, entries(cv.exhibitions)) + section(text.awards, entries(cv.awards)) +
      section(text.institutionsAndCollaborations, '<p class="institution-list">' + escapeHtml(cv.institutions.join(" · ")) + "</p>");
  }

  /* ---------- Start ---------- */

  Promise.all([loadJson("site.json"), loadJson("projects.json"), loadJson("tags.json"), loadJson("cv.json")])
    .then(function (data) {
      var site = data[0], projects = data[1].projects, tags = data[2], cv = data[3];
      var text = site.text[lang];
      renderHeader(site, text);
      renderFooter(lang);
      renderBackToTop(text);
      if (PAGE === "archive") renderArchive(site, text, projects, tags);
      else if (PAGE === "project") renderProject(site, text, projects, tags);
      else if (PAGE === "cv") renderCv(site, text, projects, cv);
      else {
        setMeta(text.pageNotFound + " — " + site.profile.name, text.pageNotFoundDescription);
        document.getElementById("main-content").innerHTML = notFoundHtml(text, text.pageNotFound);
      }
    })
    .catch(function (error) {
      console.error(error);
      document.getElementById("main-content").innerHTML =
        '<p class="page-loading">' + (lang === "es"
          ? "No se ha podido cargar el contenido. Abre el sitio desde un servidor web (no como archivo local)."
          : "The content could not be loaded. Open the site from a web server (not as a local file).") + "</p>";
    });
})();
