const GITHUB_USERNAME = 'Byqb';
const CACHE_KEY = 'github_repos_cache';
const CACHE_DURATION = 1000 * 60 * 60;

function getCachedRepos() {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    
    try {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp > CACHE_DURATION) {
            localStorage.removeItem(CACHE_KEY);
            return null;
        }
        return data;
    } catch {
        return null;
    }
}

function setCachedRepos(repos) {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
        data: repos,
        timestamp: Date.now()
    }));
}

function showSkeletonLoading() {
    const projectsContainer = document.getElementById('github-projects');
    if (!projectsContainer) return;
    
    projectsContainer.innerHTML = `
        <div class="skeleton-card">
            <div class="skeleton-line" style="width: 40%"></div>
            <div class="skeleton-line" style="width: 80%"></div>
            <div class="skeleton-line" style="width: 60%"></div>
        </div>
        <div class="skeleton-card">
            <div class="skeleton-line" style="width: 35%"></div>
            <div class="skeleton-line" style="width: 75%"></div>
            <div class="skeleton-line" style="width: 50%"></div>
        </div>
    `;
}

function showErrorState(message, showRetry = true) {
    const projectsContainer = document.getElementById('github-projects');
    const statsContainer = document.getElementById('language-stats-container');
    if (!projectsContainer) return;
    
    if (statsContainer) statsContainer.innerHTML = '';
    
    const retryButton = showRetry ? '<button class="retry-btn" onclick="fetchGitHubRepos()">Retry</button>' : '';
    projectsContainer.innerHTML = `
        <div class="error-state">
            <p class="code-line"><span class="comment">// ${message}</span></p>
            ${retryButton}
        </div>
    `;
}

async function fetchGitHubRepos() {
    const projectsContainer = document.getElementById('github-projects');
    
    showSkeletonLoading();
    
    const cachedRepos = getCachedRepos();
    if (cachedRepos) {
        renderRepos(cachedRepos);
        return;
    }
    
    try {
        const response = await fetch(`https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=100`);
        
        if (!response.ok) {
            if (response.status === 403) {
                showErrorState('API rate limit exceeded. Try again later.', true);
                return;
            }
            if (response.status === 404) {
                showErrorState('User not found.', false);
                return;
            }
            throw new Error('Failed to fetch repositories');
        }
        
        const repos = await response.json();
        
        if (!Array.isArray(repos)) {
            showErrorState('Unable to load projects.', true);
            return;
        }
        
        const ownRepos = repos.filter(repo => !repo.fork);
        
        setCachedRepos(ownRepos);
        renderRepos(ownRepos);
        
    } catch (error) {
        console.error('Error fetching repos:', error);
        showErrorState('Error loading projects. Please try again.', true);
    }
}

function renderRepos(ownRepos) {
    const projectsContainer = document.getElementById('github-projects');
    if (!projectsContainer) return;
    
    renderLanguageStats(ownRepos);
    projectsContainer.innerHTML = '';
    
    if (ownRepos.length === 0) {
        projectsContainer.innerHTML = `
            <div class="empty-state">
                <p class="code-line"><span class="comment">// No public projects yet. Check back soon!</span></p>
            </div>
        `;
        return;
    }
    
    ownRepos.forEach(repo => {
        const repoElement = createRepoElement(repo);
        projectsContainer.appendChild(repoElement);
    });
}

function renderLanguageStats(repos) {
    const statsContainer = document.getElementById('language-stats-container');
    if (!statsContainer) return;

    const apiLanguages = {};
    let totalCount = 0;

    repos.forEach(repo => {
        if (repo.language) {
            apiLanguages[repo.language] = (apiLanguages[repo.language] || 0) + 1;
            totalCount++;
        }
    });

    if (totalCount === 0) return;

    const langColors = {
        'JavaScript': '#f1e05a',
        'TypeScript': '#2b7489',
        'HTML': '#e34c26',
        'CSS': '#563d7c',
        'Java': '#b07219',
        'Python': '#3572A5',
        'Go': '#00ADD8',
        'Rust': '#dea584',
        'PHP': '#4F5D95',
        'Shell': '#89e051',
        'Vue': '#41b883',
        'C++': '#f34b7d',
        'C': '#555555'
    };

    const sortedLangs = Object.entries(apiLanguages)
        .sort(([, a], [, b]) => b - a);

    let barHTML = '<div class="lang-bar">';
    sortedLangs.forEach(([lang, count]) => {
        const percentage = (count / totalCount) * 100;
        const color = langColors[lang] || '#cccccc';
        barHTML += `<div style="width: ${percentage}%; background-color: ${color};" title="${lang}: ${count} projects (${Math.round(percentage)}%)"></div>`;
    });
    barHTML += '</div>';

    let legendHTML = '<div class="lang-legend">';
    sortedLangs.forEach(([lang, count]) => {
        const percentage = Math.round((count / totalCount) * 100);
        const color = langColors[lang] || '#cccccc';
        legendHTML += `
            <div class="lang-item">
                <span class="lang-dot" style="background-color: ${color}"></span>
                <span class="lang-name">${lang}</span>
                <span class="lang-percent">${percentage}%</span>
            </div>
        `;
    });
    legendHTML += '</div>';

    statsContainer.innerHTML = barHTML + legendHTML;
}

