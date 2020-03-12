odoo.define('sidebar_enterprise.Menu', function (require) {
    "use strict";

    var menu = require('web_enterprise.Menu');
    var session = require('web.session');

    var Menu = menu.include({

        /**
         * When clicking on app name, opens the first action of the app
         *
         * @private
         * @param {MouseEvent} ev
         */
        _onAppNameClicked: function (ev) {
            ev.preventDefault();
            if (session.sidebar_visible) {
                if ($('#app-sidebar').hasClass('o_hidden')) {
                    $('#app-sidebar').removeClass('o_hidden');
                    $(ev.target).hover(function () {
                        $(ev.target).css("cursor", "pointer");
                    }, function () {
                        $(ev.target).css("cursor", "");
                    });
                    $('.o_main').addClass('o_main_sidebar');
                    $('.o_control_panel').addClass('o_control_panel_sidebar');
                    $('.o_content').addClass('o_content_sidebar');
                } else {
                    $('#app-sidebar').addClass('o_hidden');
                    $('.o_main').removeClass('o_main_sidebar');
                    $('.o_control_panel').removeClass('o_control_panel_sidebar');
                    $('.o_content').removeClass('o_content_sidebar');
                }
            }
            else {
                var actionID = this.menu_id_to_action_id(this.current_primary_menu);
                this._trigger_menu_clicked(this.current_primary_menu, actionID);
            }
        },

        start: function () {
            // this.$el.addClass(this.arch.attrs.class);
            return $.when(this._render(), this._super());
        },

        _render: function () {
            var self = this;
            if (session.sidebar_visible) {
                $('.o_main').addClass('o_main_sidebar');
                $('.o_control_panel').addClass('o_control_panel_sidebar');
                $('.o_content').addClass('o_content_sidebar');
            } else {
                $('.o_main').removeClass('o_main_sidebar');
                $('.o_control_panel').removeClass('o_control_panel_sidebar');
                $('.o_content').removeClass('o_content_sidebar');
            }
            return $.when();
        }
    });

    return Menu;

});
