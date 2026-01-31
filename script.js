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

function createRepoElement(repo) {
    const container = document.createElement('div');
    container.className = 'project-item';
    
    const description = repo.description || 'No description available';
    const language = repo.language || 'Not specified';
    const name = escapeHtml(repo.name);
    const url = escapeHtml(repo.html_url);
    const escapedLanguage = escapeHtml(language);
    const stars = Number.isInteger(repo.stargazers_count) ? repo.stargazers_count : 0;
    
    container.innerHTML = `
        <p class="code-line">  {</p>
        <p class="code-line">    <span class="keyword">name</span>: <span class="string">"<a href="${url}" target="_blank" rel="noopener noreferrer" class="project-link">${name}</a>"</span>,</p>
        <p class="code-line">    <span class="keyword">description</span>: <span class="string">"${escapeHtml(description)}"</span>,</p>
        <p class="code-line">    <span class="keyword">language</span>: <span class="string">"${escapedLanguage}"</span>,</p>
        <p class="code-line">    <span class="keyword">stars</span>: <span class="number">${stars}</span>,</p>
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

// Fetch repos when DOM is loaded
document.addEventListener('DOMContentLoaded', fetchGitHubRepos);
