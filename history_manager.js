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

const Lang = imports.lang;
const Signals = imports.signals;
const Params = imports.misc.params;
const ExtensionUtils = imports.misc.extensionUtils;

const Me = ExtensionUtils.getCurrentExtension();
const Utils = Me.imports.utils;

const DEFAULT_LIMIT = 512;

const CONNECTION_IDS = {
    SETTINGS: 0
};

var HistoryManager = new Lang.Class({
    Name: 'GoogleCalculator.HistoryManager',

    _init: function(params) {
        this._params = Params.parse(params, {
            key: null,
            settings: null,
            limit: DEFAULT_LIMIT,
            reverse_order: false
        });

        this._current_index = 0;

        this._history = this._params.settings.get_strv(this._params.key);
        CONNECTION_IDS.SETTINGS = this._params.settings.connect(
            'changed::' + this._params.key,
            Lang.bind(this, this._on_history_changed)
        );
        this.reset();
    },

    _on_history_changed: function() {
        this._history = this._params.settings.get_strv(this._params.key);
        this.reset();
    },

    next: function() {
        let next_index = this.current_index + 1;
        if(next_index > this._history.length) return false;
        this.current_index = next_index;
        return this.current;
    },

    prev: function() {
        let prev_index = this.current_index - 1;
        if(prev_index < 0) return false;
        this.current_index = prev_index;
        return this.current;
    },

    add: function(text) {
        if(Utils.is_blank(text)) return false;
        if(this.last === text) return false;

        if(this._params.reverse_order) this._history.unshift(text);
        else this._history.push(text);

        if(this._history.length > this._params.limit) {
            this._history = this._history.slice(
                0, -(this._history.length - this._params.limit)
            );
        }

        this._params.settings.set_strv(this._params.key, this._history);
        return true;
    },

    remove: function(item) {
        if(item instanceof Array) {
            let items_list = item;
            let new_history = this._history.filter(
                Lang.bind(this, function(value, index, array) {
                    return (items_list.indexOf(value) === -1);
                })
            );

            this._history = new_history;
        }
        else {
            let index = this._history.indexOf(item);
            this._history.splice(index, 1);
        }

        this._params.settings.set_strv(this._params.key, this._history);
    },

    move_to_top: function(item) {
        let index = this._history.indexOf(item);
        this._history.unshift(this._history.splice(index, 1)[0]);
        this._params.settings.set_strv(this._params.key, this._history);
    },

    reset: function() {
        this.current_index = this._history.length;
    },

    destroy: function() {
        this._params.settings.disconnect(CONNECTION_IDS.SETTINGS);
        this._params = null;
    },

    get current_index() {
        return this._current_index;
    },

    set current_index(index) {
        this._current_index = index;
    },

    get current() {
        return this._history[this.current_index] || '';
    },

    get last() {
        return this._history[this._history.length - 1];
    },

    get all() {
        return this._history.slice(0);
    }
});
Signals.addSignalMethods(HistoryManager.prototype);
