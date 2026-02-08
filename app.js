// Typing animation function
function typeWriter(element, words, typingSpeed = 100, deletingSpeed = 50, pauseTime = 2000) {
    let wordIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    
    function type() {
        const current = words[wordIndex];
        
        if (isDeleting) {
            // Delete characters (backspace)
            element.textContent = current.substring(0, charIndex - 1);
            charIndex--;
            
            if (charIndex === 0) {
                // Finished deleting, move to next word
                isDeleting = false;
                wordIndex = (wordIndex + 1) % words.length;
                setTimeout(type, 500); // Pause before typing next word
                return;
            }
            
            setTimeout(type, deletingSpeed);
        } else {
            // Type characters
            element.textContent = current.substring(0, charIndex + 1);
            charIndex++;
            
            if (charIndex === current.length) {
                // Finished typing, wait then start deleting
                isDeleting = true;
                setTimeout(type, pauseTime);
                return;
            }
            
            setTimeout(type, typingSpeed);
        }
    }
    
    // Start typing
    type();
}

// Preload hero/portfolio background image and add .bg-loaded when ready (smooth fade-in)
function initBackgroundPreload() {
    var img = new Image();
    img.onload = function() {
        document.querySelector('.home')?.classList.add('bg-loaded');
        document.querySelector('.Portfolio')?.classList.add('bg-loaded');
    };
    img.src = 'assets/images/html1.png';
}

