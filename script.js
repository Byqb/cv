// Fetch and display GitHub repositories
const GITHUB_USERNAME = 'Byqb';

async function fetchGitHubRepos() {
    const projectsContainer = document.getElementById('github-projects');
    
    try {
        const response = await fetch(`https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=100`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch repositories');
        }
        
        const repos = await response.json();
        
        // Filter out forked repos and the cv repo itself
        const ownRepos = repos.filter(repo => !repo.fork);
        
        // Calculate and display language stats
        renderLanguageStats(ownRepos);
        
        // Clear loading message
        projectsContainer.innerHTML = '';
        
        // Display each repository
        ownRepos.forEach(repo => {
            const repoElement = createRepoElement(repo);
            projectsContainer.appendChild(repoElement);
        });
        
        // If no repos found
        if (ownRepos.length === 0) {
            projectsContainer.innerHTML = '<p class="code-line">  <span class="comment">// No projects found</span></p>';
        }
        
    } catch (error) {
        console.error('Error fetching repos:', error);
        projectsContainer.innerHTML = '<p class="code-line">  <span class="comment">// Error loading projects. Please check back later.</span></p>';
    }
}

function renderLanguageStats(repos) {
    const statsContainer = document.getElementById('language-stats-container');
    if (!statsContainer) return;

    // Calculate stats
    const apiLanguages = {};
    let totalCount = 0;

    repos.forEach(repo => {
        if (repo.language) {
            apiLanguages[repo.language] = (apiLanguages[repo.language] || 0) + 1;
            totalCount++;
        }
    });

    if (totalCount === 0) return;

    // Language colors (GitHub style)
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

    // Sort by usage
    const sortedLangs = Object.entries(apiLanguages)
        .sort(([, a], [, b]) => b - a);

    // Create Bar
    let barHTML = '<div class="lang-bar">';
    sortedLangs.forEach(([lang, count]) => {
        const percentage = (count / totalCount) * 100;
        const color = langColors[lang] || '#cccccc';
        barHTML += `<div style="width: ${percentage}%; background-color: ${color};" title="${lang}: ${count} projects (${Math.round(percentage)}%)"></div>`;
    });
    barHTML += '</div>';

    // Create Legend
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

// Theme switching functionality
let animationFrameId = null;
let resizeHandler = null;

function initThemeSwitcher() {
    const themeSelect = document.getElementById('theme-select');
    const savedTheme = localStorage.getItem('cv-theme') || 'solid';
    
    // Set initial theme
    setTheme(savedTheme);
    themeSelect.value = savedTheme;
    
    // Listen for changes
    themeSelect.addEventListener('change', (e) => {
        setTheme(e.target.value);
        localStorage.setItem('cv-theme', e.target.value);
    });
}

function setTheme(theme) {
    const body = document.body;
    
    // Remove all theme classes
    body.classList.remove('theme-solid', 'theme-gradient', 'theme-grid', 'theme-particles');
    
    // Cleanup particles animation
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    
    // Cleanup resize listener
    if (resizeHandler) {
        window.removeEventListener('resize', resizeHandler);
        resizeHandler = null;
    }
    
    // Apply new theme
    if (theme !== 'solid') {
        body.classList.add(`theme-${theme}`);
    }
    
    // Start particles animation if needed
    if (theme === 'particles') {
        initParticles();
    }
}

// Particles animation
function initParticles() {
    const canvas = document.getElementById('particles-canvas');
    if (!canvas) return; // Guard clause
    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    
    // Initial resize
    resizeCanvas();
    
    // Store handler for cleanup
    resizeHandler = resizeCanvas;
    window.addEventListener('resize', resizeHandler);
    
    // Particle settings
    const particles = [];
    const particleCount = 50;
    const colors = ['#c678dd', '#61afef', '#98c379', '#e06c75'];
    
    // Create particles
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
    
    // Animation loop
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Update and draw particles
        particles.forEach((p, i) => {
            // Update position
            p.x += p.vx;
            p.y += p.vy;
            
            // Bounce off edges
            if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
            if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
            
            // Draw particle
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.globalAlpha = 0.6;
            ctx.fill();
            
            // Draw connections
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

// Fetch GitHub Profile
async function fetchGitHubProfile() {
    try {
        const response = await fetch(`https://api.github.com/users/${GITHUB_USERNAME}`);
        if (!response.ok) throw new Error('Failed to fetch profile');
        
        const data = await response.json();
        const profilePic = document.getElementById('github-profile-pic');
        if (profilePic && data.avatar_url) {
            profilePic.src = data.avatar_url;
            
            // // Random border color animation
            // const colors = ['#c678dd', '#61afef', '#98c379', '#e06c75', '#d19a66', '#56b6c2'];
            // setInterval(() => {
            //     const randomColor = colors[Math.floor(Math.random() * colors.length)];
            //     profilePic.style.borderColor = randomColor;
            //     profilePic.style.boxShadow = `0 0 20px ${randomColor}4d`; // 4d = 30% opacity
            // }, 3000); // Changed to 3s for visibility (user said 30s but that is very slow)
        }
    } catch (error) {
        console.error('Error fetching profile:', error);
    }
}

// Fetch repos when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    fetchGitHubRepos();
    fetchGitHubProfile();
    initThemeSwitcher();
    
    // Update footer year dynamically
    const yearElement = document.getElementById('current-year');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }
});

