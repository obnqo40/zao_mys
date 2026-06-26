(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const canHoverPrecisely = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    const setupProgressBar = () => {
        const bar = document.createElement("div");
        bar.className = "site-progress";
        bar.setAttribute("aria-hidden", "true");
        document.body.appendChild(bar);

        const update = () => {
            const scrollTop = window.scrollY || document.documentElement.scrollTop;
            const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
            const progress = maxScroll > 0 ? Math.min(scrollTop / maxScroll, 1) : 0;
            bar.style.transform = `scaleX(${progress})`;
            document.body.classList.toggle("header-scrolled", scrollTop > 18);
        };

        update();
        window.addEventListener("scroll", update, { passive: true });
        window.addEventListener("resize", update);
    };

    const setupReveal = () => {
        const selectors = [
            "main > div > *",
            "main section",
            "main article",
            ".product-card",
            ".cert-card",
            ".cta-banner",
            ".contact-panel",
            "footer .grid > div",
            ".hero-bg .max-w-3xl",
            ".hero-bg .grid"
        ];

        const elements = Array.from(document.querySelectorAll(selectors.join(",")));
        const uniqueElements = [...new Set(elements)].filter((element) => {
            if (!(element instanceof HTMLElement)) return false;
            if (element.closest(".site-progress")) return false;
            return true;
        });

        uniqueElements.forEach((element, index) => {
            if (element.classList.contains("site-reveal")) return;
            element.classList.add("site-reveal");
            element.style.setProperty("--reveal-delay", `${Math.min(index % 6, 5) * 60}ms`);
        });

        if (prefersReducedMotion || !("IntersectionObserver" in window)) {
            uniqueElements.forEach((element) => element.classList.add("is-visible"));
            return;
        }

        const observer = new IntersectionObserver((entries, currentObserver) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add("is-visible");
                currentObserver.unobserve(entry.target);
            });
        }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });

        uniqueElements.forEach((element) => observer.observe(element));
    };

    const setupCounters = () => {
        const counters = Array.from(document.querySelectorAll("[data-counter]"));
        if (!counters.length) return;

        const animateCounter = (element) => {
            const target = Number(element.dataset.counter || 0);
            if (!Number.isFinite(target)) return;
            const suffix = element.dataset.counterSuffix || "";
            const duration = Number(element.dataset.counterDuration || 1400);

            if (prefersReducedMotion) {
                element.textContent = `${target}${suffix}`;
                return;
            }

            const start = performance.now();
            const tick = (timestamp) => {
                const progress = Math.min((timestamp - start) / duration, 1);
                const eased = 1 - Math.pow(1 - progress, 3);
                const value = Math.round(target * eased);
                element.textContent = `${value}${suffix}`;

                if (progress < 1) {
                    requestAnimationFrame(tick);
                }
            };

            requestAnimationFrame(tick);
        };

        if (!("IntersectionObserver" in window)) {
            counters.forEach(animateCounter);
            return;
        }

        const observer = new IntersectionObserver((entries, currentObserver) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                animateCounter(entry.target);
                currentObserver.unobserve(entry.target);
            });
        }, { threshold: 0.6 });

        counters.forEach((counter) => observer.observe(counter));
    };

    const setupTilt = () => {
        if (prefersReducedMotion || !canHoverPrecisely) return;

        const cards = document.querySelectorAll(".product-card, .cert-card, article.bg-slate-50");
        cards.forEach((card) => {
            if (!(card instanceof HTMLElement)) return;

            let frameId = 0;

            const reset = () => {
                cancelAnimationFrame(frameId);
                frameId = requestAnimationFrame(() => {
                    card.style.transform = "";
                });
            };

            card.addEventListener("mousemove", (event) => {
                const rect = card.getBoundingClientRect();
                const x = (event.clientX - rect.left) / rect.width;
                const y = (event.clientY - rect.top) / rect.height;
                const rotateY = (x - 0.5) * 4;
                const rotateX = (0.5 - y) * 4;

                cancelAnimationFrame(frameId);
                frameId = requestAnimationFrame(() => {
                    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
                });
            });

            card.addEventListener("mouseleave", reset);
            card.addEventListener("blur", reset, true);
        });
    };

    const setupImages = () => {
        const images = Array.from(document.images);
        images.forEach((image, index) => {
            if (!(image instanceof HTMLImageElement)) return;
            if (!image.hasAttribute("alt")) {
                image.alt = "";
            }

            image.decoding = "async";

            if (index < 2 || image.closest(".hero-bg")) {
                image.loading = "eager";
                image.fetchPriority = "high";
                return;
            }

            image.loading = "lazy";
        });
    };

    const enhanceContactForm = () => {
        const form = document.querySelector("form");
        const submitButton = form?.querySelector('button[type="button"], button[type="submit"]');
        const emailField = form?.querySelector('input[type="email"]');
        const nameField = form?.querySelector('input[type="text"]');
        const messageField = form?.querySelector("textarea");

        if (!(form instanceof HTMLFormElement) || !(submitButton instanceof HTMLButtonElement) || !(emailField instanceof HTMLInputElement) || !(messageField instanceof HTMLTextAreaElement)) {
            return;
        }

        const fields = Array.from(form.querySelectorAll("input, textarea"));
        fields.forEach((field) => {
            field.setAttribute("required", "required");
        });

        const feedback = document.createElement("p");
        feedback.className = "contact-submit-feedback text-xs text-slate-500 leading-relaxed";
        submitButton.insertAdjacentElement("afterend", feedback);

        const openMailDraft = () => {
            const name = (nameField.value || "").trim();
            const email = emailField.value.trim();
            const companyField = form.querySelectorAll('input[type="text"]')[1];
            const company = companyField instanceof HTMLInputElement ? companyField.value.trim() : "";
            const message = messageField.value.trim();

            const subject = company
                ? `Запрос с сайта ЗАО МЫС: ${company}`
                : "Запрос с сайта ЗАО МЫС";

            const body = [
                `Имя: ${name}`,
                `E-mail: ${email}`,
                `Компания / проект: ${company || "-"}`,
                "",
                "Сообщение:",
                message
            ].join("\n");

            window.location.href = `mailto:info@mpsplastik.ru?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        };

        const onSubmit = (event) => {
            event.preventDefault();
            form.classList.add("is-validating");

            if (!form.reportValidity()) {
                feedback.textContent = "Проверьте поля формы: нужны имя, e-mail, проект и сообщение.";
                feedback.className = "contact-submit-feedback text-xs text-red-500 leading-relaxed";
                return;
            }

            feedback.textContent = "Открываю подготовленное письмо в вашем почтовом клиенте.";
            feedback.className = "contact-submit-feedback text-xs text-emerald-600 leading-relaxed";
            openMailDraft();
        };

        submitButton.setAttribute("type", "submit");
        form.addEventListener("submit", onSubmit);
    };

    document.addEventListener("DOMContentLoaded", () => {
        setupImages();
        setupProgressBar();
        setupReveal();
        setupCounters();
        setupTilt();
        enhanceContactForm();
    });
})();