// Consolidated DOMContentLoaded - All initialization in one place
document.addEventListener('DOMContentLoaded', function() {
    initBackgroundPreload();
    // Initialize typing animation
    const typingElement = document.querySelector('.typing-text');
    if (typingElement) {
        const words = ['Fullstack Developer', 'React Native Developer', 'C# .NET Core Developer', 'Web Developer', 'Mobile App Developer', 'API Developer'];
        typeWriter(typingElement, words, 100, 50, 2000);
    }
    // Hamburger menu toggle
    const hamburger = document.querySelector('.hamburger');
    const navbar = document.querySelector('.navbar');
    
    if (hamburger && navbar) {
        hamburger.addEventListener('click', function() {
            hamburger.classList.toggle('active');
            navbar.classList.toggle('active');
            hamburger.setAttribute('aria-expanded', hamburger.classList.contains('active'));
        });

        // Close menu when clicking outside (mobile)
        document.addEventListener('click', function(event) {
            if (window.innerWidth <= 768 && 
                navbar.classList.contains('active') &&
                !navbar.contains(event.target) &&
                !hamburger.contains(event.target)) {
                hamburger.classList.remove('active');
                navbar.classList.remove('active');
                hamburger.setAttribute('aria-expanded', 'false');
            }
        });
    }

    // Smooth scrolling to main components
    document.querySelectorAll('.navbar a').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();

            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);

            if (targetElement) {
                // Close mobile menu if open
                if (window.innerWidth <= 768 && hamburger && navbar) {
                    hamburger.classList.remove('active');
                    navbar.classList.remove('active');
                    hamburger.setAttribute('aria-expanded', 'false');
                }

                // Calculate offset based on screen size
                const offset = window.innerWidth <= 480 ? 40 : (window.innerWidth <= 768 ? 45 : 50);
                const elementPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - offset;

                window.scrollTo({
                    top: elementPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Dropdown table for work experience
    const expandableRows = document.querySelectorAll('.expandable-row');
    expandableRows.forEach(row => {
        row.addEventListener('click', function() {
            const detailsRow = this.nextElementSibling;
            const isVisible = detailsRow.classList.contains('active-row');

            if (isVisible) {
                detailsRow.classList.remove('active-row');
                this.classList.remove('expanded');
                this.setAttribute('aria-expanded', 'false');
            } else {
                detailsRow.classList.add('active-row');
                this.classList.add('expanded');
                this.setAttribute('aria-expanded', 'true');
            }
        });

        // Add ARIA attributes for accessibility
        row.setAttribute('role', 'button');
        row.setAttribute('aria-expanded', 'false');
        row.setAttribute('tabindex', '0');

        // Keyboard support
        row.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                row.click();
            }
        });
    });

    // Intersection Observer for scroll animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Optional: Unobserve after animation to improve performance
                // observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe elements for scroll animations
    const animatedElements = document.querySelectorAll('.left_block, .right_block, .project-container, .Work_Experience, .Get_In_Touch, .github-grid-wrapper, .github-commits, .github-profile-btn');
    animatedElements.forEach((el, index) => {
        // Add animation class based on element position
        if (el.classList.contains('left_block')) {
            el.classList.add('slide-in-left');
        } else if (el.classList.contains('right_block')) {
            el.classList.add('slide-in-right');
        } else {
            el.classList.add('fade-in');
        }
        observer.observe(el);
    });

    // Separate observer for section titles — resets when they leave the viewport
    const titleObserver = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            } else {
                entry.target.classList.remove('visible');
            }
        });
    }, observerOptions);

    document.querySelectorAll('.section-title').forEach(title => {
        titleObserver.observe(title);
    });

    // Add scroll-triggered toolbar background + active navbar link highlighting
    let lastScroll = 0;
    const toolbar = document.querySelector('.toolbar');
    const navLinks = document.querySelectorAll('.navbar a');
    const sections = document.querySelectorAll('section[id]');

    function updateActiveNavLink() {
        const scrollPos = window.pageYOffset;
        // Offset accounts for the toolbar height + a small buffer
        const offset = window.innerWidth <= 480 ? 60 : (window.innerWidth <= 768 ? 70 : 100);

        let currentSection = '';

        sections.forEach(section => {
            const sectionTop = section.offsetTop - offset;
            const sectionBottom = sectionTop + section.offsetHeight;

            if (scrollPos >= sectionTop && scrollPos < sectionBottom) {
                currentSection = section.getAttribute('id');
            }
        });

        // If we're near the bottom of the page, highlight the last section
        if ((window.innerHeight + scrollPos) >= document.body.offsetHeight - 50) {
            currentSection = sections[sections.length - 1].getAttribute('id');
        }

        navLinks.forEach(link => {
            link.classList.remove('active');
            const href = link.getAttribute('href').substring(1);
            if (href === currentSection) {
                link.classList.add('active');
            }
        });
    }

    if (toolbar) {
        window.addEventListener('scroll', function() {
            const currentScroll = window.pageYOffset;
            if (currentScroll > 100) {
                toolbar.style.backgroundColor = 'rgba(0, 0, 0, 0.98)';
                toolbar.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.5)';
            } else {
                toolbar.style.backgroundColor = 'rgba(0, 0, 0, 0.95)';
                toolbar.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.3)';
            }
            lastScroll = currentScroll;

            // Update active nav link on scroll
            updateActiveNavLink();
        });

        // Set initial active state on page load
        updateActiveNavLink();
    }

    // Initialize GitHub Activity section
    initGitHubSection();
});

// ===== GitHub Activity Section =====

const GITHUB_USERNAME = 'RoguePython';
const CONTRIBUTIONS_API = `https://github-contributions-api.jogruber.de/v4/${GITHUB_USERNAME}`;
const EVENTS_API = `https://api.github.com/users/${GITHUB_USERNAME}/events/public`;
const CACHE_KEY_CONTRIBUTIONS = 'gh_contributions';
const CACHE_KEY_COMMITS = 'gh_commits';
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

function getCached(key) {
    try {
        const raw = sessionStorage.getItem(key);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (Date.now() - parsed.ts > CACHE_TTL) {
            sessionStorage.removeItem(key);
            return null;
        }
        return parsed.data;
    } catch { return null; }
}

function setCache(key, data) {
    try {
        sessionStorage.setItem(key, JSON.stringify({ ts: Date.now(), data }));
    } catch { /* storage full — ignore */ }
}

