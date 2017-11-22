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
const Clutter = imports.gi.Clutter;
const GLib = imports.gi.GLib;
const Pango = imports.gi.Pango;
const Mainloop = imports.mainloop;
const Tweener = imports.ui.tweener;
const ExtensionUtils = imports.misc.extensionUtils;

const Me = ExtensionUtils.getCurrentExtension();
const Utils = Me.imports.utils;
const PrefsKeys = Me.imports.prefs_keys;

const TIMEOUT = 500; // ms
const TIMEOUT_IDS = {
    SELECTED: 0
};

var ResultView = new Lang.Class({
    Name: 'GoogleCalculator.ResultView',

    _init: function(result) {
        this._result = result;

        this.actor = new St.BoxLayout({
            style_class: 'google-calculator-result-view-box',
            vertical: false,
            reactive: true,
            track_hover: true
        });
        this.actor.connect('allocation-changed',
            Lang.bind(this, this._on_allocation_changed)
        );
        this.actor.connect('button-release-event',
            Lang.bind(this, this._on_button_release)
        );
        this.actor.connect('leave-event',
            Lang.bind(this, function() {
                this._enable_wrap(this._query, false);
                this._enable_wrap(this._answer, false);
            })
        );

        this._selected_indicator = new St.Bin({
            style_class: 'google-calculator-result-view-indicator',
            width: 3,
            opacity: 0
        });
        this.actor.add_child(this._selected_indicator);

        this._box = new St.BoxLayout({
            vertical: true
        });
        this.actor.add_child(this._box);

        this._query = new St.Label({
            style_class: 'google-calculator-result-view-query'
        });
        this._answer = new St.Label({
            style_class: 'google-calculator-result-view-answer'
        });
        this._box.add(this._query);
        this._box.add(this._answer);

        this._query_ellipsized = null;
        this._answer_ellipsized = null;

        this._enable_wrap(this._query, false);
        this._enable_wrap(this._answer, false);
        this.set_result(result);
    },

    _on_allocation_changed: function() {
        let layout, size;

        if(this.query_ellipsized === null) {
            layout = this._query.clutter_text.get_layout();
            size = layout.get_pixel_size();
            this._query_ellipsized = size[0] >= this._box.width;
        }

        if(this.answer_ellipsized === null) {
            layout = this._answer.clutter_text.get_layout();
            size = layout.get_pixel_size();
            this._answer_ellipsized = size[0] >= this._box.width;
        }
    },

    _on_button_release: function(sender, event) {
        let button = event.get_button();

        if(button === Clutter.BUTTON_SECONDARY) {
            this.toggle_wrap(this._query);
            this.toggle_wrap(this._answer);
        }

        return Clutter.EVENT_PROPAGATE;
    },

    _remove_timeout: function() {
        if(TIMEOUT_IDS.SELECTED !== 0) {
            Mainloop.source_remove(TIMEOUT_IDS.SELECTED);
            TIMEOUT_IDS.SELECTED = 0;
        }
    },

    _enable_wrap: function(label, enable=false) {
        if(enable) {
            label.clutter_text.set_ellipsize(Pango.EllipsizeMode.NONE);
            label.clutter_text.set_line_wrap(true);
        }
        else {
            label.clutter_text.set_ellipsize(Pango.EllipsizeMode.END);
            label.clutter_text.set_line_wrap(false);
        }
    },

    _show_indicator: function() {
        Tweener.removeTweens(this._selected_indicator);
        Tweener.addTween(this._selected_indicator, {
            time: 0.3,
            opacity: 255,
            transition: 'easeOutQuad'
        });
    },

    _hide_indicator: function() {
        Tweener.removeTweens(this._selected_indicator);
        Tweener.addTween(this._selected_indicator, {
            time: 0.3,
            opacity: 0,
            transition: 'easeOutQuad'
        });
    },

    on_selected: function(selected) {
        this._remove_timeout();
        this._enable_wrap(this._query, false);
        this._enable_wrap(this._answer, false);

        if(selected) {
            this._show_indicator();
            this.actor.track_hover = false;
        }
        else {
            this._hide_indicator();
            this.actor.track_hover = true;
        }

        if(
            !selected ||
            (
                this._query.clutter_text.line_wrap ||
                this._answer.clutter_text.line_wrap
            )
        ) return;

        TIMEOUT_IDS.SELECTED = Mainloop.timeout_add(TIMEOUT,
            Lang.bind(this, function() {
                TIMEOUT_IDS.SELECTED = 0;
                this._enable_wrap(this._query, true);
                this._enable_wrap(this._answer, true);
                return GLib.SOURCE_REMOVE;
            })
        );
    },

    toggle_wrap: function(label) {
        if(label.clutter_text.line_wrap) this._enable_wrap(label, false);
        else this._enable_wrap(label, true);
    },

    set_result: function(result) {
        this._query.set_text(result.query);

        let answer = result.answer;
        let dont_prettify = Utils.SETTINGS.get_boolean(
            PrefsKeys.DONT_PRETTIFY_ANSWERS
        );
        if(result.pretty_answer && !dont_prettify) {
            answer = result.pretty_answer;
        }

        this._answer.set_text(answer);
    },

    destroy: function() {
        this._result = null;

        Tweener.removeTweens(this._selected_indicator);
        this._remove_timeout();
        this.actor.destroy();
    },

    get result() {
        return this._result;
    },

    get query_ellipsized() {
        return this._query_ellipsized;
    },

    get answer_ellipsized() {
        return this._answer_ellipsized;
    },

    get is_ellipsized() {
        return (this.query_ellipsized || this.answer_ellipsized);
    },

    get query_label() {
        return this._query;
    },

    get answer_label() {
        return this._answer;
    }
});
