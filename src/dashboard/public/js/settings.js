document.addEventListener('DOMContentLoaded', () => {
    const saveAllButton = document.getElementById('saveAllSettings');
    const settingsInputs = document.querySelectorAll('.setting-input');
    const toggleInputs = document.querySelectorAll('.switch input');

    // Fonction de traduction
    const t = (key, replacements = {}) => {
        let translation = key.split('.').reduce((obj, k) => obj?.[k], translations);
        if (!translation) return key;

        return translation.replace(/\{(\w+)\}/g, (match, key) => {
            return replacements.hasOwnProperty(key) ? replacements[key] : match;
        });
    };

    // Fonction pour récupérer tous les paramètres
    const getAllSettings = () => {
        const settings = {
            language: document.querySelector('[name="language"]').value,
            logChannel: document.querySelector('[name="logChannel"]').value,
            welcomeChannel: document.querySelector('[name="welcomeChannel"]').value,
            welcomeMessage: document.querySelector('[name="welcomeMessage"]').value,
            autoRole: document.querySelector('[name="autoRole"]').value,
            antiSpam: document.querySelector('[name="antiSpam"]').checked,
            antiSpamThreshold: parseInt(document.querySelector('[name="antiSpamThreshold"]').value) || 5,
            antiLink: document.querySelector('[name="antiLink"]').checked,
            antiLinkWhitelist: Array.from(document.querySelector('[name="antiLinkWhitelist"]').selectedOptions).map(opt => opt.value)
        };
        return settings;
    };

    // Sauvegarde automatique lors des changements
    const autoSave = async (setting, value) => {
        try {
            showLoadingState(setting);
            
            const response = await fetch(`/api/guild/${guildId}/settings/${setting}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ value })
            });

            if (response.ok) {
                showSuccessState(setting);
                showNotification(t('dashboard.notifications.settingsSaved'), 'success');
            } else {
                throw new Error('Erreur serveur');
            }
        } catch (error) {
            console.error('Erreur:', error);
            showErrorState(setting);
            showNotification(t('dashboard.notifications.settingsError'), 'error');
        }
    };

    // États visuels des paramètres
    function showLoadingState(setting) {
        const card = document.querySelector(`[name="${setting}"]`).closest('.setting-card');
        card.classList.add('loading');
    }

    function showSuccessState(setting) {
        const card = document.querySelector(`[name="${setting}"]`).closest('.setting-card');
        card.classList.remove('loading');
        card.classList.add('success');
        setTimeout(() => card.classList.remove('success'), 2000);
    }

    function showErrorState(setting) {
        const card = document.querySelector(`[name="${setting}"]`).closest('.setting-card');
        card.classList.remove('loading');
        card.classList.add('error');
        setTimeout(() => card.classList.remove('error'), 2000);
    }

    // Écouteurs d'événements
    settingsInputs.forEach(input => {
        input.addEventListener('change', () => {
            const setting = input.name;
            const value = input.type === 'checkbox' ? input.checked : input.value;
            autoSave(setting, value);
        });
    });

    toggleInputs.forEach(toggle => {
        toggle.addEventListener('change', () => {
            const setting = toggle.name;
            autoSave(setting, toggle.checked);
        });
    });

    // Sauvegarde globale
    saveAllButton.addEventListener('click', async () => {
        try {
            saveAllButton.disabled = true;
            saveAllButton.innerHTML = `<i class="material-icons">sync</i> ${t('common.saving')}`;
            
            const settings = getAllSettings();
            const response = await fetch(`/api/guild/${guildId}/settings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            });

            if (response.ok) {
                showNotification(t('dashboard.notifications.settingsSaved'), 'success');
            } else {
                throw new Error('Erreur serveur');
            }
        } catch (error) {
            console.error('Erreur:', error);
            showNotification(t('dashboard.notifications.settingsError'), 'error');
        } finally {
            saveAllButton.disabled = false;
            saveAllButton.innerHTML = `<i class="material-icons">save</i> ${t('common.save')}`;
        }
    });

    // Notifications
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