/**
 * writeups_toc.js
 * Dynamically generates a Table of Contents (TOC) sidebar for writeup pages based on headers.
 */
document.addEventListener("DOMContentLoaded", () => {
    const mainContent = document.querySelector('.challenge-main');
    if (!mainContent) return;

    const headers = mainContent.querySelectorAll('h1, h2, h3, h4, h5');
    if (headers.length === 0) return;

    // Add class to body to allow CSS layout adjustment for the TOC sidebar
    document.body.classList.add('has-toc');

    // Generate TOC Container
    const tocContainer = document.createElement('nav');
    tocContainer.className = 'writeup-toc';
    tocContainer.setAttribute('aria-label', 'Table of Contents');

    const tocTitle = document.createElement('h3');
    tocTitle.textContent = 'Overview';
    tocContainer.appendChild(tocTitle);

    const tocList = document.createElement('ul');
    tocContainer.appendChild(tocList);

    const tocItems = [];

    // Ensure unique IDs
    const idCount = {};

    headers.forEach((header, index) => {
        // Base ID generation from text content or existing valid ID
        let baseId = header.id;
        if (!baseId || baseId === '') {
            baseId = header.textContent.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
        }
        if (!baseId) {
            baseId = 'section';
        }

        let finalId = baseId;
        if (idCount[baseId] !== undefined) {
            idCount[baseId]++;
            finalId = `${baseId}-${idCount[baseId]}`;
            header.id = finalId;
        } else {
            idCount[baseId] = 0;
            // Only override ID if it is not unique across the document
            if (!header.id || document.querySelectorAll(`#${header.id}`).length > 1) {
                header.id = finalId;
            } else {
                finalId = header.id;
            }
        }

        const listItem = document.createElement('li');
        listItem.className = 'toc-item';

        const link = document.createElement('a');
        link.href = `#${finalId}`;
        link.textContent = header.textContent;
        link.className = 'toc-link';

        // Setup click listener for smooth scroll
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = document.getElementById(finalId);
            if (target) {
                const navHeight = 80; // approximate top offset
                const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - navHeight;
                window.scrollTo({ top: targetPosition, behavior: 'smooth' });
                history.pushState(null, null, `#${finalId}`);
            }
        });

        listItem.appendChild(link);
        tocList.appendChild(listItem);

        tocItems.push({ header, link });
    });

    document.body.appendChild(tocContainer);

    // Highlighting current section on scroll
    const highlightOnScroll = () => {
        const scrollPosition = window.scrollY + 120; // Trigger offset

        let currentActive = null;

        for (let i = 0; i < tocItems.length; i++) {
            const item = tocItems[i];
            const headerTop = item.header.getBoundingClientRect().top + window.scrollY;

            if (headerTop <= scrollPosition) {
                currentActive = item;
            } else {
                break;
            }
        }

        // If at the top before any headers, highlight the first item
        if (!currentActive && tocItems.length > 0) {
            currentActive = tocItems[0];
        }

        tocItems.forEach(item => {
            item.link.classList.remove('active');
        });

        if (currentActive) {
            currentActive.link.classList.add('active');

            // Auto scroll the TOC area a bit so the active item stays visible
            const linkRect = currentActive.link.getBoundingClientRect();
            const tocRect = tocContainer.getBoundingClientRect();

            if (linkRect.bottom > tocRect.bottom) {
                tocContainer.scrollTop += (linkRect.bottom - tocRect.bottom + 20);
            } else if (linkRect.top < tocRect.top) {
                tocContainer.scrollTop -= (tocRect.top - linkRect.top + 20);
            }
        }
    };

    // Attach scroll and resize events
    window.addEventListener('scroll', highlightOnScroll, { passive: true });
    window.addEventListener('resize', highlightOnScroll, { passive: true });

    // Initial call
    setTimeout(highlightOnScroll, 100);
});
