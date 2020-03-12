odoo.define('sidebar_enterprise.WebClient', function (require) {
    "use strict";

    var session = require('web.session');
    var WebClient = require('web.WebClient');
    var core = require('web.core');
    var qweb = core.qweb;

    WebClient.include({
        events: {
            'click .o_main': '_onAppsMenuItemClicked',
        },

        start: function () {
            var self = this;
            return this._super.apply(this, arguments).then(function () {
                // if u refresh the page in apps menu, the page will stored in web_client_content in DocumentFragment
                // it will stored in variable: web_client_content
                if (session.sidebar_visible) {
                    if (self.web_client_content) {
                        self.web_client_content.firstElementChild.prepend($(qweb.render("sidebar_enterprise.app_sidebar", {
                            "menu_data": self.menu_data,
                            "session_info": session
                        }))[0]);
                    } else {
                        self.$('.o_main').append(qweb.render("sidebar_enterprise.app_sidebar", {
                            "menu_data": self.menu_data,
                            "session_info": session,
                        }));
                    }
                }
            });
        },

        _onAppsMenuItemClicked: function (ev) {
            if (!session.sidebar_visible) {
                return;
            }
            if ($(ev.target).hasClass('nav-link')) {
                $('.app-sidebar .app-sidebar-menu li a').removeClass("nav-item-click");
                $(ev.target).addClass('nav-item-click');
            } else if ($(ev.target.parentNode).hasClass('nav-link')) {
                $('.app-sidebar .app-sidebar-menu li a').removeClass("nav-item-click");
                $(ev.target.parentNode).addClass('nav-item-click');
            }
        }
    });
});
