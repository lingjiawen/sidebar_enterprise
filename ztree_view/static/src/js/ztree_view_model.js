odoo.define('ztree_view.Model', function (require) {
    "use strict";

    var AbstractModel = require('web.AbstractModel');

    var ZtreeModel = AbstractModel.extend({
        /**
         * 该方法需要返回renderer所需的数据
         * 数据可以通过load/reload执行相关获取数据方法时，设置到该对象上
         */
        get: function () {
            return this.data;
        },
        /**
         * 只会初次加载时执行一次，需要自定义相关数据获取方法获取数据并设置到该对象上
         *
         * @param {Object} params
         * @param {string} params.modelName the name of the model
         * @returns {Deferred} The deferred resolves to some kind of handle
         */
        load: function (params) {
            this.modelName = params.modelName;
            this.domain = params.domain || [];
            this.fields = params.fields;
            this.viewFields = params.viewFields;
            this.show_name = params.show_name;
            this.parent_id_name = params.parent_id_name;
            return this._fetchData();
        },
        /**
         * 当有相关数据变动时，重新获取数据。
         *
         * @param {Object} params
         * @returns {Deferred}
         */
        reload: function (handle, params) {
            if ('domain' in params) {
                this.domain = params.domain;
            }
            // console.log(this.domain)
            return this._fetchData();
        },

        _fetchData: function () {
            var self = this;
            var params = Array.prototype.slice.call(arguments);
            // console.log("params:", params);
            var recordId = params[0];
            var defs = [
                this._rpc({
                    model: this.modelName,
                    method: 'search_read',
                    domain: this.domain,
                    fields: [this.show_name, this.parent_id_name],
                    // limit: 80,
                    sort: "",
                })];
            if (recordId) {
                defs.push(this._rpc({
                        model: this.modelName,
                        method: 'search_read',
                        domain: [['id', '=', recordId]],
                        fields: _.keys(this.viewFields),
                        sort: "",
                    })
                );
            }
            return $.when.apply($, defs).then(function () {
                var results = Array.prototype.slice.call(arguments);
                // console.log("results:", results);
                self.data = {
                    "zTreeNodes": results[0],
                };
                if(results[1]) {
                    self.data.formData = results[1];
                }
                // console.log(self.data);
            });
        },

    });

    return ZtreeModel;

});