document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('serverSearch');
    const serverCards = document.querySelectorAll('.server-card');

    // Fonction de traduction
    const t = (key, replacements = {}) => {
        let translation = key.split('.').reduce((obj, k) => obj?.[k], translations);
        if (!translation) return key;

        return translation.replace(/\{(\w+)\}/g, (match, key) => {
            return replacements.hasOwnProperty(key) ? replacements[key] : match;
        });
    };

    // Recherche de serveurs en temps réel
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            
            serverCards.forEach(card => {
                const serverName = card.querySelector('h3').textContent.toLowerCase();
                const matches = serverName.includes(searchTerm);
                
                // Animation de fade
                if (matches) {
                    card.style.display = 'block';
                    setTimeout(() => {
                        card.style.opacity = '1';
                        card.style.transform = 'translateY(0)';
                    }, 50);
                } else {
                    card.style.opacity = '0';
                    card.style.transform = 'translateY(20px)';
                    setTimeout(() => {
                        card.style.display = 'none';
                    }, 300);
                }
            });
        });
    }

    // Animation des cartes au défilement
    const observerOptions = {
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    serverCards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        observer.observe(card);
    });

    // Effet de survol sur les cartes
    serverCards.forEach(card => {
        const banner = card.querySelector('.server-banner');
        
        card.addEventListener('mouseenter', () => {
            banner.style.transform = 'scale(1.05)';
        });
        
        card.addEventListener('mouseleave', () => {
            banner.style.transform = 'scale(1)';
        });
    });

    // Gestion du thème sombre/clair
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
    const body = document.body;

    function setTheme(isDark) {
        if (isDark) {
            body.classList.add('dark-theme');
        } else {
            body.classList.remove('dark-theme');
        }
    }

    // Initialiser le thème
    setTheme(prefersDarkScheme.matches);

    // Écouter les changements de thème système
    prefersDarkScheme.addListener((e) => setTheme(e.matches));

    // Fonction pour afficher les notifications
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => notification.classList.add('show'), 50);
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // Gestion des erreurs
    window.addEventListener('error', (event) => {
        showNotification(t('common.error'), 'error');
        console.error('Erreur:', event.error);
    });
}); 