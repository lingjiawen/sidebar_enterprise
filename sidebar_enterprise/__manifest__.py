# -*- coding: utf-8 -*-

{
    "name": "sidebar_enterprise",
    "summary": "Oddo Enterprise Sidebar",
    "description": "Oddo Enterprise Sidebar",
    "version": "12.0.0.1",
    "author": "misterling",
    "license": "LGPL-3",
    "installable": True,
    "depends": [
        'web', 'web_enterprise'
    ],
    "data": [
        'views/assets.xml',
        'views/users.xml',
    ],
    "qweb": [
        'static/src/xml/form_view.xml',
        'static/src/xml/sidebar.xml',
    ],
    "images": ['images/screen.png'],
    "auto_install": True,
}