function createRepoElement(repo) {
    const container = document.createElement('div');
    container.className = 'project-item';
    
    const description = repo.description || 'No description available';
    const language = repo.language || 'Not specified';
    const name = escapeHtml(repo.name);
    const url = escapeHtml(repo.html_url);
    const escapedLanguage = escapeHtml(language);
    
    container.innerHTML = `
        <p class="code-line">  {</p>
        <p class="code-line">    <span class="keyword">name</span>: <span class="string">"<a href="${url}" target="_blank" rel="noopener noreferrer" class="project-link">${name}</a>"</span>,</p>
        <p class="code-line">    <span class="keyword">description</span>: <span class="string">"${escapeHtml(description)}"</span>,</p>
        <p class="code-line">    <span class="keyword">language</span>: <span class="string">"${escapedLanguage}"</span>,</p>
        <p class="code-line">    <span class="keyword">link</span>: <span class="string">"<a href="${url}" target="_blank" rel="noopener noreferrer" class="project-link">${url}</a>"</span></p>
        <p class="code-line">  },</p>
    `;
    
    return container;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

let animationFrameId = null;
let resizeHandler = null;

function initThemeSwitcher() {
    const themeSelect = document.getElementById('theme-select');
    const savedTheme = localStorage.getItem('cv-theme') || 'solid';
    
    setTheme(savedTheme);
    themeSelect.value = savedTheme;
    
    themeSelect.addEventListener('change', (e) => {
        setTheme(e.target.value);
        localStorage.setItem('cv-theme', e.target.value);
    });
}

function setTheme(theme) {
    const body = document.body;
    
    body.classList.remove('theme-solid', 'theme-gradient', 'theme-grid', 'theme-particles');
    
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    
    if (resizeHandler) {
        window.removeEventListener('resize', resizeHandler);
        resizeHandler = null;
    }
    
    if (theme !== 'solid') {
        body.classList.add(`theme-${theme}`);
    }
    
    if (theme === 'particles') {
        initParticles();
    }
}

function initParticles() {
    const canvas = document.getElementById('particles-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    
    resizeCanvas();
    
    resizeHandler = resizeCanvas;
    window.addEventListener('resize', resizeHandler);
    
    const particles = [];
    const particleCount = 50;
    const colors = ['#c678dd', '#61afef', '#98c379', '#e06c75'];
    
    for (let i = 0; i < particleCount; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            radius: Math.random() * 2 + 1,
            color: colors[Math.floor(Math.random() * colors.length)]
        });
    }
    
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        particles.forEach((p, i) => {
            p.x += p.vx;
            p.y += p.vy;
            
            if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
            if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
            
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.globalAlpha = 0.6;
            ctx.fill();
            
            particles.slice(i + 1).forEach(p2 => {
                const dx = p.x - p2.x;
                const dy = p.y - p2.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 150) {
                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.strokeStyle = p.color;
                    ctx.globalAlpha = 0.1 * (1 - distance / 150);
                    ctx.stroke();
                }
            });
        });
        
        ctx.globalAlpha = 1;
        animationFrameId = requestAnimationFrame(animate);
    }
    
    animate();
}

function initColorTheme() {
    const toggleBtn = document.getElementById('color-theme-toggle');
    const savedTheme = localStorage.getItem('color-theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    const initialTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
    applyColorTheme(initialTheme);
    
    toggleBtn.addEventListener('click', () => {
        const currentTheme = document.body.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        applyColorTheme(newTheme);
        localStorage.setItem('color-theme', newTheme);
    });
    
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem('color-theme')) {
            applyColorTheme(e.matches ? 'dark' : 'light');
        }
    });
}

function applyColorTheme(theme) {
    if (theme === 'light') {
        document.body.setAttribute('data-theme', 'light');
    } else {
        document.body.removeAttribute('data-theme');
    }
}

function initHamburgerMenu() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    
    if (!hamburger || !navMenu) return;
    
    hamburger.addEventListener('click', () => {
        const isExpanded = hamburger.getAttribute('aria-expanded') === 'true';
        hamburger.setAttribute('aria-expanded', !isExpanded);
        navMenu.classList.toggle('active');
    });
    
    document.querySelectorAll('.nav-menu a').forEach(link => {
        link.addEventListener('click', () => {
            hamburger.setAttribute('aria-expanded', 'false');
            navMenu.classList.remove('active');
        });
    });
}

function initScrollSpy() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-menu a');
    
    if (!sections.length || !navLinks.length) return;
    
    const observerOptions = {
        rootMargin: '-50% 0px -50% 0px',
        threshold: 0
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('id');
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${id}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }, observerOptions);
    
    sections.forEach(section => observer.observe(section));
}

function initLazyLoadRepos() {
    const projectsSection = document.getElementById('projects');
    if (!projectsSection) return;
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                fetchGitHubRepos();
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });
    
    observer.observe(projectsSection);
}

function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js')
            .then(reg => console.log('Service Worker registered'))
            .catch(err => console.log('Service Worker registration failed:', err));
    }
}

function initBackToTop() {
    const backToTopBtn = document.getElementById('back-to-top');
    if (!backToTopBtn) return;
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            backToTopBtn.classList.add('visible');
        } else {
            backToTopBtn.classList.remove('visible');
        }
    });
    
    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initThemeSwitcher();
    initColorTheme();
    initHamburgerMenu();
    initScrollSpy();
    initLazyLoadRepos();
    initBackToTop();
    registerServiceWorker();
    
    setTimeout(() => {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.classList.add('hidden');
            setTimeout(() => {
                loadingScreen.remove();
            }, 300);
        }
    }, 800);

    const yearElement = document.getElementById('current-year');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }
});
