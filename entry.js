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
const Signals = imports.signals;
const ExtensionUtils = imports.misc.extensionUtils;

const Me = ExtensionUtils.getCurrentExtension();
const Utils = Me.imports.utils;
const PrefsKeys = Me.imports.prefs_keys;
const Extension = Me.imports.extension;

const Entry = new Lang.Class({
    Name: 'GoogleCalculator.Entry',

    _init: function() {
        this._grid_layout = new Clutter.GridLayout();
        this.actor = new St.Widget({
            layout_manager: this._grid_layout
        });

        this._entry = new St.Entry({
            style_class: 'google-calculator-entry',
            hint_text: 'Type or <Ctrl>V',
            track_hover: true,
            can_focus: true,
            x_expand: true
        });
        this._entry.connect(
            'secondary-icon-clicked',
            Lang.bind(this, this.clear)
        );
        this.clutter_text.connect(
            'text-changed',
            Lang.bind(this, this._on_text_changed)
        );
        this.clutter_text.connect(
            'key-press-event',
            Lang.bind(this, this._on_key_press)
        );
        this.clutter_text.set_activatable(false);

        let primary_icon = new St.Icon({
            style_class: 'google-calculator-entry-icon',
            icon_name: 'accessories-calculator-symbolic'
        });
        this._entry.set_primary_icon(primary_icon);

        this._secondary_icon = new St.Icon({
            style_class: 'google-calculator-entry-icon',
            icon_name: 'edit-clear-symbolic',
            visible: false
        });
        this._entry.set_secondary_icon(this._secondary_icon);

        this._suggestion = new St.Label({
            style_class: 'google-calculator-entry-suggestion'
        });

        this._grid_layout.attach(this._suggestion, 0, 0, 1, 1);
        this._grid_layout.attach(this._entry, 0, 0, 1, 1);
    },

    _on_text_changed: function() {
        if(this.is_empty()) this._secondary_icon.hide();
        else this._secondary_icon.show();

        return Clutter.EVENT_STOP;
    },

    _on_key_press: function(sender, event) {
        let symbol = event.get_key_symbol();
        let control = event.has_control_modifier();
        let shift = event.has_shift_modifier();
        let alt = (event.get_state() & Clutter.ModifierType.MOD1_MASK)
        let code = event.get_key_code();

        if(symbol === Clutter.Right && !shift && !control) {
            let selection = this.clutter_text.get_selection();

            if(
                !Utils.is_blank(selection) &&
                this.clutter_text.get_selection_bound() === -1
            ) {
                this.clutter_text.set_cursor_position(
                    this.text.length
                );

                return Clutter.EVENT_STOP;
            }
        }

        return Clutter.EVENT_PROPAGATE;
    },

    is_empty: function() {
        if(
            Utils.is_blank(this._entry.text) ||
            this._entry.text === this._entry.hint_text
        ) {
            return true
        }
        else {
            return false;
        }
    },

    clear: function() {
        if(!this.is_empty()) this.set_text('');
    },

    set_text: function(text) {
        this._entry.set_text(text);
    },

    grab_key_focus: function(select_text) {
        if(!this.is_empty() && select_text === true) this.select_all();
        this._entry.grab_key_focus();
    },

    select_all: function() {
        this.clutter_text.set_selection(0, -1);
    },

    add_suggestion: function(suggestion) {
        let markup = '<span fgcolor="grey">%s</span>'.format(suggestion);
        this._suggestion.clutter_text.set_markup(markup);
    },

    clear_suggestion: function() {
        this._suggestion.set_text('');
    },

    destroy: function() {
        this._secondary_icon.destroy();
        this.actor.destroy();
    },

    get text() {
        return !this.is_empty() ? this._entry.get_text() : '';
    },

    set text(text) {
        this.set_text(text);
    },

    get clutter_text() {
        return this._entry.clutter_text;
    },

    get suggestion() {
        return this._suggestion.get_text();
    }
});
Signals.addSignalMethods(Entry.prototype);
