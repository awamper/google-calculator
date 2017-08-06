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
const Meta = imports.gi.Meta;
const Shell = imports.gi.Shell;
const Main = imports.ui.main;
const ExtensionUtils = imports.misc.extensionUtils;

const Me = ExtensionUtils.getCurrentExtension();
const GoogleCalculator = Me.imports.google_calculator;
const Utils = Me.imports.utils;
const PrefsKeys = Me.imports.prefs_keys;
const Indicator = Me.imports.indicator;

let google_calculator = null;
let indicator = null;
let settings_connection_id = 0;

function add_keybindings() {
    Main.wm.addKeybinding(
        PrefsKeys.SHOW_CALCULATOR,
        Utils.SETTINGS,
        Meta.KeyBindingFlags.NONE,
        Shell.ActionMode.NORMAL |
        Shell.ActionMode.OVERVIEW,
        Lang.bind(this, function() {
            google_calculator.toggle();
        })
    );
}

function remove_keybindings() {
    Main.wm.removeKeybinding(PrefsKeys.SHOW_CALCULATOR);
}

function enable_indicator() {
    if(indicator === null) {
        indicator = new Indicator.Indicator();
    }
}

function disable_indicator() {
    if(indicator !== null) {
        indicator.destroy();
        indicator = null;
    }
}

function init() {
    // nothing
}

function enable() {
    if(Utils.SETTINGS === null) {
        Utils.SETTINGS = Utils.getSettings();
    }
    if(Utils.HTTP_SESSION === null) {
        Utils.HTTP_SESSION = Utils.create_session();
    }

    if(google_calculator === null) {
        google_calculator = new GoogleCalculator.GoogleCalculator();
    }
    add_keybindings();

    if(Utils.SETTINGS.get_boolean(PrefsKeys.INDICATOR)) {
        enable_indicator();
    }

    settings_connection_id = Utils.SETTINGS.connect(
        'changed::' + PrefsKeys.INDICATOR,
        Lang.bind(this, function() {
            if(Utils.SETTINGS.get_boolean(PrefsKeys.INDICATOR)) {
                enable_indicator();
            }
            else {
                disable_indicator();
            }
        })
    );
}

function disable() {
    Utils.SETTINGS.disconnect(settings_connection_id);
    settings_connection_id = 0;

    disable_indicator();
    remove_keybindings();

    if(google_calculator !== null) {
        google_calculator.destroy();
        google_calculator = null;
    }

    if(Utils.SETTINGS !== null) {
        Utils.SETTINGS.run_dispose();
        Utils.SETTINGS = null;
    }
    if(Utils.HTTP_SESSION !== null) {
        Utils.HTTP_SESSION.run_dispose();
        Utils.HTTP_SESSION = null;
    }
}
