odoo.define('ztree_view.Renderer', function (require) {
    "use strict";

    var AbstractRenderer = require('web.BasicRenderer');
    var core = require('web.core');
    var widgetRegistry = require('web.widget_registry');
    var qweb = core.qweb;

    var ZtreeRenderer = AbstractRenderer.extend({
        events: _.extend({}, AbstractRenderer.prototype.events, {
            // 'click .o_search_web_report': '_zTreeOnClick',
        }),
        INNER_GROUP_COL: 2,
        OUTER_GROUP_COL: 2,
        init: function (parent, state, params) {
            this._super.apply(this, arguments);
            this.fields = params.fields;
            this.show_name = params.show_name;
            this.parent_id_name = params.parent_id_name;
            this.viewFields = params.viewFields;
            this.className = '';
            this.modelName = params.modelName;
            this.idsForLabels = {};

        },
        /**
         *  renderer的渲染逻辑部分，自行渲染相关数据并插入this.$el中
         *
         * @abstract
         * @private
         * @returns {Deferred}
         */
        _render: function () {
            var self = this;
            var content = $("<ul class='ztree'></ul><div/>");
            this.$el.css({
                'display': "flex"
            });
            this.$el.empty().append(content);
            // 渲染树形图
            var zTreeObj,
                setting = {
                    view: {
                        selectedMulti: false
                    },
                    callback: {
                        onClick: self._zTreeOnClick.bind(self),
                    }
                },
                zTreeNodes = this._getZTreeNodes(this.state.zTreeNodes);
            zTreeObj = $.fn.zTree.init(this.$el.children().eq(0), setting, zTreeNodes);
            //展开全部节点
            // zTreeObj.expandAll(true);
            // 渲染form视图
            this._renderView();
            return $.when();
            // return this._super.apply(this, arguments);
        },

        _zTreeOnClick: function (event, treeId, treeNode) {
            // alert(treeNode.tId + ", " + treeNode.name);
            this.trigger_up('tree_node_clicked', {
                id: treeNode.id,
                name: treeNode.name,
                // parent_id: treeNode.parent_id[0],
                // parent_name: treeNode.parent_id[1],
                // act_view: act_view,
            });
        },

        _getZTreeNodes: function (state) {
            var self = this;
            var zTreeNodes = [];
            var items = _.groupBy(state, this.parent_id_name);
            if (items['false']) {
                _.each(items['false'], function (item, index) {
                    zTreeNodes.push({
                        "id": item.id,
                        "open": true,
                        "name": item[self.show_name],
                        "children": []
                    });
                });
                delete items['false'];
            } else if (items['undefined']) {
                _.each(items['undefined'], function (item, index) {
                    zTreeNodes.push({
                        "id": item.id,
                        "open": true,
                        "name": item[self.show_name],
                        "children": []
                    });
                });
                delete items['undefined'];
            } else {
                // 在搜索的情况下，会出现有parent_id，但是parent_id不在列表中的情况
                _.each(state, function (item, index) {
                    if (!_.findWhere(state, {'id': item[self.parent_id_name][0]})) {
                        zTreeNodes.push({
                            "id": item.id,
                            "open": true,
                            "name": item[self.show_name],
                            "children": []
                        });
                    }
                });
            }
            var currentLevelNodes = zTreeNodes;
            while (currentLevelNodes.length) {
                var temp = currentLevelNodes;
                // console.log('currentLevelNodes:', currentLevelNodes);
                currentLevelNodes = []
                _.each(temp, function (item, index) {
                    //默认展开
                    item.open = true;
                    if (items[item.id + ',' + item.name]) {
                        temp[index].children = items[item.id + ',' + item.name];
                        currentLevelNodes = temp[index].children;
                        delete items[item.id + ',' + item.name];
                    }
                });
            }
            return zTreeNodes;
        },

        _renderView: function () {
            var self = this;
            // console.log(this.state)
            // render the form and evaluate the modifiers
            var $form = this._renderNode(this.arch).addClass(this.className);
            // console.log("$form: ", $form.prop("outerHTML"));
            this.$el.children().eq(1).replaceWith($form);
            return $form;
        },

        _renderNode: function (node) {
            var renderer = this['_renderTag' + _.str.capitalize(node.tag)];
            if (renderer) {
                return renderer.call(this, node);
            }
            if (_.isString(node)) {
                return node;
            }
            return this._renderGenericTag(node);
        },

        _renderGenericTag: function (node) {
            var $result = $('<' + node.tag + '>', _.omit(node.attrs, 'modifiers'));
            this._handleAttributes($result, node);
            // this._registerModifiers(node, this.state, $result);
            $result.append(_.map(node.children, this._renderNode.bind(this)));
            return $result;
        },

        _renderTagZtree: function (node) {
            var $result = $("<div class='o_form_view o_form_readonly' style='width:100%; border-radius: 10px; padding: 30px; display: block;' />");
            if (node.attrs.class) {
                $result.addClass(node.attrs.class);
            }
            $result.append(_.map(node.children, this._renderNode.bind(this)));
            return $result;
        },

        _renderTagWidget: function (node) {
            console.log("_renderWidget");
            // return this._renderWidget(this.state, node);
        },

        _renderWidget: function (record, node) {
            var Widget = widgetRegistry.get(node.attrs.name);
            var widget = new Widget(this, record, node);

            this.widgets.push(widget);

            // Prepare widget rendering and save the related deferred
            var def = widget._widgetRenderAndInsert(function () {
            });
            var async = def.state() === 'pending';
            if (async) {
                this.defs.push(def);
            }
            var $el = async ? $('<div>') : widget.$el;

            var self = this;
            def.then(function () {
                self._handleAttributes(widget.$el, node);
                self._registerModifiers(node, record, widget);
                widget.$el.addClass('o_widget');
                if (async) {
                    $el.replaceWith(widget.$el);
                }
            });

            return $el;
        },

        _renderTagGroup: function (node) {
            var isOuterGroup = _.some(node.children, function (child) {
                return child.tag === 'group';
            });
            if (!isOuterGroup) {
                return this._renderInnerGroup(node);
            }
            return this._renderOuterGroup(node);
        },

        _renderInnerGroup: function (node) {
            var self = this;
            var $result = $('<table/>', {class: 'o_group o_inner_group'});
            this._handleAttributes($result, node);
            // this._registerModifiers(node, this.state, $result);
            var col = parseInt(node.attrs.col, 10) || this.INNER_GROUP_COL;
            if (node.attrs.string) {
                var $sep = $('<tr><td colspan="' + col + '" style="width: 100%;"><div class="o_horizontal_separator">' + node.attrs.string + '</div></td></tr>');
                $result.append($sep);
            }

            var rows = [];
            var $currentRow = $('<tr/>');
            var currentColspan = 0;
            _.each(node.children, function (child) {
                if (child.tag === 'newline') {
                    rows.push($currentRow);
                    $currentRow = $('<tr/>');
                    currentColspan = 0;
                    return;
                }

                var colspan = parseInt(child.attrs.colspan, 10);
                var isLabeledField = (child.tag === 'field' && child.attrs.nolabel !== '1');
                if (!colspan) {
                    if (isLabeledField) {
                        colspan = 2;
                    } else {
                        colspan = 1;
                    }
                }
                var finalColspan = colspan - (isLabeledField ? 1 : 0);
                currentColspan += colspan;

                if (currentColspan > col) {
                    rows.push($currentRow);
                    $currentRow = $('<tr/>');
                    currentColspan = colspan;
                }

                var $tds;
                if (child.tag === 'field') {
                    $tds = self._renderInnerGroupField(child);
                } else if (child.tag === 'label') {
                    $tds = self._renderInnerGroupLabel(child);
                } else {
                    $tds = $('<td/>').append(self._renderNode(child));
                }
                if (finalColspan > 1) {
                    $tds.last().attr('colspan', finalColspan);
                }
                $currentRow.append($tds);
            });
            rows.push($currentRow);

            _.each(rows, function ($tr) {
                var nonLabelColSize = 100 / (col - $tr.children('.o_td_label').length);
                _.each($tr.children(':not(.o_td_label)'), function (el) {
                    var $el = $(el);
                    $el.css('width', ((parseInt($el.attr('colspan'), 10) || 1) * nonLabelColSize) + '%');
                });
                $result.append($tr);
            });

            return $result;
        },

        _renderOuterGroup: function (node) {
            // console.log('11111111')
            var self = this;
            var $result = $('<div/>', {class: 'o_group'});
            var nbCols = parseInt(node.attrs.col, 10) || this.OUTER_GROUP_COL;
            var colSize = Math.max(1, Math.round(12 / nbCols));
            if (node.attrs.string) {
                var $sep = $('<div/>', {class: 'o_horizontal_separator'}).text(node.attrs.string);
                $result.append($sep);
            }
            $result.append(_.map(node.children, function (child) {
                if (child.tag === 'newline') {
                    return $('<br/>');
                }
                var $child = self._renderNode(child);
                $child.addClass('o_group_col_' + (colSize * (parseInt(child.attrs.colspan, 10) || 1)));
                return $child;
            }));
            this._handleAttributes($result, node);
            // this._registerModifiers(node, this.state, $result);
            return $result;
        },

        _renderInnerGroupField: function (node) {
            // var $el = this._renderFieldWidget(node, this.state);
            // TODO _renderFieldValue
            var $el = this._renderFieldValue(node);
            var $tds = $('<td/>').append($el);

            if (node.attrs.nolabel !== '1') {
                var $labelTd = this._renderInnerGroupLabel(node);
                $tds = $labelTd.add($tds);
            }

            return $tds;
        },

        _renderInnerGroupLabel: function (label) {
            return $('<td/>', {class: 'o_td_label'})
                .append(this._renderTagLabel(label));
        },

        _renderTagLabel: function (node) {
            var self = this;
            var text;
            var fieldName = node.tag === 'label' ? node.attrs.for : node.attrs.name;
            if ('string' in node.attrs) { // allow empty string
                text = node.attrs.string;
            } else if (fieldName) {
                text = this.viewFields[fieldName].string;
            } else {
                return this._renderGenericTag(node);
            }
            var $result = $('<label>', {
                class: 'o_form_label',
                for: this._getIDForLabel(fieldName),
                text: text,
            });
            if (node.tag === 'label') {
                this._handleAttributes($result, node);
            }
            // var modifiersOptions;
            // if (fieldName) {
            //     modifiersOptions = {
            //         callback: function (element, modifiers, record) {
            //             var widgets = self.allFieldWidgets[record.id];
            //             var widget = _.findWhere(widgets, {name: fieldName});
            //             if (!widget) {
            //                 return; // FIXME this occurs if the widget is created
            //                         // after the label (explicit <label/> tag in the
            //                         // arch), so this won't work on first rendering
            //                         // only on reevaluation
            //             }
            //             element.$el.toggleClass('o_form_label_empty', !!( // FIXME condition is evaluated twice (label AND widget...)
            //                 record.data.id
            //                 && (modifiers.readonly || self.mode === 'readonly')
            //                 && !widget.isSet()
            //             ));
            //         },
            //     };
            // }
            // this._registerModifiers(node, this.state, $result, modifiersOptions);
            return $result;
        },

        _getIDForLabel: function (name) {
            var idForLabel = this.idsForLabels[name];
            if (!idForLabel) {
                idForLabel = _.uniqueId('o_field_input_');
                this.idsForLabels[name] = idForLabel;
            }
            return idForLabel;
        },

        _renderFieldValue: function (node) {
            var fieldName = node.attrs.name;
            // console.log(this.viewFields[fieldName]);
            if (this.state.formData && this.state.formData[0][fieldName]) {
                return $('<td style="width: 100%;">' + this.state.formData[0][fieldName] + '</td>');
            }
            return '';
        },

        _renderTagField: function (node) {
            var modifiers = node.attrs.modifiers;
            var fieldName = node.attrs.name;

            console.log(this.viewFields[fieldName])
            if (this.viewFields[fieldName].type === 'binary') {
                //处理二进制字段
                // var $el = $('<img width="88"/>');
                var $el = $('<div aria-atomic="true" class="o_field_image o_field_widget" data-original-title="" title="">' + '</div>');
                $el.attr("name", fieldName);
                // $el.append('<img alt="二进制文件" class="img img-fluid" border="1" name="logo" ');
                // <img alt="二进制文件" class="img img-fluid" border="1" name="logo" src="http://localhost:8069/web/image?model=res.company&amp;id=1&amp;field=logo&amp;unique=20200306094023">
                if (this.state.formData && this.state.formData[0][fieldName]) {
                    // $el.attr("src", "/web/image?model=" + this.modelName + "&id=1&field=" + fieldName);
                    // $el.attr("src", "data:image/png;base64," + this.state.formData[0][fieldName]);
                    var $img = $('<img class="img img-fluid" border="1"/>');
                    $img.attr("alt", this.viewFields[fieldName].string);
                    $img.attr("name", fieldName);
                    $img.attr("src", "data:image/png;base64," + this.state.formData[0][fieldName]);
                    $el.append($img);
                }
                this._handleAttributes($el, node);
                return $el;
            } else {
                var $el = $('<span/>');
                if (this.state.formData && this.state.formData[0][fieldName]) {
                    $el.append(this.state.formData[0][fieldName]);
                }
                this._handleAttributes($el, node);
                return $el;
            }
            // console.log(node);
        }

    });

    return ZtreeRenderer;

});