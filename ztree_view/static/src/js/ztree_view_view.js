odoo.define('ztree_view.View', function (require) {
    "use strict";

    var AbstractView = require('web.AbstractView');
    var view_registry = require('web.view_registry');
    var ZtreeController = require('ztree_view.Controller');
    var ZtreeModel = require('ztree_view.Model');
    var ZtreeRenderer = require('ztree_view.Renderer');


    var ZtreeView = AbstractView.extend({
        display_name: 'ZtreeView',
        icon: 'fa-tree',
        cssLibs: [
            '/ztree_view/static/src/libs/bootstrapStyle.css',
        ],
        jsLibs: [
            '/ztree_view/static/src/libs/jquery.ztree.core.min.js',
        ],
        config: {
            Model: ZtreeModel,
            Controller: ZtreeController,
            Renderer: ZtreeRenderer,
        },
        viewType: 'ztree_view',
        groupable: false,
        /**
         * View的入口，会传入相关视图定义的参数(视图结构，字段信息等。。)，
         * 函数会处理并生产3个主要字段：this.rendererParams， this.controllerParams，this.loadParams
         * 分别对应renderer，controller，model的初始化参数，我们可以根据需要自行对相关增加相关参数
         * @param {Object} viewInfo.arch
         * @param {Object} viewInfo
         * @param {Object} viewInfo.fields
         * @param {Object} viewInfo.fieldsInfo
         * @param {Object} params
         * @param {string} params.modelName The actual model name
         * @param {Object} params.context
         */
        init: function (viewInfo, params) {
            this._super.apply(this, arguments);

            // console.log('modelName:' + this.loadParams.modelName);

            this.show_name = this.arch.attrs.show_name;
            this.parent_id_name = this.arch.attrs.parent_id_name;

            // Model Parameters
            this.loadParams.model = this.model;
            this.loadParams.fields = viewInfo.fields;
            this.loadParams.viewFields = viewInfo.viewFields;
            this.loadParams.show_name = this.show_name;
            this.loadParams.parent_id_name = this.parent_id_name;

            // Renderer Parameters
            // var measures = {};
            // _.each(fields, function (field, name) {
            //     if (name !== 'id' && field.store === true && _.contains(['integer', 'float', 'monetary'], field.type)) {
            //         measures[name] = field.string;
            //     }
            // });
            this.rendererParams.fields = this.loadParams.fields;
            this.rendererParams.modelName = this.loadParams.modelName;
            this.rendererParams.viewFields = this.loadParams.viewFields;
            this.rendererParams.show_name = this.show_name;
            this.rendererParams.parent_id_name = this.parent_id_name;

            // Controller Parameters
            // this.controllerParams.measures = _.omit(measures, '__count__');
        },
        /**
         * View的主要的执行逻辑，这个方法会分别执行getModel，getRenderer初始化相关组件，
         * 然后对renderer, model设置controller就完成了作用，之后的View相关操作与这个类无关了
         * @param {}} parent
         */
        getController: function (parent) {
            return this._super.apply(this, arguments);
        },
        // 这里会初始化model，并执行model中load方法
        getModel: function (parent) {
            return this._super.apply(this, arguments);
        },
        getRenderer: function (parent, state) {
            return this._super.apply(this, arguments);
        },

    });

    view_registry.add('ztree', ZtreeView);
});