async function fetchGitHubContributions() {
    const cached = getCached(CACHE_KEY_CONTRIBUTIONS);
    if (cached) return cached;

    const res = await fetch(CONTRIBUTIONS_API);
    if (!res.ok) throw new Error('Contributions API error');
    const json = await res.json();
    // json.contributions is an object { "YYYY-MM-DD": count, ... }
    const data = json.contributions;
    setCache(CACHE_KEY_CONTRIBUTIONS, data);
    return data;
}

async function fetchRecentCommits() {
    const cached = getCached(CACHE_KEY_COMMITS);
    if (cached) return cached;

    const res = await fetch(EVENTS_API);
    if (!res.ok) throw new Error('Events API error');
    const events = await res.json();

    const commits = [];
    for (const event of events) {
        if (event.type !== 'PushEvent' || !event.payload.commits) continue;
        for (const c of event.payload.commits) {
            commits.push({
                repo: event.repo.name,
                message: c.message.split('\n')[0], // first line only
                sha: c.sha,
                date: event.created_at,
                url: `https://github.com/${event.repo.name}/commit/${c.sha}`
            });
            if (commits.length >= 3) break;
        }
        if (commits.length >= 3) break;
    }

    setCache(CACHE_KEY_COMMITS, commits);
    return commits;
}

function renderContributionGrid(contributions) {
    const gridEl = document.getElementById('github-grid');
    const monthsEl = document.getElementById('github-months');
    if (!gridEl || !monthsEl) return;

    // Build 52 weeks of data ending today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const totalDays = 52 * 7;

    // Find the most recent Sunday to align the grid
    const endDay = new Date(today);
    endDay.setDate(endDay.getDate() + (6 - endDay.getDay())); // move to Saturday

    const startDay = new Date(endDay);
    startDay.setDate(startDay.getDate() - totalDays + 1);

    // Determine max contribution for color scaling
    let maxCount = 0;
    const dayData = [];
    const cursor = new Date(startDay);
    while (cursor <= endDay) {
        const key = cursor.toISOString().split('T')[0];
        const count = contributions[key] || 0;
        if (count > maxCount) maxCount = count;
        dayData.push({ date: key, count, day: cursor.getDay() });
        cursor.setDate(cursor.getDate() + 1);
    }

    // Build level thresholds (GitHub uses quartiles)
    function getLevel(count) {
        if (count === 0) return 0;
        if (maxCount <= 0) return 0;
        const pct = count / maxCount;
        if (pct <= 0.25) return 1;
        if (pct <= 0.5) return 2;
        if (pct <= 0.75) return 3;
        return 4;
    }

    // Clear skeleton
    gridEl.innerHTML = '';
    gridEl.classList.remove('github-grid-skeleton');
    monthsEl.innerHTML = '';

    // Render cells week by week (columns)
    const weeks = [];
    for (let i = 0; i < dayData.length; i += 7) {
        weeks.push(dayData.slice(i, i + 7));
    }

    // Month labels
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    let lastMonth = -1;
    weeks.forEach((week) => {
        // Use the first day of the week to determine month
        const d = new Date(week[0].date);
        const m = d.getMonth();
        const span = document.createElement('span');
        if (m !== lastMonth && d.getDate() <= 7) {
            span.textContent = monthNames[m];
            lastMonth = m;
        }
        monthsEl.appendChild(span);
    });

    // Render grid cells
    weeks.forEach((week) => {
        const col = document.createElement('div');
        col.className = 'github-grid-col';
        week.forEach((day) => {
            const cell = document.createElement('div');
            cell.className = 'github-grid-cell';
            cell.dataset.level = getLevel(day.count);
            cell.dataset.date = day.date;
            cell.dataset.count = day.count;

            // Tooltip
            const dateObj = new Date(day.date + 'T00:00:00');
            const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            const countStr = day.count === 1 ? '1 contribution' : `${day.count} contributions`;
            cell.setAttribute('title', `${countStr} on ${dateStr}`);
            cell.setAttribute('aria-label', `${countStr} on ${dateStr}`);

            col.appendChild(cell);
        });
        gridEl.appendChild(col);
    });
}

