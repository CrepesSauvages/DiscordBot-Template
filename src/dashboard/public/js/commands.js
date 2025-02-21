document.addEventListener('DOMContentLoaded', () => {
    // Éléments du DOM
    const searchInput = document.getElementById('commandSearch');
    const commandCards = document.querySelectorAll('.command-card');
    const modal = document.getElementById('commandModal');
    const closeModal = document.querySelector('.close-modal');
    const settingsButtons = document.querySelectorAll('.btn-settings');
    const commandToggles = document.querySelectorAll('.switch input');

    // Fonction de traduction
    const t = (key, replacements = {}) => {
        let translation = key.split('.').reduce((obj, k) => obj?.[k], translations);
        if (!translation) return key;

        return translation.replace(/\{(\w+)\}/g, (match, key) => {
            return replacements.hasOwnProperty(key) ? replacements[key] : match;
        });
    };

    // Fonction de recherche avec animation
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        
        commandCards.forEach(card => {
            const commandName = card.dataset.name.toLowerCase();
            const description = card.querySelector('.command-description').textContent.toLowerCase();
            const matches = commandName.includes(searchTerm) || description.includes(searchTerm);
            
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

    // Gestion des toggles de commandes
    commandToggles.forEach(toggle => {
        toggle.addEventListener('change', async (e) => {
            const commandName = e.target.dataset.command;
            const enabled = e.target.checked;
            const card = e.target.closest('.command-card');
            
            try {
                showLoadingState(card);
                
                const response = await fetch(`/api/guild/${guildId}/commands/${commandName}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ enabled })
                });

                if (!response.ok) throw new Error(t('common.error.server'));
                
                showSuccessState(card);
                showNotification(t('dashboard.notifications.commandUpdated'), 'success');
            } catch (error) {
                console.error('Erreur:', error);
                e.target.checked = !enabled;
                showErrorState(card);
                showNotification(t('dashboard.notifications.commandError'), 'error');
            }
        });
    });

    // Gestion du modal des paramètres
    settingsButtons.forEach(button => {
        button.addEventListener('click', async () => {
            const commandName = button.dataset.command;
            try {
                const response = await fetch(`/api/guild/${guildId}/commands/${commandName}/settings`);
                if (!response.ok) throw new Error(t('common.error.server'));
                
                const settings = await response.json();
                populateModal(commandName, settings);
                showModal();
            } catch (error) {
                console.error('Erreur:', error);
                showNotification(t('common.error.loading'), 'error');
            }
        });
    });

    // Fermeture du modal
    closeModal.addEventListener('click', hideModal);
    window.addEventListener('click', (e) => {
        if (e.target === modal) hideModal();
    });

    // Gestion du formulaire de paramètres
    const settingsForm = document.getElementById('commandSettings');
    settingsForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const commandName = modal.dataset.command;
        const formData = new FormData(e.target);
        
        const settings = {
            cooldown: parseInt(formData.get('cooldown')),
            permissions: Array.from(formData.getAll('permissions'))
        };

        try {
            const response = await fetch(`/api/guild/${guildId}/commands/${commandName}/settings`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            });

            if (!response.ok) throw new Error(t('common.error.server'));
            
            hideModal();
            showNotification(t('dashboard.notifications.commandUpdated'), 'success');
        } catch (error) {
            console.error('Erreur:', error);
            showNotification(t('dashboard.notifications.commandError'), 'error');
        }
    });

    // Fonctions utilitaires
    function showLoadingState(card) {
        card.classList.add('loading');
    }

    function showSuccessState(card) {
        card.classList.remove('loading');
        card.classList.add('success');
        setTimeout(() => card.classList.remove('success'), 2000);
    }

    function showErrorState(card) {
        card.classList.remove('loading');
        card.classList.add('error');
        setTimeout(() => card.classList.remove('error'), 2000);
    }

    function showModal() {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    function hideModal() {
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }

    function populateModal(commandName, settings) {
        modal.dataset.command = commandName;
        const title = modal.querySelector('h2');
        title.textContent = t('dashboard.commands.modal.title', { command: commandName });
        
        const cooldownInput = modal.querySelector('[name="cooldown"]');
        cooldownInput.value = settings.cooldown || 0;
        
        const permissionsSelect = modal.querySelector('[name="permissions"]');
        Array.from(permissionsSelect.options).forEach(option => {
            option.selected = settings.permissions?.includes(option.value);
        });
    }

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
}); 