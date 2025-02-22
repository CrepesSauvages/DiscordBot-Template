document.addEventListener('DOMContentLoaded', () => {
    const saveAllButton = document.getElementById('saveAllSettings');
    const settingsInputs = document.querySelectorAll('.setting-input');
    const toggleInputs = document.querySelectorAll('.switch input');
    const guildId = window.location.pathname.split('/')[2];

    // Fonction de traduction
    const t = (key, replacements = {}) => {
        let translation = key.split('.').reduce((obj, k) => obj?.[k], translations);
        if (!translation) return key;

        return translation.replace(/\{(\w+)\}/g, (match, key) => {
            return replacements.hasOwnProperty(key) ? replacements[key] : match;
        });
    };

    // Fonction pour récupérer tous les paramètres
    function getAllSettings() {
        const settings = {
            language: document.querySelector('select[name="language"]').value
        };

        // Récupérer les autres paramètres (toggles, inputs, etc.)
        document.querySelectorAll('[data-setting]').forEach(element => {
            const setting = element.dataset.setting;
            if (element.type === 'checkbox') {
                settings[setting] = element.checked;
            } else {
                settings[setting] = element.value;
            }
        });

        return settings;
    }

    // Fonction pour afficher les notifications
    function showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('show');
        }, 100);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // Gestionnaire d'événement pour le bouton de sauvegarde
    saveAllButton.addEventListener('click', async () => {
        try {
            saveAllButton.disabled = true;
            saveAllButton.innerHTML = '<i class="material-icons">sync</i> Sauvegarde...';

            const settings = getAllSettings();
            const response = await fetch(`/api/guild/${guildId}/settings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(settings)
            });

            const data = await response.json();

            if (data.success) {
                showNotification('Paramètres sauvegardés avec succès');
            } else {
                throw new Error(data.error || 'Erreur lors de la sauvegarde');
            }
        } catch (error) {
            console.error('Erreur:', error);
            showNotification(error.message, 'error');
        } finally {
            saveAllButton.disabled = false;
            saveAllButton.innerHTML = '<i class="material-icons">save</i> Sauvegarder';
        }
    });

    // Auto-save pour les changements individuels
    document.querySelectorAll('[data-setting]').forEach(element => {
        element.addEventListener('change', async () => {
            const setting = element.dataset.setting;
            const value = element.type === 'checkbox' ? element.checked : element.value;

            try {
                const response = await fetch(`/api/guild/${guildId}/settings`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ [setting]: value })
                });

                const data = await response.json();

                if (!data.success) {
                    throw new Error(data.error || 'Erreur lors de la sauvegarde');
                }
            } catch (error) {
                console.error('Erreur:', error);
                showNotification(error.message, 'error');
            }
        });
    });

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
}); 