/* Mon Parcoursup — tout est enregistré dans le navigateur (localStorage). */
(() => {
  "use strict";

  // ------------------------------------------------------------------
  // Calendrier Parcoursup 2027
  // Dates ESTIMÉES d'après la session 2026 : le calendrier officiel est
  // publié en fin d'année. L'élève peut corriger chaque date dans l'appli.
  // ------------------------------------------------------------------
  const SESSION = "2027";
  const STEPS = [
    {
      id: "info", date: "2026-12-16",
      title: "Ouverture du site Parcoursup",
      desc: "Tu peux consulter toutes les formations (plus de 24 000) : contenu, attendus, taux d'accès, frais.",
      tasks: [
        ["info_explore", "Explorer les formations qui m'intéressent sur parcoursup.gouv.fr"],
        ["info_jpo", "Noter les journées portes ouvertes (JPO) qui m'intéressent"],
        ["info_prof", "En parler avec mon prof principal ou le Psy-EN"],
      ],
    },
    {
      id: "inscription", date: "2027-01-18",
      title: "Inscription et début des vœux",
      desc: "Crée ton dossier (avec ton INE, sur ton bulletin) et commence à ajouter tes vœux. Tu as jusqu'à 10 vœux (+ sous-vœux).",
      tasks: [
        ["ins_compte", "Créer mon dossier Parcoursup (adresse mail valide + INE)"],
        ["ins_appli", "Installer l'appli Parcoursup et activer les notifications"],
        ["ins_premiers", "Ajouter mes premiers vœux"],
      ],
    },
    {
      id: "fin_voeux", date: "2027-03-11", important: true,
      title: "Dernier jour pour AJOUTER des vœux",
      desc: "Après cette date (23h59), impossible d'ajouter un nouveau vœu. Tu pourras encore compléter ton dossier.",
      tasks: [
        ["fv_tous", "Tous mes vœux sont saisis sur Parcoursup"],
        ["fv_equilibre", "Ma liste est équilibrée (ambitieux + réalistes + sécurité)"],
      ],
    },
    {
      id: "confirmation", date: "2027-04-01", important: true,
      title: "Dernier jour pour COMPLÉTER et CONFIRMER",
      desc: "Chaque vœu doit être confirmé avant 23h59, sinon il est supprimé. Dossier complet = lettres + rubriques + pièces.",
      tasks: [
        ["conf_lettres", "Projet de formation motivé (lettre) écrit pour chaque vœu"],
        ["conf_activites", "Rubrique « Activités et centres d'intérêt » remplie"],
        ["conf_pieces", "Pièces justificatives déposées (si demandées)"],
        ["conf_bulletins", "Bulletins et notes vérifiés"],
        ["conf_confirme", "TOUS mes vœux sont confirmés"],
      ],
    },
    {
      id: "admission", date: "2027-06-01",
      title: "Début des réponses des formations",
      desc: "Les réponses arrivent : oui, oui-si, en attente ou non. Réponds à chaque proposition dans le délai indiqué.",
      tasks: [
        ["adm_notifs", "Notifications activées (mail + appli)"],
        ["adm_repondre", "Je réponds à chaque proposition dans les délais"],
      ],
    },
    {
      id: "complementaire", date: "2027-06-10",
      title: "Ouverture de la phase complémentaire",
      desc: "Si tu n'as aucune proposition, tu peux faire jusqu'à 10 nouveaux vœux dans les formations qui ont encore des places.",
      tasks: [["comp_vu", "Je sais comment fonctionne la phase complémentaire"]],
    },
    {
      id: "bac", date: "2027-07-06",
      title: "Résultats du bac",
      desc: "Une fois admis·e, pense à faire ton inscription administrative dans ta future formation.",
      tasks: [["bac_inscription", "Inscription administrative faite"]],
    },
    {
      id: "fin_principale", date: "2027-07-09",
      title: "Fin de la phase principale",
      desc: "Dernier jour pour accepter une proposition en phase principale.",
      tasks: [["fp_accepte", "J'ai accepté définitivement une proposition"]],
    },
    {
      id: "fin_complementaire", date: "2027-09-10",
      title: "Fin de la phase complémentaire",
      desc: "Sans solution ? La CAES de ton académie peut t'aider (demande depuis ton dossier).",
      tasks: [["fc_ok", "C'est noté"]],
    },
  ];

  const VOEU_CHECKS = [
    ["saisi", "Ajouté sur Parcoursup"],
    ["lettre", "Lettre de motivation"],
    ["dossier", "Dossier complet"],
    ["confirme", "Vœu confirmé"],
  ];

  const NIVEAUX = {
    ambitieux: "Ambitieux",
    realiste: "Réaliste",
    securite: "Sécurité",
  };

  const DEFAULT_GRADES = ["Français / Philo", "Maths", "Histoire-Géo", "Anglais (LVA)", "LVB", "Spécialité 1", "Spécialité 2"];

  // ------------------------------------------------------------------
  // État + sauvegarde
  // ------------------------------------------------------------------
  const STORE_KEY = "mon-parcoursup-v1";
  // Adresse du serveur pour le coach IA. Vide = même serveur que la page.
  // L'appli mobile (Expo) la définit avant le chargement de la page.
  const API_BASE = String(window.PARCOURSUP_API_URL || "").replace(/\/$/, "");

  function freshState() {
    return {
      version: 1,
      voeux: [],
      tasks: {},
      dates: {},
      profil: { prenom: "", filiere: "Générale", specialites: "", envies: "" },
      grades: DEFAULT_GRADES.map((matiere) => ({ matiere, moyenne: "" })),
      chat: [],
    };
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (!raw) return freshState();
      return { ...freshState(), ...JSON.parse(raw) };
    } catch {
      return freshState();
    }
  }

  let state = load();

  function save() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(state));
    } catch {
      toast("Impossible d'enregistrer sur cet appareil");
    }
  }

  // ------------------------------------------------------------------
  // Utilitaires
  // ------------------------------------------------------------------
  const $ = (sel, root = document) => root.querySelector(sel);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const uid = () => Math.random().toString(36).slice(2, 10);

  function parseDate(iso) {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m - 1, d);
  }
  function today() {
    const t = new Date();
    return new Date(t.getFullYear(), t.getMonth(), t.getDate());
  }
  function daysUntil(iso) {
    return Math.round((parseDate(iso) - today()) / 86400000);
  }
  function fmtDate(iso, opts = { weekday: "long", day: "numeric", month: "long", year: "numeric" }) {
    return parseDate(iso).toLocaleDateString("fr-FR", opts);
  }
  function fmtCountdown(n) {
    if (n === 0) return "Aujourd'hui";
    if (n === 1) return "Demain";
    if (n > 0) return `J-${n}`;
    return "Passé";
  }
  function stepDate(step) {
    return state.dates[step.id] || step.date;
  }
  function stepsSorted() {
    return [...STEPS].sort((a, b) => stepDate(a).localeCompare(stepDate(b)));
  }
  function stepDone(step) {
    return step.tasks.every(([id]) => state.tasks[id]);
  }
  function nextStep() {
    return stepsSorted().find((s) => daysUntil(stepDate(s)) >= 0) || null;
  }
  // Jauge d'envie sur 5 (segments pleins / vides)
  function meter(n) {
    return `<span class="meter" title="Envie : ${n}/5" aria-label="Envie : ${n} sur 5">${[1, 2, 3, 4, 5].map((i) => `<i class="${i <= n ? "on" : ""}"></i>`).join("")}</span>`;
  }

  const ICONS = {
    up: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 15l6-6 6 6"/></svg>',
    down: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>',
    close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  };

  // Confirmation en deux appuis (confirm() ne marche pas partout, ex. dans une appli mobile).
  function confirmTap(btn, label) {
    if (btn.dataset.armed) return true;
    const original = btn.innerHTML;
    btn.dataset.armed = "1";
    btn.innerHTML = label;
    setTimeout(() => {
      if (!btn.isConnected) return;
      delete btn.dataset.armed;
      btn.innerHTML = original;
    }, 3000);
    return false;
  }

  let toastTimer;
  function toast(msg) {
    const el = $("#toast");
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (el.hidden = true), 2200);
  }

  function gradeAverage() {
    const vals = state.grades.map((g) => parseFloat(String(g.moyenne).replace(",", "."))).filter((v) => !isNaN(v));
    if (!vals.length) return null;
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  }

  function voeuxStats() {
    const v = state.voeux;
    return {
      total: v.length,
      confirmes: v.filter((x) => x.checks.confirme).length,
      lettres: v.filter((x) => x.checks.lettre).length,
      ambitieux: v.filter((x) => x.niveau === "ambitieux").length,
      realiste: v.filter((x) => x.niveau === "realiste").length,
      securite: v.filter((x) => x.niveau === "securite").length,
    };
  }

  function globalProgress() {
    const ids = STEPS.flatMap((s) => s.tasks.map(([id]) => id));
    const done = ids.filter((id) => state.tasks[id]).length;
    return Math.round((done / ids.length) * 100);
  }

  // ------------------------------------------------------------------
  // Accueil
  // ------------------------------------------------------------------
  function todoList() {
    const items = [];
    const st = voeuxStats();
    const conf = STEPS.find((s) => s.id === "confirmation");
    const confDays = daysUntil(stepDate(conf));

    if (!state.profil.prenom) items.push(["profil", "Dis-moi ton prénom et tes spécialités"]);
    if (!state.grades.some((g) => g.moyenne !== "")) items.push(["profil", "Ajoute tes moyennes pour des conseils perso"]);
    if (st.total === 0) items.push(["voeux", "Ajoute ton premier vœu (même une simple idée)"]);
    if (st.total > 0 && st.securite === 0) items.push(["voeux", "Ajoute au moins un vœu « sécurité »"]);
    if (st.total > 10) items.push(["voeux", `Tu as ${st.total} vœux : 10 maximum sur Parcoursup`]);
    const sansLettre = state.voeux.filter((v) => !v.checks.lettre);
    if (sansLettre.length && st.total) items.push(["voeux", `Écris la lettre pour : ${sansLettre.slice(0, 2).map((v) => v.formation).join(", ")}${sansLettre.length > 2 ? "…" : ""}`]);
    if (st.total && st.confirmes < st.total && confDays >= 0) items.push(["voeux", `${st.total - st.confirmes} vœu(x) à confirmer avant le ${fmtDate(stepDate(conf), { day: "numeric", month: "long" })}`]);

    const ns = nextStep();
    if (ns) ns.tasks.filter(([id]) => !state.tasks[id]).slice(0, 2).forEach(([, label]) => items.push(["calendar", `${label}`]));
    return items.slice(0, 6);
  }

  function renderHome() {
    const ns = nextStep();
    const st = voeuxStats();
    const prog = globalProgress();
    const name = state.profil.prenom ? `Bonjour ${esc(state.profil.prenom)}` : "Bonjour";

    const conf = STEPS.find((s) => s.id === "confirmation");
    const confPassed = daysUntil(stepDate(conf)) < 0;
    const alert = confPassed && st.total && st.confirmes < st.total
      ? `<div class="alert danger">La date de confirmation est passée et ${st.total - st.confirmes} vœu(x) ne sont pas cochés « confirmé ». Vérifie sur Parcoursup.</div>`
      : "";

    const todos = todoList();
    $("#view-home").innerHTML = `
      <div>
        <h1>${name}</h1>
        <p class="muted">Ton espace pour préparer Parcoursup ${SESSION} sans stress.</p>
      </div>

      ${ns ? `
      <div class="card hero">
        <div class="eyebrow">Prochaine étape</div>
        <div class="big">${fmtCountdown(daysUntil(stepDate(ns)))}</div>
        <div class="when">${esc(ns.title)}</div>
        <div class="hero-date">${fmtDate(stepDate(ns))}</div>
      </div>` : `
      <div class="card hero"><div class="when">Toutes les étapes sont passées.</div></div>`}

      ${alert}

      <div class="stats">
        <div class="stat"><b>${st.total}/10</b><span>vœux</span></div>
        <div class="stat"><b>${st.lettres}/${st.total}</b><span>lettres écrites</span></div>
        <div class="stat"><b>${st.confirmes}/${st.total}</b><span>confirmés</span></div>
      </div>

      <div class="card">
        <div class="section-head"><h2>Ma progression</h2><b>${prog}%</b></div>
        <div class="progress"><i style="width:${prog}%"></i></div>
        <p class="muted small" style="margin-top:6px">Coche les étapes dans l'onglet « Dates ».</p>
      </div>

      <div class="card">
        <h2>À faire maintenant</h2>
        ${todos.length ? `<ul class="todo-list">${todos.map(([tab, label]) => `
          <li><button data-goto="${tab}"><span>${esc(label)}</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg></button></li>`).join("")}</ul>`
        : `<p class="muted">Rien d'urgent, tout est à jour.</p>`}
      </div>

      <div class="card">
        <h2>Besoin d'aide pour choisir ?</h2>
        <p class="muted">L'assistant connaît tes vœux et tes notes. Demande-lui de t'aider à classer, à relire ta lettre ou à trouver des idées.</p>
        <button class="btn primary" data-goto="coach">Poser une question</button>
      </div>
    `;
  }

  // ------------------------------------------------------------------
  // Vœux
  // ------------------------------------------------------------------
  function renderVoeux() {
    const st = voeuxStats();
    const v = state.voeux;
    let balance = "";
    if (st.total >= 3 && st.securite === 0) balance = `<div class="alert warn">Pense à ajouter au moins un vœu « sécurité » où tu as de bonnes chances d'être pris·e.</div>`;
    else if (st.total >= 3 && st.ambitieux === 0) balance = `<div class="alert info">Tu peux oser un vœu « ambitieux » : tu ne perds rien à essayer.</div>`;
    if (st.total > 10) balance += `<div class="alert danger">${st.total} vœux : Parcoursup en accepte 10 maximum (hors sous-vœux). Il faudra en enlever.</div>`;

    $("#view-voeux").innerHTML = `
      <div class="section-head">
        <div>
          <h1>Mes vœux</h1>
          <p class="muted">${st.total} sur 10 · ${st.ambitieux} ambitieux · ${st.realiste} réaliste${st.realiste > 1 ? "s" : ""} · ${st.securite} sécurité</p>
        </div>
        <button class="btn primary" data-action="add-voeu">+ Ajouter</button>
      </div>
      <div class="alert info small">Parcoursup ne te demande <b>pas</b> de classer tes vœux. Ce classement est juste pour toi, pour savoir ce que tu préfères le jour où les réponses arrivent. Utilise les flèches pour le changer.</div>
      ${balance}
      ${v.length ? v.map((x, i) => voeuCard(x, i, v.length)).join("") : `
        <div class="card empty">
          <h2>Aucun vœu pour l'instant</h2>
          <p class="muted">Ajoute toutes tes idées, même si tu hésites. Tu pourras trier ensuite.</p>
          <button class="btn primary" data-action="add-voeu">+ Ajouter mon premier vœu</button>
        </div>`}
    `;
  }

  function voeuCard(x, i, n) {
    const dl = x.deadline ? daysUntil(x.deadline) : null;
    const doneCount = VOEU_CHECKS.filter(([k]) => x.checks[k]).length;
    return `
      <article class="card voeu" data-id="${x.id}">
        <div class="rank">
          <button class="icon-btn" data-action="up" ${i === 0 ? "disabled" : ""} aria-label="Monter">${ICONS.up}</button>
          <b>${i + 1}</b>
          <button class="icon-btn" data-action="down" ${i === n - 1 ? "disabled" : ""} aria-label="Descendre">${ICONS.down}</button>
        </div>
        <div>
          <div class="title">${esc(x.formation)}</div>
          <div class="meta">${[x.etablissement, x.ville, x.type].filter(Boolean).map(esc).join(" · ")}</div>
          <div class="tags">
            <span class="tag ${x.niveau}">${NIVEAUX[x.niveau] || ""}</span>
            ${meter(x.coeur || 0)}
            ${x.checks.confirme ? `<span class="tag ok">Confirmé</span>` : `<span class="tag todo">${doneCount}/4 étapes</span>`}
            ${dl !== null ? `<span class="tag ${dl < 0 ? "" : dl <= 7 ? "todo" : ""}">${dl < 0 ? "Date passée" : fmtCountdown(dl)} (${fmtDate(x.deadline, { day: "numeric", month: "short" })})</span>` : ""}
          </div>
          ${x.notes ? `<div class="notes">${esc(x.notes)}</div>` : ""}
          <div class="checks">
            ${VOEU_CHECKS.map(([k, label]) => `
              <label class="check"><input type="checkbox" data-check="${k}" ${x.checks[k] ? "checked" : ""}><span>${label}</span></label>`).join("")}
          </div>
          <div class="actions">
            <button class="btn small" data-action="edit">Modifier</button>
            <button class="btn small" data-action="ask">Demander un avis</button>
            <button class="btn small danger" data-action="delete">Supprimer</button>
          </div>
        </div>
      </article>`;
  }

  // Dialog d'ajout/modif
  const dialog = $("#voeuDialog");
  const form = $("#voeuForm");
  let editingId = null;
  let starValue = 3;

  function renderStarsInput() {
    $("#starsInput").innerHTML = [1, 2, 3, 4, 5]
      .map((n) => `<button type="button" data-star="${n}" class="${n <= starValue ? "on" : ""}" aria-label="Envie ${n} sur 5" aria-pressed="${n === starValue}">${n}</button>`)
      .join("");
  }

  function openVoeuDialog(id = null) {
    editingId = id;
    const x = id ? state.voeux.find((v) => v.id === id) : null;
    $("#voeuDialogTitle").textContent = x ? "Modifier le vœu" : "Ajouter un vœu";
    form.reset();
    form.formation.value = x?.formation || "";
    form.etablissement.value = x?.etablissement || "";
    form.ville.value = x?.ville || "";
    form.type.value = x?.type || "BUT";
    form.notes.value = x?.notes || "";
    form.deadline.value = x?.deadline || "";
    form.querySelector(`input[name=niveau][value="${x?.niveau || "realiste"}"]`).checked = true;
    starValue = x?.coeur ?? 3;
    renderStarsInput();
    dialog.showModal();
    setTimeout(() => form.formation.focus(), 50);
  }

  $("#starsInput").addEventListener("click", (e) => {
    const b = e.target.closest("[data-star]");
    if (!b) return;
    starValue = Number(b.dataset.star);
    renderStarsInput();
  });

  $("#voeuCancel").addEventListener("click", () => dialog.close());

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = {
      formation: form.formation.value.trim(),
      etablissement: form.etablissement.value.trim(),
      ville: form.ville.value.trim(),
      type: form.type.value,
      niveau: form.querySelector("input[name=niveau]:checked")?.value || "realiste",
      coeur: starValue,
      notes: form.notes.value.trim(),
      deadline: form.deadline.value,
    };
    if (!data.formation) return;
    if (editingId) {
      Object.assign(state.voeux.find((v) => v.id === editingId), data);
      toast("Vœu modifié");
    } else {
      state.voeux.push({ id: uid(), checks: {}, ...data });
      toast(state.voeux.length > 10 ? "Vœu ajouté. Attention : plus de 10 vœux." : "Vœu ajouté");
    }
    save();
    dialog.close();
    renderAll();
  });

  $("#view-voeux").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;
    const action = btn.dataset.action;
    if (action === "add-voeu") return openVoeuDialog();
    const card = btn.closest("[data-id]");
    if (!card) return;
    const id = card.dataset.id;
    const i = state.voeux.findIndex((v) => v.id === id);
    const x = state.voeux[i];
    if (action === "edit") return openVoeuDialog(id);
    if (action === "delete") {
      if (!confirmTap(btn, "Sûr ? Appuie encore")) return;
      state.voeux.splice(i, 1);
      toast("Vœu supprimé");
    }
    if (action === "up" && i > 0) [state.voeux[i - 1], state.voeux[i]] = [state.voeux[i], state.voeux[i - 1]];
    if (action === "down" && i < state.voeux.length - 1) [state.voeux[i + 1], state.voeux[i]] = [state.voeux[i], state.voeux[i + 1]];
    if (action === "ask") {
      switchTab("coach");
      sendChat(`Que penses-tu de mon vœu « ${x.formation}${x.etablissement ? " – " + x.etablissement : ""} » ? Est-ce qu'il colle à mon profil et comment je peux mettre toutes les chances de mon côté ?`);
      return;
    }
    save();
    renderAll();
  });

  $("#view-voeux").addEventListener("change", (e) => {
    const cb = e.target.closest("[data-check]");
    if (!cb) return;
    const x = state.voeux.find((v) => v.id === cb.closest("[data-id]").dataset.id);
    x.checks[cb.dataset.check] = cb.checked;
    if (cb.dataset.check === "confirme" && cb.checked) toast("Vœu confirmé");
    save();
    renderAll();
  });

  // ------------------------------------------------------------------
  // Calendrier
  // ------------------------------------------------------------------
  let editingDate = null;

  function renderCalendar() {
    const ns = nextStep();
    const st = voeuxStats();
    $("#view-calendar").innerHTML = `
      <div>
        <h1>Calendrier Parcoursup ${SESSION}</h1>
        <p class="muted">Coche les tâches au fur et à mesure. Les dates limites sont signalées.</p>
      </div>
      <div class="alert warn small">Dates <b>estimées</b> d'après l'année dernière. Le calendrier officiel sort en fin d'année : vérifie sur <a href="https://www.parcoursup.gouv.fr" target="_blank" rel="noopener">parcoursup.gouv.fr</a> et corrige les dates si besoin.</div>
      <ol class="timeline">
        ${stepsSorted().map((s) => {
          const d = stepDate(s);
          const n = daysUntil(d);
          const done = stepDone(s);
          const cls = [done && "done", n < 0 && "past", ns && ns.id === s.id && "next"].filter(Boolean).join(" ");
          let extra = "";
          if (s.id === "confirmation" && st.total) extra = `<p class="small"><b>${st.confirmes}/${st.total}</b> vœux confirmés · <b>${st.lettres}/${st.total}</b> lettres écrites</p>`;
          if (s.id === "fin_voeux" && st.total) extra = `<p class="small"><b>${st.total}/10</b> vœux dans ta liste</p>`;
          return `
          <li class="step ${cls}" data-step="${s.id}">
            <span class="dot"></span>
            <div class="date">${fmtDate(d)} ${n >= 0 ? `<span class="countdown">${fmtCountdown(n)}</span>` : ""}</div>
            <div class="card">
              <h3>${esc(s.title)}${s.important ? ` <span class="tag deadline">Date limite</span>` : ""}</h3>
              <p class="muted small">${esc(s.desc)}</p>
              ${extra}
              ${s.tasks.map(([id, label]) => `
                <label class="check"><input type="checkbox" data-task="${id}" ${state.tasks[id] ? "checked" : ""}><span>${esc(label)}</span></label>`).join("")}
              ${editingDate === s.id ? `
                <div class="date-edit">
                  <input type="date" value="${d}" data-date-input="${s.id}">
                  <button class="btn small" data-date-reset="${s.id}">Date d'origine</button>
                  <button class="btn small primary" data-date-close>OK</button>
                </div>` : `
                <button class="link-btn" data-date-edit="${s.id}">Modifier la date</button>`}
            </div>
          </li>`;
        }).join("")}
      </ol>
    `;
  }

  $("#view-calendar").addEventListener("change", (e) => {
    const t = e.target;
    if (t.dataset.task) {
      state.tasks[t.dataset.task] = t.checked;
      save();
      renderAll();
    } else if (t.dataset.dateInput && t.value) {
      state.dates[t.dataset.dateInput] = t.value;
      save();
      renderAll();
    }
  });

  $("#view-calendar").addEventListener("click", (e) => {
    const t = e.target.closest("button");
    if (!t) return;
    if (t.dataset.dateEdit) editingDate = t.dataset.dateEdit;
    else if (t.dataset.dateReset) { delete state.dates[t.dataset.dateReset]; save(); editingDate = null; toast("Date d'origine remise"); }
    else if ("dateClose" in t.dataset) editingDate = null;
    else return;
    renderAll();
  });

  // ------------------------------------------------------------------
  // Profil & notes
  // ------------------------------------------------------------------
  function renderProfil() {
    const p = state.profil;
    const avg = gradeAverage();
    $("#view-profil").innerHTML = `
      <div>
        <h1>Mon profil et mes notes</h1>
        <p class="muted">Ces informations aident l'assistant à te donner des conseils adaptés. Elles restent sur ton appareil.</p>
      </div>

      <div class="card">
        <h2>Moi</h2>
        <label>Prénom <input data-profil="prenom" value="${esc(p.prenom)}" placeholder="ex : Inès" autocomplete="given-name"></label>
        <label>Ma voie
          <select data-profil="filiere">
            ${["Générale", "Technologique", "Professionnelle", "Autre (réorientation, étudiant…)"].map((f) => `<option ${p.filiere === f ? "selected" : ""}>${f}</option>`).join("")}
          </select>
        </label>
        <label>Mes spécialités / ma série <input data-profil="specialites" value="${esc(p.specialites)}" placeholder="ex : Maths + SES, ou STMG…"></label>
        <label>Ce que j'aime, ce qui me motive
          <textarea data-profil="envies" rows="3" placeholder="ex : j'aime aider les gens, le sport, coder, je veux rester près de chez moi…">${esc(p.envies)}</textarea>
        </label>
      </div>

      <div class="card">
        <div class="section-head">
          <h2>Mes moyennes</h2>
          <div class="avg" id="avgValue">${avg === null ? "–" : avg.toFixed(1).replace(".", ",")}<span class="muted small"> /20</span></div>
        </div>
        <p class="muted small">Moyenne de l'année (ou du dernier trimestre). Tu peux renommer les matières.</p>
        <div id="gradesList">
          ${state.grades.map((g, i) => `
            <div class="grade-row" data-grade="${i}">
              <input data-gfield="matiere" value="${esc(g.matiere)}" aria-label="Matière">
              <input data-gfield="moyenne" value="${esc(g.moyenne)}" inputmode="decimal" placeholder="/20" aria-label="Moyenne en ${esc(g.matiere)}">
              <button class="icon-btn" data-grade-del="${i}" aria-label="Supprimer">${ICONS.close}</button>
            </div>`).join("")}
        </div>
        <button class="btn small" data-grade-add>+ Ajouter une matière</button>
      </div>

      <div class="card">
        <h2>Sauvegarde</h2>
        <p class="muted small">Tes données sont enregistrées sur cet appareil. Pour changer de téléphone, copie ta sauvegarde et colle-la sur le nouveau.</p>
        <div class="actions" style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px">
          <button class="btn small" data-export>Copier ma sauvegarde</button>
          <button class="btn small danger" data-reset>Tout effacer</button>
        </div>
        <label for="importBox">Restaurer une sauvegarde
          <textarea id="importBox" rows="3" placeholder="Colle ici le texte de ta sauvegarde"></textarea>
        </label>
        <button class="btn small" data-import>Restaurer</button>
      </div>
    `;
  }

  const profilView = $("#view-profil");
  profilView.addEventListener("input", (e) => {
    const t = e.target;
    if (t.dataset.profil) {
      state.profil[t.dataset.profil] = t.value;
    } else if (t.dataset.gfield) {
      const i = Number(t.closest("[data-grade]").dataset.grade);
      let val = t.value;
      if (t.dataset.gfield === "moyenne") {
        const num = parseFloat(val.replace(",", "."));
        if (!isNaN(num) && (num < 0 || num > 20)) { t.setCustomValidity("Entre 0 et 20"); t.reportValidity(); return; }
        t.setCustomValidity("");
      }
      state.grades[i][t.dataset.gfield] = val;
      const avg = gradeAverage();
      $("#avgValue").innerHTML = `${avg === null ? "–" : avg.toFixed(1).replace(".", ",")}<span class="muted small"> /20</span>`;
    } else return;
    save();
    renderHome(); // pas de re-rendu du formulaire pendant la saisie
  });

  profilView.addEventListener("click", (e) => {
    const t = e.target.closest("button");
    if (!t) return;
    if ("gradeAdd" in t.dataset) {
      state.grades.push({ matiere: "Nouvelle matière", moyenne: "" });
    } else if (t.dataset.gradeDel) {
      state.grades.splice(Number(t.dataset.gradeDel), 1);
    } else if ("export" in t.dataset) {
      const json = JSON.stringify(state);
      const showText = () => {
        const box = $("#importBox");
        box.value = json;
        box.select();
        toast("Sélectionne et copie le texte ci-dessous");
      };
      try {
        navigator.clipboard.writeText(json).then(() => toast("Sauvegarde copiée. Garde-la dans tes notes."), showText);
      } catch {
        showText();
      }
      return;
    } else if ("import" in t.dataset) {
      try {
        const data = JSON.parse($("#importBox").value);
        if (!Array.isArray(data.voeux)) throw new Error();
        state = { ...freshState(), ...data };
        toast("Données restaurées");
        renderChat();
      } catch {
        toast("Ce texte n'est pas une sauvegarde valide.");
        return;
      }
    } else if ("reset" in t.dataset) {
      if (!confirmTap(t, "Sûr ? Tout sera effacé")) return;
      state = freshState();
      toast("Tout a été effacé");
      renderChat();
    } else return;
    save();
    renderAll();
  });

  profilView.addEventListener("change", (e) => {
    const t = e.target;
    if (t.dataset.profil) { state.profil[t.dataset.profil] = t.value; save(); renderHome(); }
  });

  // ------------------------------------------------------------------
  // Coach IA
  // ------------------------------------------------------------------
  let aiAvailable = null; // null = inconnu
  let chatBusy = false;

  const SUGGESTIONS = [
    "Aide-moi à classer mes vœux",
    "Ma liste de vœux est-elle équilibrée ?",
    "Quelles formations avec mon profil ?",
    "Comment écrire ma lettre de motivation ?",
    "Qu'est-ce que je dois faire en ce moment ?",
    "Explique-moi Parcoursup simplement",
  ];

  function contextForAI() {
    return {
      profil: state.profil,
      moyennes: state.grades.filter((g) => g.moyenne !== "").map((g) => `${g.matiere} : ${g.moyenne}/20`),
      moyenne_generale: gradeAverage()?.toFixed(1) ?? "non renseignée",
      voeux_par_ordre_de_preference: state.voeux.map((v, i) => ({
        rang: i + 1,
        formation: v.formation,
        etablissement: v.etablissement,
        ville: v.ville,
        type: v.type,
        niveau: v.niveau,
        envie_sur_5: v.coeur,
        notes_perso: v.notes,
        date_limite_specifique: v.deadline || undefined,
        etapes_faites: VOEU_CHECKS.filter(([k]) => v.checks[k]).map(([, l]) => l),
      })),
      calendrier_estime: stepsSorted().map((s) => ({
        date: stepDate(s),
        etape: s.title,
        taches_faites: s.tasks.filter(([id]) => state.tasks[id]).map(([, l]) => l),
        taches_restantes: s.tasks.filter(([id]) => !state.tasks[id]).map(([, l]) => l),
      })),
    };
  }

  function mdLite(text) {
    // Mise en forme très simple : **gras**, titres "#", listes conservées.
    return esc(text)
      .replace(/^#{1,4}\s+(.+)$/gm, "<strong>$1</strong>")
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/^\s*[-*]\s+/gm, "• ");
  }

  function welcomeMessage() {
    const p = state.profil.prenom ? ` ${state.profil.prenom}` : "";
    let txt = `Bonjour${p}. Je suis ton assistant Parcoursup.\n\nJe peux t'aider à classer tes vœux, vérifier que ta liste est équilibrée, trouver des idées de formations ou améliorer ta lettre de motivation. Choisis une question en dessous ou écris la tienne.`;
    if (aiAvailable === false) txt += `\n\n(Mode hors ligne : l'IA n'est pas branchée sur ce serveur, je te donne des conseils automatiques à partir de tes données.)`;
    return txt;
  }

  function renderChat() {
    const log = $("#chatLog");
    const msgs = [{ role: "assistant", content: welcomeMessage() }, ...state.chat];
    log.innerHTML = msgs.map((m) => `<div class="msg ${m.role}">${m.role === "assistant" ? mdLite(m.content) : esc(m.content)}</div>`).join("");
    $("#chatChips").innerHTML = SUGGESTIONS.map((s) => `<button type="button">${esc(s)}</button>`).join("") +
      (state.chat.length ? `<button type="button" data-clear>Nouvelle discussion</button>` : "");
  }

  function scrollChat() {
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  }

  async function sendChat(text) {
    text = text.trim();
    if (!text || chatBusy) return;
    chatBusy = true;
    $("#chatSend").disabled = true;
    state.chat.push({ role: "user", content: text });
    state.chat = state.chat.slice(-40);
    save();
    renderChat();

    const bubble = document.createElement("div");
    bubble.className = "msg assistant typing";
    $("#chatLog").appendChild(bubble);
    scrollChat();

    let answer = "";
    try {
      if (aiAvailable === false) throw new Error("offline");
      const res = await fetch(API_BASE + "/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: state.chat,
          context: contextForAI(),
          today: new Date().toLocaleDateString("fr-CA"),
        }),
      });
      if (res.status === 429) {
        answer = "Tu as posé beaucoup de questions en peu de temps. Réessaie dans quelques minutes.";
        throw new Error("rate");
      }
      if (!res.ok || !res.body) {
        if (res.status === 503) aiAvailable = false;
        throw new Error("offline");
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const parts = buf.split("\n\n");
        buf = parts.pop();
        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith("data:")) continue;
          const data = JSON.parse(line.slice(5));
          if (data.text) answer += data.text;
          if (data.error) answer += (answer ? "\n\n" : "") + data.error;
          bubble.innerHTML = mdLite(answer);
        }
        scrollChat();
      }
      if (!answer) answer = "Je n'ai pas obtenu de réponse. Réessaie.";
    } catch {
      if (!answer) answer = localCoach(text);
    }

    state.chat.push({ role: "assistant", content: answer });
    save();
    chatBusy = false;
    $("#chatSend").disabled = false;
    renderChat();
    scrollChat();
  }

  // Réponses automatiques quand l'IA n'est pas disponible
  function localCoach(q) {
    const t = q.toLowerCase();
    const st = voeuxStats();
    const ns = nextStep();
    const lines = [];

    if (/class|priorit|ordre|préf/.test(t)) {
      if (!st.total) return "Tu n'as pas encore de vœux. Ajoute-les dans l'onglet « Mes vœux », puis je t'aide à les classer.";
      const sorted = [...state.voeux].sort((a, b) => (b.coeur || 0) - (a.coeur || 0));
      lines.push("Voici tes vœux triés selon ton **envie** :");
      sorted.forEach((v, i) => lines.push(`${i + 1}. ${v.formation} (envie ${v.coeur || 0}/5, ${NIVEAUX[v.niveau].toLowerCase()})`));
      lines.push("", "Pour départager deux vœux, pose-toi ces questions :", "- Est-ce que le programme me fait envie ?", "- Est-ce que je me vois vivre dans cette ville ?", "- Qu'est-ce que je pourrai faire après ?", "", "Tu peux changer l'ordre avec les flèches dans « Mes vœux ».");
    } else if (/équilibr|equilibr|sécu|secu|chance/.test(t)) {
      lines.push(`Ta liste : ${st.ambitieux} ambitieux, ${st.realiste} réalistes, ${st.securite} sécurité.`);
      if (!st.total) lines.push("Commence par ajouter quelques vœux.");
      else if (!st.securite) lines.push("Ajoute au moins 1 ou 2 vœux « sécurité » : des formations où ton profil correspond bien aux attendus.");
      else if (!st.ambitieux) lines.push("Tu peux tenter un vœu « ambitieux » : tu ne perds rien à essayer.");
      else lines.push("Bon équilibre. Vérifie les taux d'accès sur la fiche de chaque formation pour confirmer.");
    } else if (/lettre|motiv/.test(t)) {
      lines.push("**Ta lettre (projet de formation motivé), en 3 parties :**", "- **Pourquoi cette formation ?** Ce qui t'attire dans le programme (cite des matières précises).", "- **Pourquoi toi ?** Tes qualités + un exemple concret (projet, stage, activité, job, association).", "- **Et après ?** Ton projet ou ce que tu veux découvrir.", "", "1500 caractères max. Évite le copier-coller entre deux formations : les jurys le remarquent.");
    } else if (/date|quand|deadline|limite|faire en ce moment|maintenant/.test(t)) {
      if (ns) lines.push(`Prochaine étape : **${ns.title}** le ${fmtDate(stepDate(ns))} (${fmtCountdown(daysUntil(stepDate(ns)))}).`);
      todoList().forEach(([, l]) => lines.push(`- ${l}`));
      lines.push("", "Toutes les dates sont dans l'onglet « Dates ».");
    } else if (/note|moyenne|profil|formation/.test(t)) {
      const avg = gradeAverage();
      if (avg === null) lines.push("Ajoute tes moyennes dans « Mes notes » et je pourrai mieux t'aider.");
      else {
        lines.push(`Ta moyenne générale est d'environ **${avg.toFixed(1).replace(".", ",")}/20**.`);
        const best = state.grades.filter((g) => g.moyenne !== "").sort((a, b) => parseFloat(String(b.moyenne).replace(",", ".")) - parseFloat(String(a.moyenne).replace(",", "."))).slice(0, 2);
        if (best.length) lines.push(`Tes points forts : ${best.map((g) => g.matiere).join(" et ")}. Cherche des formations où ces matières comptent.`);
      }
      lines.push("Pour trouver des idées, utilise le moteur de recherche de parcoursup.gouv.fr et le site de l'Onisep (onisep.fr).");
    } else if (/parcoursup|comment|marche|explique/.test(t)) {
      lines.push("**Parcoursup en 4 étapes :**", "1. Tu explores les formations (dès décembre).", "2. Tu fais jusqu'à 10 vœux (de janvier à mi-mars), sans les classer.", "3. Tu complètes ton dossier et tu **confirmes chaque vœu** (avant début avril).", "4. Les réponses arrivent à partir de juin : tu acceptes ou refuses chaque proposition dans les délais.");
    } else {
      lines.push("Je n'ai pas bien compris. Essaie une des questions proposées en dessous.");
    }
    if (aiAvailable === false) lines.push("", "(Réponse automatique — l'IA n'est pas activée sur ce serveur.)");
    return lines.join("\n");
  }

  $("#chatForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const input = $("#chatInput");
    const txt = input.value;
    input.value = "";
    input.style.height = "";
    sendChat(txt);
  });
  $("#chatInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey && !e.isComposing) {
      e.preventDefault();
      $("#chatForm").requestSubmit();
    }
  });
  $("#chatInput").addEventListener("input", (e) => {
    e.target.style.height = "";
    e.target.style.height = Math.min(e.target.scrollHeight, 140) + "px";
  });
  $("#chatChips").addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    if ("clear" in b.dataset) {
      state.chat = [];
      save();
      renderChat();
      return;
    }
    sendChat(b.textContent);
  });

  // ------------------------------------------------------------------
  // Navigation
  // ------------------------------------------------------------------
  function switchTab(tab) {
    document.querySelectorAll(".view").forEach((v) => (v.hidden = v.dataset.view !== tab));
    document.querySelectorAll(".tabbar button").forEach((b) => b.classList.toggle("active", b.dataset.tab === tab));
    if (tab === "profil") renderProfil();
    window.scrollTo(0, tab === "coach" ? document.body.scrollHeight : 0);
    try { sessionStorage.setItem("tab", tab); } catch { /* rien */ }
  }

  document.querySelector(".tabbar").addEventListener("click", (e) => {
    const b = e.target.closest("[data-tab]");
    if (b) switchTab(b.dataset.tab);
  });
  document.addEventListener("click", (e) => {
    const g = e.target.closest("[data-goto]");
    if (g) switchTab(g.dataset.goto);
  });

  function renderAll() {
    renderHome();
    renderVoeux();
    renderCalendar();
    renderProfil();
  }

  // ------------------------------------------------------------------
  // Démarrage
  // ------------------------------------------------------------------
  $("#sessionLabel").textContent = `Session ${SESSION}`;
  renderAll();
  renderChat();
  let startTab = "home";
  try { startTab = sessionStorage.getItem("tab") || "home"; } catch { /* rien */ }
  switchTab(startTab);

  if (window.PARCOURSUP_NO_SERVER) {
    aiAvailable = false;
    renderChat();
  } else fetch(API_BASE + "/api/status")
    .then((r) => r.json())
    .then((s) => { aiAvailable = Boolean(s.ai); })
    .catch(() => { aiAvailable = false; })
    .finally(renderChat);
})();
