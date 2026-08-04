/* ============================================================
   HEADER
   ============================================================ */
const header = document.querySelector("header");
const menu = document.querySelector('#menu-icon');
const navlist = document.querySelector('.navlist');

window.addEventListener("scroll", function () {
    header.classList.toggle("sticky", window.scrollY > 40);
});

menu.addEventListener('click', () => {
    const open = navlist.classList.toggle('open');
    menu.setAttribute('aria-expanded', String(open));
});

navlist.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
        navlist.classList.remove('open');
        menu.setAttribute('aria-expanded', 'false');
    });
});

/* aba ativa conforme a secao visivel */
(function () {
    const sections = [...document.querySelectorAll('section[id]')];
    const links = new Map();
    navlist.querySelectorAll('a[href^="#"]').forEach((a) => links.set(a.getAttribute('href').slice(1), a));

    if (!('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            const link = links.get(entry.target.id);
            if (!link) return;
            if (entry.isIntersecting) {
                links.forEach((l) => l.classList.remove('active'));
                link.classList.add('active');
            }
        });
    }, { rootMargin: '-45% 0px -50% 0px' });

    sections.forEach((s) => observer.observe(s));
})();

/* ============================================================
   BOTAO VOLTAR AO TOPO
   ============================================================ */
const topo = document.getElementById("top");

window.addEventListener("scroll", function () {
    topo.classList.toggle("show-top", window.scrollY > 240);
    topo.classList.toggle("hide-top", window.scrollY <= 240);
});

window.addEventListener("load", () => topo.classList.add("hide-top"));

/* ============================================================
   TEMA CLARO / ESCURO
   Padrao: preferencia do sistema operacional.
   Se o usuario clicar no botao, a escolha dele passa a valer
   e fica salva no localStorage.
   ============================================================ */
(function () {
    const root = document.documentElement;
    const toggle = document.getElementById('theme-toggle');
    const media = window.matchMedia('(prefers-color-scheme: dark)');

    const readStored = () => {
        try { return localStorage.getItem('theme'); } catch (e) { return null; }
    };

    const store = (value) => {
        try { localStorage.setItem('theme', value); } catch (e) { /* modo privado */ }
    };

    const apply = (theme) => {
        root.setAttribute('data-theme', theme);
        const meta = document.querySelector('meta[name="theme-color"]');
        if (meta) meta.setAttribute('content', theme === 'dark' ? '#0a0a0a' : '#f4f5f7');
        if (toggle) {
            toggle.setAttribute('aria-label',
                theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro');
        }
    };

    apply(readStored() || (media.matches ? 'dark' : 'light'));

    if (toggle) {
        toggle.addEventListener('click', () => {
            const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
            apply(next);
            store(next);
        });
    }

    // enquanto nao houver escolha manual, acompanha o sistema em tempo real
    const onSystemChange = (e) => { if (!readStored()) apply(e.matches ? 'dark' : 'light'); };
    if (media.addEventListener) media.addEventListener('change', onSystemChange);
    else if (media.addListener) media.addListener(onSystemChange);
})();

/* ============================================================
   TERMINAL - efeito de digitacao no prompt do hero
   ============================================================ */
(function () {
    const el = document.getElementById('typed');
    if (!el) return;

    const commands = [
        'python -m accrual --portfolio all',
        'docker compose up trade-service',
        'aws ecs deploy --cluster majors-prod',
        'git commit -m "feat: RAG over fund documents"',
        'kubectl get pods -n data-pipeline'
    ];

    let cmd = 0, char = 0, deleting = false;

    const tick = () => {
        const current = commands[cmd];
        el.textContent = current.slice(0, char);

        if (!deleting && char < current.length) {
            char++;
            setTimeout(tick, 55);
        } else if (!deleting) {
            deleting = true;
            setTimeout(tick, 2200);
        } else if (char > 0) {
            char--;
            setTimeout(tick, 22);
        } else {
            deleting = false;
            cmd = (cmd + 1) % commands.length;
            setTimeout(tick, 400);
        }
    };

    tick();
})();

/* ============================================================
   SKILLS
   ============================================================ */
(function () {
    const grid = document.getElementById('skills-grid');
    if (!grid) return;

    const tiles = [...grid.querySelectorAll('.skill')];

    /* contador no cabecalho da janela */
    const counter = document.getElementById('skill-count');
    if (counter) counter.textContent = tiles.length;

    /* ---- fallback de icone ----
       Se a fonte de icones (boxicons/devicon) nao carregar ou a classe
       nao existir, o bloco mostra uma sigla em vez de ficar vazio. */
    const applyFallback = () => {
        tiles.forEach((tile) => {
            const icon = tile.querySelector('i');
            if (!icon) return;
            const box = icon.getBoundingClientRect();
            if (box.width >= 4 && box.height >= 4) return;

            icon.remove();
            const abbr = document.createElement('span');
            abbr.className = 'skill-abbr';
            abbr.textContent = tile.dataset.abbr || (tile.dataset.name || '?').slice(0, 3);
            tile.appendChild(abbr);
        });
    };

    const runFallback = () => setTimeout(applyFallback, 600);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(runFallback);
    else window.addEventListener('load', runFallback);

    /* ---- tooltip: nao deixa sair da tela nas bordas ---- */
    const adjustTip = (tile) => {
        tile.style.removeProperty('--tip-shift');
        const rect = tile.getBoundingClientRect();
        const margin = 12;
        const text = (tile.dataset.name || '') + ' · ' + (tile.dataset.cat || '');
        const tipWidth = Math.min(text.length * 5.6 + 18, window.innerWidth - margin * 2);
        const center = rect.left + rect.width / 2;
        let shift = 0;

        if (center - tipWidth / 2 < margin) shift = margin - (center - tipWidth / 2);
        else if (center + tipWidth / 2 > window.innerWidth - margin) shift = (window.innerWidth - margin) - (center + tipWidth / 2);

        if (shift !== 0) tile.style.setProperty('--tip-shift', shift + 'px');
    };

    tiles.forEach((tile) => {
        tile.addEventListener('mouseenter', () => adjustTip(tile));
        tile.addEventListener('focus', () => adjustTip(tile));
    });

    /* ---- filtro por categoria ---- */
    const filters = document.getElementById('skills-filters');
    if (!filters) return;

    filters.addEventListener('click', (e) => {
        const chip = e.target.closest('.chip');
        if (!chip) return;

        filters.querySelectorAll('.chip').forEach((c) => c.classList.remove('is-active'));
        chip.classList.add('is-active');

        const filter = chip.dataset.filter;
        let visible = 0;

        tiles.forEach((tile) => {
            const match = filter === 'all' || tile.dataset.cat === filter;
            tile.classList.toggle('is-dimmed', !match);
            if (match) visible++;
        });

        if (counter) counter.textContent = visible;
    });
})();
