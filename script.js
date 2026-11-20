// Currículo — Phillip Miranda · interações
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  // ---------- Toast ----------
  const toast = $("#toast");
  let toastTimer;
  const showToast = (msg) => {
    toast.textContent = msg;
    toast.classList.add("is-on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("is-on"), 2200);
  };

  // ---------- Foto: toque no celular alterna P&B / colorida ----------
  const photo = $(".photo");
  photo.addEventListener("click", () => photo.classList.toggle("is-color"));

  // ---------- Exportar PDF ----------
  $("#btnPdf").addEventListener("click", () => {
    const original = document.title;
    document.title = "Curriculo_Phillip_Miranda"; // nome sugerido do arquivo
    showToast("Escolha “Salvar como PDF” no destino da impressão");
    setTimeout(() => {
      window.print();
      document.title = original;
    }, 350);
  });

  // ---------- Copiar e-mail ----------
  $$("[data-copy]").forEach((btn) =>
    btn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(btn.dataset.copy);
        showToast("E-mail copiado!");
      } catch {
        window.location.href = `mailto:${btn.dataset.copy}`;
      }
    })
  );

  // ---------- Linha do tempo: abrir / fechar ----------
  $$(".item__head").forEach((head) =>
    head.addEventListener("click", () => {
      const item = head.closest(".item");
      const open = item.classList.toggle("is-open");
      head.setAttribute("aria-expanded", open);
    })
  );

  // ---------- Filtro de cursos ----------
  const chips = $$(".chip");
  chips.forEach((chip) =>
    chip.addEventListener("click", () => {
      chips.forEach((c) => c.classList.toggle("is-active", c === chip));
      const f = chip.dataset.filter;
      $$(".courses li").forEach((li) =>
        li.classList.toggle("is-hidden", f !== "all" && li.dataset.cat !== f)
      );
    })
  );

  // ---------- Contadores ----------
  const countUp = (el) => {
    const end = +el.dataset.count;
    const t0 = performance.now();
    const dur = 1100;
    const step = (t) => {
      const p = Math.min((t - t0) / dur, 1);
      el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  // ---------- Animações de entrada ----------
  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add("is-in");
        $$("[data-count]", e.target).forEach(countUp);
        io.unobserve(e.target);
      }),
    { threshold: 0.12 }
  );
  $$(".reveal, .side").forEach((el) => io.observe(el));

  // ---------- Menu: destaca a seção atual ----------
  const links = $$(".toolbar__links a");
  const spy = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        links.forEach((a) => a.classList.toggle("is-current", a.hash === `#${e.target.id}`));
      }),
    { rootMargin: "-45% 0px -50% 0px" }
  );
  $$(".content section[id]").forEach((s) => spy.observe(s));

  // ---------- PDF: monta duas folhas A4 fixas a partir do conteúdo do site ----------
  const clone = (el) => {
    const c = el.cloneNode(true);
    [c, ...$$("[id]", c)].forEach((n) => n.removeAttribute("id"));
    [c, ...$$(".reveal", c)].forEach((n) => n.classList.remove("reveal"));
    $$("[data-count]", c).forEach((n) => (n.textContent = n.dataset.count));
    $$(".is-hidden", c).forEach((n) => n.classList.remove("is-hidden"));
    $$(".item", c).forEach((n) => n.classList.add("is-open"));
    return c;
  };
  const make = (tag, cls, children = []) => {
    const el = document.createElement(tag);
    if (cls) el.className = cls;
    children.forEach((ch) => el.appendChild(ch));
    return el;
  };
  const sheet = (sideNodes, mainNodes) =>
    make("section", "sheet", [
      make("aside", "sheet__side side", [make("div", "fit", sideNodes)]),
      make("div", "sheet__main content", [make("div", "fit", mainNodes)]),
    ]);

  const buildPrint = () => {
    $("#print-root")?.remove();
    const blocks = $$(".side .side-block"); // 0 Contato · 1 Competências · 2 Idiomas · 3 Ferramentas
    const sec = (id) => clone($(`#${id}`));

    // Folha 1: foto, identidade, contato, competências | Perfil + Experiência
    const side1 = [clone($(".photo")), make("div", "side__inner", [clone($(".identity")), clone(blocks[0]), clone(blocks[1])])];
    const main1 = [sec("perfil"), sec("experiencia")];

    // Folha 2: nome, idiomas, ferramentas | Projetos + Formação + Cursos
    const head = document.createElement("div");
    head.className = "side-head";
    head.innerHTML = '<h1>Phillip<br>Miranda</h1><p class="role">Desenvolvedor Pleno</p><span class="rule"></span>';
    // Formação vai para a lateral da folha 2, em lista compacta
    const edu = document.createElement("section");
    edu.className = "side-block edu-side";
    edu.innerHTML =
      '<h2>Formação</h2><span class="rule"></span><ul>' +
      $$("#formacao .timeline--edu > li")
        .map((li) => {
          const [meta, body] = li.children;
          const title = body.querySelector("b").textContent;
          const inst = meta.querySelector("b").textContent;
          const when = meta.querySelector("span").textContent;
          return `<li><b>${title}</b><small>${inst} · ${when}</small></li>`;
        })
        .join("") +
      "</ul>";
    const side2 = [head, make("div", "side__inner", [edu, clone(blocks[2]), clone(blocks[3])])];
    const main2 = [sec("projetos"), sec("cursos"), clone($(".foot"))];

    const root = make("div", "", [sheet(side1, main1), sheet(side2, main2)]);
    root.id = "print-root";
    root.setAttribute("aria-hidden", "true");
    document.body.appendChild(root);
    fitSheets();
  };

  // reduz o conteúdo de uma coluna só se ele não couber na folha
  const fitSheets = () =>
    $$("#print-root .fit").forEach((fit) => {
      fit.style.zoom = 1;
      const avail = fit.parentElement.clientHeight;
      const need = fit.scrollHeight;
      if (need > avail) fit.style.zoom = Math.max(0.7, (avail / need) * 0.99).toFixed(3);
    });

  buildPrint();
  (document.fonts?.ready || Promise.resolve()).then(fitSheets);
  window.addEventListener("load", fitSheets);
  window.addEventListener("beforeprint", buildPrint);
})();
