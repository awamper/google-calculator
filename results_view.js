/*
    Copyright 2015 Ivan awamper@gmail.com

    This program is free software; you can redistribute it and/or
    modify it under the terms of the GNU General Public License as
    published by the Free Software Foundation; either version 2 of
    the License, or (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program. If not, see <http://www.gnu.org/licenses/>.
*/

const St = imports.gi.St;
const Lang = imports.lang;
const Gtk = imports.gi.Gtk;
const Clutter = imports.gi.Clutter;
const Signals = imports.signals;
const Tweener = imports.ui.tweener;
const Params = imports.misc.params;
const ExtensionUtils = imports.misc.extensionUtils;

const Me = ExtensionUtils.getCurrentExtension();
const Utils = Me.imports.utils;
const PrefsKeys = Me.imports.prefs_keys;
const ResultView = Me.imports.result_view;
const CalculatorResult = Me.imports.calculator_result;

const RESULTS_ANIMATION_TIME = 0.3;
const SCROLL_ANIMATION_TIME = 0.5;
const SCROLLBAR_ANIMATION_TIME = 0.2;
const PREPEND_ANIMATION_TIME = 0.15;
const ICON_ANIMATION_TIME = 0.2;

const ICON_MIN_OPACITY = 30;
const ICON_MAX_OPACITY = 255;

const CONNECTTION_IDS = {
    BIND_SETTINGS: 0
};

const SELECTION_TYPE = {
    HOVERED: 'hover',
    SELECTED: 'selected'
};

