odoo.define('ztree_view.Controller', function (require) {
    "use strict";

    var AbstractController = require('web.AbstractController');
    var core = require('web.core');
    var qweb = core.qweb;

    var ZtreeController = AbstractController.extend({
        custom_events: _.extend({}, AbstractController.prototype.custom_events, {
            'tree_node_clicked': '_onTreeNodeClicked',
        }),

        init: function (parent, model, renderer, params) {
            this.model = model;
            this.renderer = renderer;
            this._super.apply(this, arguments);
        },
        /**
         * @returns {Deferred}
         */
        start: function () {
            return this._super();
        },
        // 该方法会生成导航栏中的按钮，并可增加绑定按钮事件
        renderButtons: function ($node) {
            this._super.apply(this, arguments);
            this.$buttons = $('<div class="btn-group" role="toolbar" aria-label="Main actions"><button class="btn btn-primary" name="edit">编辑</button><button class="btn">删除</button></div>');
            this.$buttons.click(this._onButtonsClicked.bind(this));
            this.$buttons.appendTo($node);
        },
        _onButtonsClicked: function (event) {
            var $target = $(event.target);
            event.preventDefault();
            event.stopPropagation();
            var renderer = this['_onButtonClicked' + _.str.capitalize($target[0].name)];
            if (renderer) {
                return renderer.call(this, event);
            }
        },
        _onButtonClickedEdit: function (event) {
            var state = this.model.get();
            if (state.formData) {
                var action = {
                    type: 'ir.actions.act_window',
                    res_model: this.model.modelName,
                    view_mode: 'form',
                    view_type: 'form,ztree,tree',
                    views: [[false, 'form']],
                    res_id: state.formData[0].id,
                    context: {form_view_initial_mode: 'edit'},
                };
                this.do_action(action);
            }
        },
        /**
         * 执行该方法重新加载视图，默认逻辑是对调用update的封装
         * @param {Object} [params] This object will simply be given to the update
         * @returns {Deferred}
         */
        reload: function (params) {
            return this._super.apply(this, arguments);
        },
        /**
         * update是Controller的关键方法，在Odoo默认逻辑中，当用户操作搜索视图，或者部分内部更改会主动调用该方法。
         * 当我们自行编写相关方法时需要主动调用该函数。
         * 这个方法会调用model重新加载数据并通知renderer执行渲染
         * @param {*} params
         * @param {*} options
         * @param {boolean} [options.reload=true] if true, the model will reload data
         *
         * @returns {Deferred}
         */
        update: function (params, options) {
            return this._super.apply(this, arguments);
        },
        /**
         * _update是update的回调方法，区别在于update是重新渲染页面主体部分，
         * _update则是渲染除了主体部分外的组件，比如控制面板中的组件 (buttons, pager, sidebar...)
         * @param {*} state
         * @returns {Deferred}
         */
        _update: function (state) {
            return this._super.apply(this, arguments);
        },

        _onTreeNodeClicked: function (event) {
            var self = this;
            // console.log('clicked:', event.data.id, event.data.name);
            this.model._fetchData(event.data.id).then(function () {
                var newState = self.model.get();
                // self._update(newState)
                self.renderer.updateState(newState, {
                    "noRender": true
                })
                self.renderer._renderView();
            });
        }

    });

    return ZtreeController;

});