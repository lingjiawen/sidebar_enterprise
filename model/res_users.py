# -*- coding: utf-8 -*-

from odoo import models, fields


class ResUsers(models.Model):

    _inherit = 'res.users'

    sidebar_visible = fields.Boolean("Show App Sidebar", default=False)