const ResultsView = new Lang.Class({
    Name: 'GoogleCalculator.ResultsView',

    _init: function(params) {
        this._params = Params.parse(params, {
            bind_key: null
        });

        this.actor = new St.BoxLayout({
            x_expand: true,
            y_expand: true,
            vertical: true,
            reactive: true
        });
        this.actor.connect('allocation-changed',
            Lang.bind(this, this._on_allocation_changed)
        );
        this.actor.connect('button-press-event',
            Lang.bind(this, this._on_button_press)
        );
        this.actor.connect('key-press-event',
            Lang.bind(this, this._on_key_press)
        );

        this._scroll_view = new St.ScrollView({
            style_class: 'google-calculator-results-view-scroll',
            x_expand: true,
            y_expand: true,
            x_fill: true,
            y_fill: true
        });
        this._scroll_view.connect('scroll-event',
            Lang.bind(this, this._show_scrollbar)
        );
        this._scroll_view.set_policy(
            Gtk.PolicyType.EXTERNAL,
            Gtk.PolicyType.ALWAYS
        );
        this._scroll_view.set_overlay_scrollbars(true);
        this._scroll_view.vscroll.set_opacity(0);

        this._placeholder = new St.Bin();
        this._box = new St.BoxLayout({
            vertical: true,
            style_class: 'google-calculator-results-view-box'
        });
        this._box.add_child(this._placeholder);
        this._scroll_view.add_actor(this._box);

        this._table = new St.Table({
            homogeneous: false
        });
        this._table.add(this._scroll_view, {
            row: 0,
            col: 0
        })
        this.actor.add(this._table, {
            expand: true,
            x_fill: true,
            y_fill: true
        });

        this._background_icon = new St.Icon({
            icon_name: 'face-cool-symbolic',
            style_class: 'google-calculator-results-view-icon',
            opacity: ICON_MAX_OPACITY
        });
        this._table.add(this._background_icon, {
            row: 0,
            col: 0,
            row_span: 1,
            expand: true,
            x_fill: false,
            y_fill: false,
            x_align: St.Align.MIDDLE,
            y_align: St.Align.MIDDLE
        });

        this._shown = false;
        this._result_views = [];
        this._animation_running = false;
        this._adjustment = this._scroll_view.vscroll.adjustment;

        this.connect('notify::n-results',
            Lang.bind(this, function() {
                if(this.n_results === 1) this._hide_icon();
                else if(this.n_results === 0) this._show_icon();
            })
        );
        this._adjustment.connect('notify::page-size',
            Lang.bind(this, function() {
                if(this.n_results < 1) return;

                let placeholder_height = (
                    this._adjustment.page_size -
                    this._get_view_height(this._result_views[0]) || 0
                );
                if(placeholder_height > 0) {
                    this._placeholder.height = placeholder_height + 10;
                }
            })
        );
        this._adjustment.connect('notify::value',
            Lang.bind(this, this._hide_scrollbar)
        );

        if(this._params.bind_key !== null) {
            CONNECTTION_IDS.BIND_SETTINGS = Utils.SETTINGS.connect(
                'changed::' + this._params.bind_key,
                Lang.bind(this, this._update)
            );
            this._update();
        }
    },

    _update: function() {
        let string_items = Utils.SETTINGS.get_strv(this._params.bind_key);
        if(string_items.length < 1) {
            this.clear();
            return;
        }

        if(this._result_views.length === 0) {
            let items = [];
            for each(let string_item in string_items) {
                items.push(
                    CalculatorResult.from_string(string_item.trim())
                );
            }
            this.set(items);
            return;
        }

        for(let i = 0; i < this._result_views.length; i++) {
            let should_remove = string_items.indexOf(
                this._result_views[i].result.string
            ) === -1;
            if(should_remove) {
                let index = i;
                this.remove(index);
            }
        }

        let maybe_new = CalculatorResult.from_string(
            string_items[0].trim()
        );
        let current = this._result_views[0].result;
        if(
            maybe_new.query !== current.query ||
            maybe_new.answer !== current.answer
        ) {
            this.prepend(maybe_new);
            this.select_first();
        }

        this._remove_duplicates();
    },

    _remove_duplicates: function() {
        let unique_querys = [];

        for(let i in this._result_views) {
            let query = this._result_views[i].result.query;

            if(unique_querys.indexOf(query) !== -1) {
                this.remove(i);
            }
            else {
                unique_querys.push(query);
            }
        }
    },

    _on_allocation_changed: function() {
        this._resize_icon();
    },

    _on_button_press: function(sender, event) {
        let button = event.get_button();
        if(button !== Clutter.BUTTON_PRIMARY) return Clutter.EVENT_PROPAGATE;

        let selected = this.get_selected(SELECTION_TYPE.HOVERED);
        if(!selected) return Clutter.EVENT_PROPAGATE;

        this._activate(selected);
        return Clutter.EVENT_STOP;
    },

    _on_key_press: function(sender, event) {
        let symbol = event.get_key_symbol();
        let enter = (
            symbol === Clutter.KEY_Return ||
            symbol === Clutter.KEY_KP_Enter ||
            symbol === Clutter.KEY_ISO_Enter
        );

        if(enter) {
            let selected = this.get_selected(SELECTION_TYPE.SELECTED);
            if(!selected) return Clutter.EVENT_PROPAGATE;

            this._activate(selected);
            return Clutter.EVENT_STOP;
        }

        return Clutter.EVENT_PROPAGATE;
    },

    _resize_icon: function() {
        let allocation_box = this.actor.get_allocation_box();
        let width = allocation_box.x2 - allocation_box.x1;
        let height = allocation_box.y2 - allocation_box.y1;

        this._background_icon.icon_size = Math.round(height * 0.7);
    },

    _hide_icon: function() {
        if(this._background_icon.opacity === ICON_MIN_OPACITY) return;

        Tweener.removeTweens(this._background_icon);
        Tweener.addTween(this._background_icon, {
            opacity: ICON_MIN_OPACITY,
            time: RESULTS_ANIMATION_TIME,
            transition: 'easeOutQuad'
        });
    },

    _show_icon: function() {
        Tweener.removeTweens(this._background_icon);
        Tweener.addTween(this._background_icon, {
            opacity: ICON_MAX_OPACITY,
            time: RESULTS_ANIMATION_TIME,
            transition: 'easeOutQuad'
        });
    },

    _add: function(result, index=null) {
        let result_view = new ResultView.ResultView(result);
        this._box.add(result_view.actor, {
            expand: false,
            x_fill: true,
            y_fill: false,
            x_align: St.Align.MIDDLE,
            y_align: St.Align.START
        });

        if(index !== null) {
            let height = result_view.actor.height;
            result_view.actor.opacity = 0;
            result_view.actor.set_pivot_point(0.5, 0.5);
            result_view.actor.height = 0;

            this._box.set_child_at_index(result_view.actor, index);

            Tweener.addTween(result_view.actor, {
                time: PREPEND_ANIMATION_TIME,
                height: height,
                transition: 'easeOutQuad'
            });
            Tweener.addTween(result_view.actor, {
                delay: PREPEND_ANIMATION_TIME / 1.2,
                time: PREPEND_ANIMATION_TIME,
                opacity: 255,
                transition: 'easeOutQuad'
            });

            this._result_views.splice(index, 0, result_view);
        }
        else {
            this._result_views.push(result_view);
        }

        this._box.set_child_above_sibling(this._placeholder, null);
        this.emit('notify::n-results');
    },

    _get_view_height: function(view) {
        let view_theme_node = view.actor.get_theme_node();
        let top_padding = view_theme_node.get_padding(St.Side.TOP);
        let bottom_padding = view_theme_node.get_padding(St.Side.BOTTOM);

        return view.actor.height + top_padding + bottom_padding;
    },

    _hide_scrollbar: function() {
        Tweener.addTween(this._scroll_view.vscroll, {
            delay: 0.5,
            time: SCROLLBAR_ANIMATION_TIME,
            opacity: 0,
            transition: 'easeOutQuad'
        });
    },

    _show_scrollbar: function() {
        if(this._scroll_view.vscroll.opacity === 0) {
            Tweener.removeTweens(this._scroll_view.vscroll);
            Tweener.addTween(this._scroll_view.vscroll, {
                time: SCROLLBAR_ANIMATION_TIME,
                opacity: 255,
                transition: 'easeOutQuad'
            });
        }
    },

    _activate: function(result_view) {
        this.emit('activate', result_view.result);
    },

    set: function(results) {
        if(this._animation_running) {
            Tweener.removeTweens(this._scroll_view);
            this._scroll_view.opacity = 255;
            this._animation_running = false;
            this._hide_icon();
        }
        if(results === null || results.length < 1) return;

        this.clear();

        for each(let result in results) {
            this._add(result);
        }
    },

    remove: function(index) {
        this._result_views[index].destroy();
        this._result_views.splice(index, 1);
    },

    append: function(result) {
        this._add(result);
    },

    prepend: function(result) {
        this._add(result, 0);
    },

    unselect_all: function() {
        for each(let view in this._result_views) {
            view.actor.remove_style_pseudo_class('hover');
            view.actor.remove_style_pseudo_class('selected');
        }
    },

    get_selected: function(type=SELECTION_TYPE.SELECTED) {
        let result = false;

        for each(let view in this._result_views) {
            if(view.actor.has_style_pseudo_class(type)) {
                result = view;
            }
        }

        return result;
    },

    select: function(view, index=null, animate=true) {
        if(!view && index !== null) return;
        if(index !== null) view = this._result_views[index];

        let selected = this.get_selected();
        if(selected === view) return;

        this.unselect_all();
        view.actor.add_style_pseudo_class('selected');
        this.scroll_to_view(view, null, animate);
    },

    select_first: function(animate=true) {
        if(this.n_results < 1) return;
        this.select(this._result_views[0], null, animate);
    },

    select_last: function(animate=true) {
        if(this.n_results < 1) return;
        this.select(this._result_views[this.n_results - 1], null, animate);
    },

    select_next: function() {
        if(this._result_views.length < 1) return false;

        let selected = this.get_selected();
        if(!selected) {
            this.select(this._result_views[0]);
            return true;
        }

        let selected_index = this._result_views.indexOf(selected);
        let next_view = this._result_views[selected_index + 1];

        if(next_view) {
            this.select(next_view);
            return true;
        }
        else {
            return false
        }
    },

    select_prev: function() {
        if(this._result_views.length < 1) return false;

        let selected = this.get_selected();
        if(!selected) {
            this.select(this._result_views[0]);
            return true;
        }

        let selected_index = this._result_views.indexOf(selected);
        let prev_view = this._result_views[selected_index - 1];

        if(prev_view) {
            this.select(prev_view);
            return true;
        }
        else {
            return false
        }
    },

    scroll_to_view: function(view, index=null, animate=true) {
        if(!view && index !== null) return;

        if(index !== null) view = this._result_views[index];
        else index = this._result_views.indexOf(view);

        let value = index * this._get_view_height(view);

        if(!animate) {
            this._adjustment.value = value;
            this._scroll_view.vscroll.set_opacity(0);
            return;
        }

        this._show_scrollbar();

        Tweener.removeTweens(this._adjustment);
        Tweener.addTween(this._adjustment, {
            time: SCROLL_ANIMATION_TIME,
            value: value,
            transition: 'easeOutBack'
        });
    },

    clear: function() {
        for each(let view in this._result_views) view.destroy();
        this._result_views = [];
        this.emit('notify::n-results');
    },

    destroy: function() {
        if(CONNECTTION_IDS.BIND_SETTINGS !== 0) {
            Utils.SETTINGS.disconnect(CONNECTTION_IDS.BIND_SETTINGS);
            CONNECTTION_IDS.BIND_SETTINGS = 0;
        }

        this._adjustment = null;
        this.clear();
        this.actor.destroy();
    },

    get n_results() {
        return this._result_views.length;
    },

    get last_added() {
        return this._result_views[0] || null;
    }
});
Signals.addSignalMethods(ResultsView.prototype);
