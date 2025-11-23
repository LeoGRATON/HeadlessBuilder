<?php
/**
 * Plugin Name: Headless Builder Sync
 * Plugin URI: https://github.com/LeoGRATON/HeadlessBuilder
 * Description: Synchronize ACF field groups from Headless Builder
 * Version: 1.0.0
 * Author: Your Agency
 * Author URI: https://youragency.com
 * License: MIT
 * Text Domain: headless-builder-sync
 * Requires PHP: 7.4
 * Requires at least: 5.8
 */

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly
}

// Define plugin constants
define('HB_SYNC_VERSION', '1.0.0');
define('HB_SYNC_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('HB_SYNC_PLUGIN_URL', plugin_dir_url(__FILE__));

/**
 * Main plugin class
 */
class Headless_Builder_Sync {

    /**
     * Single instance
     */
    private static $instance = null;

    /**
     * Get instance
     */
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Constructor
     */
    private function __construct() {
        $this->init_hooks();
    }

    /**
     * Initialize hooks
     */
    private function init_hooks() {
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('admin_enqueue_scripts', array($this, 'enqueue_admin_scripts'));
        add_action('rest_api_init', array($this, 'register_rest_routes'));
        add_action('wp_ajax_hb_save_settings', array($this, 'ajax_save_settings'));
    }

    /**
     * Add admin menu
     */
    public function add_admin_menu() {
        add_menu_page(
            __('Headless Builder', 'headless-builder-sync'),
            __('Headless Builder', 'headless-builder-sync'),
            'manage_options',
            'headless-builder-sync',
            array($this, 'render_admin_page'),
            'dashicons-admin-generic',
            30
        );
    }

    /**
     * Enqueue admin scripts
     */
    public function enqueue_admin_scripts($hook) {
        if ('toplevel_page_headless-builder-sync' !== $hook) {
            return;
        }

        wp_enqueue_style(
            'hb-sync-admin',
            HB_SYNC_PLUGIN_URL . 'assets/admin.css',
            array(),
            HB_SYNC_VERSION
        );

        wp_enqueue_script(
            'hb-sync-admin',
            HB_SYNC_PLUGIN_URL . 'assets/admin.js',
            array('jquery'),
            HB_SYNC_VERSION,
            true
        );

        wp_localize_script('hb-sync-admin', 'hbSync', array(
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'restUrl' => rest_url('headless-builder/v1/'),
            'nonce' => wp_create_nonce('wp_rest'),
        ));
    }

    /**
     * Register REST API routes
     */
    public function register_rest_routes() {
        register_rest_route('headless-builder/v1', '/sync', array(
            'methods' => 'POST',
            'callback' => array($this, 'handle_sync'),
            'permission_callback' => array($this, 'check_permissions'),
        ));

        register_rest_route('headless-builder/v1', '/status', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_sync_status'),
            'permission_callback' => array($this, 'check_permissions'),
        ));
    }

    /**
     * Check permissions
     */
    public function check_permissions() {
        return current_user_can('manage_options');
    }

    /**
     * Handle sync request
     */
    public function handle_sync($request) {
        $field_groups = $request->get_param('fieldGroups');

        if (empty($field_groups)) {
            return new WP_Error(
                'no_field_groups',
                __('No field groups provided', 'headless-builder-sync'),
                array('status' => 400)
            );
        }

        // Check if ACF is active
        if (!function_exists('acf_add_local_field_group')) {
            return new WP_Error(
                'acf_not_active',
                __('Advanced Custom Fields is not active', 'headless-builder-sync'),
                array('status' => 500)
            );
        }

        $imported = array();
        $errors = array();

        foreach ($field_groups as $field_group) {
            try {
                // Import field group
                acf_import_field_group($field_group);
                $imported[] = $field_group['title'];
            } catch (Exception $e) {
                $errors[] = array(
                    'title' => $field_group['title'],
                    'error' => $e->getMessage(),
                );
            }
        }

        return rest_ensure_response(array(
            'success' => true,
            'imported' => $imported,
            'errors' => $errors,
            'total' => count($field_groups),
            'timestamp' => current_time('mysql'),
        ));
    }

    /**
     * Get sync status
     */
    public function get_sync_status() {
        $field_groups = acf_get_field_groups();

        return rest_ensure_response(array(
            'success' => true,
            'acfActive' => function_exists('acf_add_local_field_group'),
            'totalFieldGroups' => count($field_groups),
            'wpGraphQLActive' => class_exists('WPGraphQL'),
        ));
    }

    /**
     * Render admin page
     */
    public function render_admin_page() {
        ?>
        <div class="wrap">
            <h1><?php echo esc_html(get_admin_page_title()); ?></h1>

            <div class="hb-sync-container">
                <div class="hb-sync-card">
                    <h2><?php _e('Sync Configuration', 'headless-builder-sync'); ?></h2>

                    <table class="form-table">
                        <tr>
                            <th scope="row">
                                <label for="hb_builder_url"><?php _e('Builder URL', 'headless-builder-sync'); ?></label>
                            </th>
                            <td>
                                <input
                                    type="text"
                                    id="hb_builder_url"
                                    name="hb_builder_url"
                                    value="<?php echo esc_attr(get_option('hb_builder_url', 'http://localhost:3001')); ?>"
                                    class="regular-text"
                                    placeholder="http://localhost:3001"
                                />
                                <p class="description">
                                    <?php _e('The URL of your Headless Builder instance', 'headless-builder-sync'); ?>
                                </p>
                            </td>
                        </tr>

                        <tr>
                            <th scope="row">
                                <label for="hb_project_id"><?php _e('Project ID', 'headless-builder-sync'); ?></label>
                            </th>
                            <td>
                                <input
                                    type="text"
                                    id="hb_project_id"
                                    name="hb_project_id"
                                    value="<?php echo esc_attr(get_option('hb_project_id', '')); ?>"
                                    class="regular-text"
                                    placeholder="project-uuid"
                                />
                                <p class="description">
                                    <?php _e('Your project ID from the Builder', 'headless-builder-sync'); ?>
                                </p>
                            </td>
                        </tr>

                        <tr>
                            <th scope="row">
                                <label for="hb_api_token"><?php _e('API Token', 'headless-builder-sync'); ?></label>
                            </th>
                            <td>
                                <input
                                    type="password"
                                    id="hb_api_token"
                                    name="hb_api_token"
                                    value="<?php echo esc_attr(get_option('hb_api_token', '')); ?>"
                                    class="regular-text"
                                />
                                <p class="description">
                                    <?php _e('Your JWT token from the Builder', 'headless-builder-sync'); ?>
                                </p>
                            </td>
                        </tr>
                    </table>

                    <p class="submit">
                        <button type="button" id="hb-save-settings" class="button button-primary">
                            <?php _e('Save Settings', 'headless-builder-sync'); ?>
                        </button>
                        <button type="button" id="hb-sync-now" class="button button-secondary">
                            <?php _e('Sync Now', 'headless-builder-sync'); ?>
                        </button>
                    </p>
                </div>

                <div class="hb-sync-card">
                    <h2><?php _e('Sync Status', 'headless-builder-sync'); ?></h2>
                    <div id="hb-sync-status">
                        <p><?php _e('Loading...', 'headless-builder-sync'); ?></p>
                    </div>
                </div>

                <div class="hb-sync-card">
                    <h2><?php _e('Recent Syncs', 'headless-builder-sync'); ?></h2>
                    <div id="hb-sync-logs">
                        <p><?php _e('No syncs yet', 'headless-builder-sync'); ?></p>
                    </div>
                </div>
            </div>
        </div>
        <?php
    }

    /**
     * AJAX handler to save settings
     */
    public function ajax_save_settings() {
        check_ajax_referer('wp_rest', 'nonce');

        if (!current_user_can('manage_options')) {
            wp_send_json_error('Unauthorized');
        }

        $builder_url = sanitize_text_field($_POST['builder_url']);
        $project_id = sanitize_text_field($_POST['project_id']);
        $api_token = sanitize_text_field($_POST['api_token']);

        update_option('hb_builder_url', $builder_url);
        update_option('hb_project_id', $project_id);
        update_option('hb_api_token', $api_token);

        wp_send_json_success('Settings saved');
    }
}

// Initialize plugin
function headless_builder_sync_init() {
    return Headless_Builder_Sync::get_instance();
}

add_action('plugins_loaded', 'headless_builder_sync_init');
