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
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Main = imports.ui.main;
const ExtensionUtils = imports.misc.extensionUtils;

const Me = ExtensionUtils.getCurrentExtension();
const Utils = Me.imports.utils;
const PrefsKeys = Me.imports.prefs_keys;
const Extension = Me.imports.extension;
const GoogleSuggestions = Me.imports.google_suggestions;

const QUERY_MAX_LENGTH = 50;

const Indicator = new Lang.Class({
    Name: 'GoogleCalculator.Indicator',
    Extends: PanelMenu.Button,

    _init: function() {
        this.parent(0.0, 'google-calculator');

        let icon = new St.Icon({
            icon_name: 'accessories-calculator-symbolic',
            style_class: 'system-status-icon'
        });
        this.actor.add_child(icon);

        this._last_query = '';

        this._update_menu_items();
        Main.panel.addToStatusArea('google-calculator', this);
    },

    _onEvent: function(actor, event) {
        if(event.type() === Clutter.EventType.BUTTON_RELEASE) {
            let button = event.get_button();

            switch(button) {
                case Clutter.BUTTON_SECONDARY:
                    this._update_menu_items();
                    this.menu.toggle();
                    break;
                case Clutter.BUTTON_MIDDLE:
                    break;
                default:
                    Extension.google_calculator.show();
                    break;
            }

            return Clutter.EVENT_STOP;
        }
        else {
            return Clutter.EVENT_PROPOGATE;
        }
    },

    _populate_menu: function(query) {
        let label = new PopupMenu.PopupMenuItem('Google Calculator:');
        label.setSensitive(false);
        this.menu.addMenuItem(label);

        let item = new PopupMenu.PopupMenuItem('...');
        item.connect('activate',
            Lang.bind(this, function() {
                let clipboard = St.Clipboard.get_default();
                clipboard.set_text(
                    St.ClipboardType.CLIPBOARD,
                    item.result
                );
            })
        );
        this.menu.addMenuItem(item)

        if(Utils.is_blank(query)) {
            item.label.set_text('\tClipboard is empty');
            item.setSensitive(false);
        }
        else if(query.length < QUERY_MAX_LENGTH) {
            let types = [GoogleSuggestions.SUGGESTION_TYPE.CALCULATOR];
            Extension.google_calculator.suggestions.get_suggestions(
                query, types, 1,
                Lang.bind(this, function(query, result) {
                    if(result === null || result.length < 1) {
                        item.label.set_text('\tNo answer');
                        item.setSensitive(false);
                    }
                    else {
                        result = result[0].text;
                        let label = '\t%s %s'.format(query, result);
                        item.label.set_text(label);
                        item.result = result.slice(result.indexOf(' '));
                    }
                })
            );
        }
        else {
            item.label.set_text('\tClipboard contents is too big');
            item.setSensitive(false);
        }

        let separator = new PopupMenu.PopupSeparatorMenuItem();
        this.menu.addMenuItem(separator);

        let preferences_item = new PopupMenu.PopupMenuItem('Preferences');
        preferences_item.connect('activate', Lang.bind(this, function() {
            Utils.launch_extension_prefs(Me.uuid);
            Extension.google_calculator.hide();
        }));
        this.menu.addMenuItem(preferences_item);
    },

    _update_menu_items: function() {
        let clipboard = St.Clipboard.get_default();
        clipboard.get_text(St.ClipboardType.CLIPBOARD,
            Lang.bind(this, function(clipboard, text) {
                if(text && (text.trim() !== this._last_query.trim())) {
                    this._last_query = text.trim();
                    this.menu.removeAll();
                    this._populate_menu(text);
                }
            })
        );
    },

    destroy: function() {
        delete Main.panel.statusArea['google-calculator'];
        this.parent();
    }
});
