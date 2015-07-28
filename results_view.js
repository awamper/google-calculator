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
const Signals = imports.signals;
const Tweener = imports.ui.tweener;
const ExtensionUtils = imports.misc.extensionUtils;

const Me = ExtensionUtils.getCurrentExtension();
const ResultView = Me.imports.result_view;

const RESULTS_ANIMATION_TIME = 0.3;

const PREPEND_ANIMATION_TIME = 0.15;
const ICON_ANIMATION_TIME = 0.2;
const ICON_MIN_OPACITY = 30;
const ICON_MAX_OPACITY = 255;

const ResultsView = new Lang.Class({
    Name: 'GoogleCalculator.ResultsView',

    _init: function() {
        this.actor = new St.BoxLayout({
            x_expand: true,
            y_expand: true,
            vertical: true,
            reactive: true
        });
        this.actor.connect('allocation-changed',
            Lang.bind(this, this._on_allocation_changed)
        );

        this._scroll_view = new St.ScrollView({
            style_class: 'google-calculator-results-view-scroll',
            x_expand: true,
            y_expand: true,
            x_fill: true,
            y_fill: true
        });
        this._scroll_view.set_policy(
            Gtk.PolicyType.EXTERNAL,
            Gtk.PolicyType.EXTERNAL
        );

        this._box = new St.BoxLayout({
            vertical: true,
            style_class: 'google-calculator-results-view-box'
        });
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

        this.connect('notify::n-results',
            Lang.bind(this, function() {
                if(this.n_results === 1) this._hide_icon();
                else if(this.n_results === 0) this._show_icon();
            })
        )
    },

    _on_allocation_changed: function() {
        // this._resize_result_views();
        this._resize_icon();
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
        this._result_views.push(result_view);

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
        }

        this.emit('notify::n-results');
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

    prepend: function(result) {
        this._add(result, 0);
    },

    clear: function() {
        for each(let view in this._result_views) view.destroy();
        this._result_views = [];
        this.emit('notify::n-results');
    },

    destroy: function() {
        this.actor.destroy();
    },

    get n_results() {
        return this._result_views.length;
    }
});
Signals.addSignalMethods(ResultsView.prototype);
