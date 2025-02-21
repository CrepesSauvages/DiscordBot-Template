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