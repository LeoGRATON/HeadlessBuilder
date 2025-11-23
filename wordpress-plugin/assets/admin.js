(function($) {
    'use strict';

    const HBSync = {
        init: function() {
            this.bindEvents();
            this.loadStatus();
        },

        bindEvents: function() {
            $('#hb-save-settings').on('click', this.saveSettings.bind(this));
            $('#hb-sync-now').on('click', this.syncNow.bind(this));
        },

        saveSettings: function() {
            const button = $('#hb-save-settings');
            const originalText = button.text();

            button.prop('disabled', true).text('Saving...');

            $.ajax({
                url: hbSync.ajaxUrl,
                type: 'POST',
                data: {
                    action: 'hb_save_settings',
                    nonce: hbSync.nonce,
                    builder_url: $('#hb_builder_url').val(),
                    project_id: $('#hb_project_id').val(),
                    api_token: $('#hb_api_token').val()
                },
                success: function(response) {
                    alert('Settings saved successfully!');
                },
                error: function(xhr) {
                    alert('Error saving settings: ' + xhr.responseText);
                },
                complete: function() {
                    button.prop('disabled', false).text(originalText);
                }
            });
        },

        syncNow: function() {
            const button = $('#hb-sync-now');
            const originalText = button.text();
            const builderUrl = $('#hb_builder_url').val();
            const projectId = $('#hb_project_id').val();
            const apiToken = $('#hb_api_token').val();

            if (!builderUrl || !projectId || !apiToken) {
                alert('Please fill in all configuration fields first');
                return;
            }

            button.prop('disabled', true).html('<span class="hb-sync-loading"></span> Syncing...');

            // Fetch ACF field groups from builder
            $.ajax({
                url: builderUrl + '/api/export/projects/' + projectId + '/acf',
                type: 'GET',
                headers: {
                    'Authorization': 'Bearer ' + apiToken
                },
                success: function(response) {
                    if (response.success && response.data.fieldGroups) {
                        HBSync.importFieldGroups(response.data.fieldGroups);
                    } else {
                        alert('Failed to fetch field groups from builder');
                        button.prop('disabled', false).text(originalText);
                    }
                },
                error: function(xhr) {
                    alert('Error connecting to builder: ' + xhr.responseText);
                    button.prop('disabled', false).text(originalText);
                }
            });
        },

        importFieldGroups: function(fieldGroups) {
            const button = $('#hb-sync-now');
            const originalText = 'Sync Now';

            $.ajax({
                url: hbSync.restUrl + 'sync',
                type: 'POST',
                headers: {
                    'X-WP-Nonce': hbSync.nonce
                },
                contentType: 'application/json',
                data: JSON.stringify({
                    fieldGroups: fieldGroups
                }),
                success: function(response) {
                    if (response.success) {
                        const msg = 'Sync completed!\n' +
                                  'Imported: ' + response.imported.length + '\n' +
                                  'Errors: ' + response.errors.length;
                        alert(msg);
                        HBSync.addLog(response);
                    }
                },
                error: function(xhr) {
                    alert('Error importing field groups: ' + xhr.responseText);
                },
                complete: function() {
                    button.prop('disabled', false).text(originalText);
                    HBSync.loadStatus();
                }
            });
        },

        loadStatus: function() {
            $.ajax({
                url: hbSync.restUrl + 'status',
                type: 'GET',
                headers: {
                    'X-WP-Nonce': hbSync.nonce
                },
                success: function(response) {
                    if (response.success) {
                        HBSync.renderStatus(response);
                    }
                }
            });
        },

        renderStatus: function(data) {
            const statusHtml = `
                <div class="hb-status-item">
                    <span class="dashicons dashicons-${data.acfActive ? 'yes-alt success' : 'dismiss error'} hb-status-icon"></span>
                    <span>Advanced Custom Fields: ${data.acfActive ? 'Active' : 'Not Active'}</span>
                </div>
                <div class="hb-status-item">
                    <span class="dashicons dashicons-${data.wpGraphQLActive ? 'yes-alt success' : 'dismiss error'} hb-status-icon"></span>
                    <span>WPGraphQL: ${data.wpGraphQLActive ? 'Active' : 'Not Active'}</span>
                </div>
                <div class="hb-status-item">
                    <span class="dashicons dashicons-admin-generic hb-status-icon"></span>
                    <span>Total Field Groups: ${data.totalFieldGroups}</span>
                </div>
            `;

            $('#hb-sync-status').html(statusHtml);
        },

        addLog: function(data) {
            const time = new Date().toLocaleString();
            const logHtml = `
                <div class="hb-sync-log ${data.errors.length > 0 ? 'error' : ''}">
                    <div class="hb-sync-log-time">${time}</div>
                    <div>Imported: ${data.imported.length} field groups</div>
                    ${data.errors.length > 0 ? '<div>Errors: ' + data.errors.length + '</div>' : ''}
                </div>
            `;

            $('#hb-sync-logs').prepend(logHtml);
        }
    };

    $(document).ready(function() {
        HBSync.init();
    });

})(jQuery);