function renderCommitCards(commits) {
    const container = document.getElementById('github-commits');
    if (!container) return;

    container.innerHTML = '';

    if (commits.length === 0) {
        container.innerHTML = '<p class="github-no-data">No recent commits found.</p>';
        return;
    }

    commits.forEach((commit) => {
        const card = document.createElement('a');
        card.className = 'github-commit-card';
        card.href = commit.url;
        card.target = '_blank';
        card.rel = 'noopener noreferrer';

        // Repo name (strip owner prefix)
        const repoShort = commit.repo.includes('/') ? commit.repo.split('/')[1] : commit.repo;

        // Relative time
        const timeAgo = getRelativeTime(new Date(commit.date));

        // Truncate message
        const msg = commit.message.length > 72 ? commit.message.substring(0, 69) + '...' : commit.message;

        card.innerHTML = `
            <span class="commit-repo">${escapeHtml(repoShort)}</span>
            <span class="commit-message">${escapeHtml(msg)}</span>
            <span class="commit-time">${escapeHtml(timeAgo)}</span>
        `;

        container.appendChild(card);
    });
}

function getRelativeTime(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);

    if (diffDay > 30) {
        const diffMonth = Math.floor(diffDay / 30);
        return diffMonth === 1 ? '1 month ago' : `${diffMonth} months ago`;
    }
    if (diffDay > 0) return diffDay === 1 ? '1 day ago' : `${diffDay} days ago`;
    if (diffHr > 0) return diffHr === 1 ? '1 hour ago' : `${diffHr} hours ago`;
    if (diffMin > 0) return diffMin === 1 ? '1 minute ago' : `${diffMin} minutes ago`;
    return 'just now';
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

async function initGitHubSection() {
    const gridEl = document.getElementById('github-grid');
    const commitsEl = document.getElementById('github-commits');
    const errorEl = document.getElementById('github-error');
    const retryEl = document.getElementById('github-retry');

    if (!gridEl || !commitsEl) return;

    async function loadData() {
        // Hide error, show skeletons
        if (errorEl) errorEl.hidden = true;
        gridEl.innerHTML = '<div class="github-grid-skeleton"></div>';
        commitsEl.innerHTML = `
            <div class="github-commit-card github-skeleton"><div class="skeleton-line skeleton-short"></div><div class="skeleton-line skeleton-long"></div><div class="skeleton-line skeleton-medium"></div></div>
            <div class="github-commit-card github-skeleton"><div class="skeleton-line skeleton-short"></div><div class="skeleton-line skeleton-long"></div><div class="skeleton-line skeleton-medium"></div></div>
            <div class="github-commit-card github-skeleton"><div class="skeleton-line skeleton-short"></div><div class="skeleton-line skeleton-long"></div><div class="skeleton-line skeleton-medium"></div></div>
        `;

        let hasError = false;

        try {
            const contributions = await fetchGitHubContributions();
            renderContributionGrid(contributions);
        } catch (e) {
            console.warn('Failed to load GitHub contributions:', e);
            gridEl.innerHTML = '';
            hasError = true;
        }

        try {
            const commits = await fetchRecentCommits();
            renderCommitCards(commits);
        } catch (e) {
            console.warn('Failed to load recent commits:', e);
            commitsEl.innerHTML = '';
            hasError = true;
        }

        if (hasError && errorEl) {
            errorEl.hidden = false;
        }
    }

    // Retry handler
    if (retryEl) {
        retryEl.addEventListener('click', function(e) {
            e.preventDefault();
            sessionStorage.removeItem(CACHE_KEY_CONTRIBUTIONS);
            sessionStorage.removeItem(CACHE_KEY_COMMITS);
            loadData();
        });
    }

    loadData();
}
