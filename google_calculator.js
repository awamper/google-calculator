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
const Shell = imports.gi.Shell;
const GLib = imports.gi.GLib;
const Gio = imports.gi.Gio;
const Mainloop = imports.mainloop;
const Signals = imports.signals;
const Params = imports.misc.params;
const Tweener = imports.ui.tweener;
const Main = imports.ui.main;
const ExtensionUtils = imports.misc.extensionUtils;

const Me = ExtensionUtils.getCurrentExtension();
const Utils = Me.imports.utils;
const PrefsKeys = Me.imports.prefs_keys;
const Entry = Me.imports.entry;
const GoogleSuggestions = Me.imports.google_suggestions;
const GoogleCurrencyConverter = Me.imports.google_currency_converter;
const ResultsView = Me.imports.results_view;
const HistoryManager = Me.imports.history_manager;
const FlashMessage = Me.imports.flash_message;
const CalculatorResult = Me.imports.calculator_result;

const CONNECTION_IDS = {
    CAPTURED_EVENT: 0
};

const TIMEOUT_IDS = {
    CALCULATOR: 0
};

const SHOW_ANIMATION_TIME = 0.15;
const HIDE_ANIMATION_TIME = 0.15;

const ICON_BUTTON_MIN_SCALE = 0.8;
const ICON_BUTTON_MAX_SCALE = 1;
const ICON_BUTTON_ANIMATION_TIME = 0.3;
const ICON_BUTTON_MAX_ROTATION = 360;

const IconButton = new Lang.Class({
    Name: 'GoogleCalculator.IconButton',

    _init: function(params) {
        this._params = Params.parse(params, {
            icon_name: 'preferences-system-symbolic',
            style_class: ''
        });

        this.actor = new St.Icon({
            icon_name: this._params.icon_name,
            style_class: this._params.style_class,
            reactive: true,
            track_hover: true,
            scale_x: ICON_BUTTON_MIN_SCALE,
            scale_y: ICON_BUTTON_MIN_SCALE
        });
        this.actor.set_pivot_point(0.5, 0.5);
        this.actor.connect('button-release-event',
            Lang.bind(this, function() {
                this.emit('clicked');
            })
        );
        this.actor.connect('enter-event',
            Lang.bind(this, this._on_enter)
        );
        this.actor.connect('leave-event',
            Lang.bind(this, this._on_leave)
        );
    },

    _on_enter: function() {
        Tweener.removeTweens(this.actor);
        Tweener.addTween(this.actor, {
            time: ICON_BUTTON_ANIMATION_TIME,
            rotation_angle_z: ICON_BUTTON_MAX_ROTATION,
            scale_x: ICON_BUTTON_MAX_SCALE,
            scale_y: ICON_BUTTON_MAX_SCALE,
            transition: 'easeOutQuad'
        });
    },

    _on_leave: function() {
        Tweener.removeTweens(this.actor);
        Tweener.addTween(this.actor, {
            time: ICON_BUTTON_ANIMATION_TIME,
            rotation_angle_z: 0,
            scale_x: ICON_BUTTON_MIN_SCALE,
            scale_y: ICON_BUTTON_MIN_SCALE,
            transition: 'easeOutQuad'
        });
    }
});
Signals.addSignalMethods(IconButton.prototype);

const GoogleCalculator = new Lang.Class({
    Name: 'GoogleCalculator',

    _init: function() {
        this.actor = new St.Table({
            style_class: 'google-calculator-main-box',
            visible: false,
            homogeneous: false
        });
        this.actor.set_pivot_point(0.5, 0.5);
        this.actor.connect(
            'key-press-event',
            Lang.bind(this, this._on_key_press_event)
        );
        this.actor.connect(
            'key-release-event',
            Lang.bind(this, this._on_key_release_event)
        );

        this._entry = new Entry.Entry();
        this._entry.clutter_text.connect(
            'text-changed',
            Lang.bind(this, this._on_entry_text_changed)
        );
        this._entry.clutter_text.connect(
            'key-press-event',
            Lang.bind(this, this._on_entry_key_press_event)
        );
        this._entry.actor.hide();
        this.actor.add(this._entry.actor, {
            row: 0,
            col: 0,
            x_expand: true,
            y_expand: false,
            x_fill: true,
            y_fill: false,
            x_align: St.Align.MIDDLE,
            y_align: St.Align.START
        });

        this._results_view = new ResultsView.ResultsView({
            bind_key: PrefsKeys.HISTORY
        });
        this._results_view.connect('activate',
            Lang.bind(this, this._on_result_activate)
        );
        this._results_view.connect('selected',
            Lang.bind(this, this._on_result_selected)
        );
        this.actor.add(this._results_view.actor, {
            row: 1,
            col: 0,
            x_expand: true,
            y_expand: true,
            x_fill: true,
            y_fill: true,
            x_align: St.Align.MIDDLE,
            y_align: St.Align.MIDDLE
        });

        this._google_currency_converter =
            new GoogleCurrencyConverter.GoogleCurrencyConverter();
        this._google_suggestions = new GoogleSuggestions.GoogleSuggestions();
        this._history_manager = new HistoryManager.HistoryManager({
            key: PrefsKeys.HISTORY,
            limit: Utils.SETTINGS.get_int(PrefsKeys.HISTORY_LIMIT),
            settings: Utils.SETTINGS,
            reverse_order: true
        });
        this._flash_message = new FlashMessage.FlashMessage(
            this._results_view.actor
        );

        this._background_actor = new St.BoxLayout({
            style_class: 'google-calculator-background'
        });

        let help_button = new IconButton({
            icon_name: 'help-browser-symbolic',
            style_class: 'google-calculator-prefs-button'
        });
        help_button.connect('clicked',
            Lang.bind(this, function() {
                Gio.app_info_launch_default_for_uri(
                    Utils.SETTINGS.get_string(PrefsKeys.HELP_URL),
                    Utils.make_launch_context()
                );
                this.hide();
            })
        );
        this._background_actor.add(help_button.actor, {
            expand: true,
            x_fill: false,
            x_align: St.Align.END,
            y_fill: false,
            y_align: St.Align.END
        });

        let preferences_button = new IconButton({
            icon_name: 'preferences-system-symbolic',
            style_class: 'google-calculator-prefs-button'
        });
        preferences_button.connect('clicked',
            Lang.bind(this, function() {
                Utils.launch_extension_prefs(Me.uuid);
                this.hide();
            })
        );
        this._background_actor.add(preferences_button.actor, {
            expand: false,
            x_fill: false,
            x_align: St.Align.END,
            y_fill: false,
            y_align: St.Align.END
        });

        this._ignore_entry_change = false;
        this._shown = false;
    },

    _on_key_press_event: function(sender, event) {
        let code = event.get_key_code();
        let symbol = event.get_key_symbol();
        let control = event.has_control_modifier();
        let shift = event.has_shift_modifier();
        let alt = (event.get_state() & Clutter.ModifierType.MOD1_MASK)
        let ch = Utils.get_unichar(symbol);

        if(symbol === Clutter.Escape) {
            this.hide();
        }
        else if(symbol === Clutter.KEY_Alt_L || symbol === Clutter.KEY_Alt_R) {
            let selected = this._results_view.get_selected();
            if(!selected) return Clutter.EVENT_STOP;

            if(this._entry.text === selected.result.query) {
                this.ignore_change = true;
                this._entry.set_text(selected.result.clean_answer);
                this._entry.select_all();
            }
            else if(this._entry.text === selected.result.clean_answer) {
                this.ignore_change = true;
                this._entry.set_text(selected.result.query);
                this._entry.select_all();
            }
        }
        // <Ctrl>V
        else if(code === 55 && control) {
            St.Clipboard.get_default().get_text(
                St.ClipboardType.CLIPBOARD,
                Lang.bind(this, function(clipboard, text) {
                    if(Utils.is_blank(text)) return;
                    this._entry.grab_key_focus(true);
                    this._entry.set_text(text);
                })
            );
        }
        else if(Utils.symbol_is_tab(symbol)) {
            if(!Utils.is_blank(this._entry.suggestion)) {
                this.ignore_change = true;
                this._entry.set_text(this._entry.suggestion);
                this._entry.clear_suggestion();
            }
        }
        else if(!control && symbol === Clutter.Up) {
            this._results_view.select_prev()
        }
        else if(!control && symbol === Clutter.Down) {
            this._results_view.select_next()
        }
        else if(ch) {
            this._entry.grab_key_focus(false);
            this._entry.set_text(ch);
        }
        else {
            this._results_view._on_key_press(sender, event);
        }

        return Clutter.EVENT_STOP;
    },

    _on_key_release_event: function(sender, event) {
        let code = event.get_key_code();
        let control = event.has_control_modifier();

        // <Ctrl>V
        if(code === 55 && control) {
            if(
                !this._entry.is_empty() &&
                Utils.SETTINGS.get_boolean(PrefsKeys.DISABLE_TIMEOUT)
            ) {
                this._entry.text = this._entry.text + ' =';
            }
        }

        return Clutter.EVENT_PROPAGATE;
    },

    _on_entry_key_press_event: function(sender, event) {
        return this._results_view._on_key_press(sender, event);
    },

    _get_default_currency_regexps: function() {
        let key = Utils.SETTINGS.get_string(PrefsKeys.CURRENCY_DEFAULT_KEY);
        let default_ = new RegExp(
            '^([\\d\\.\\/\\*\\+\\-\\(\\) kmb]+)\\%s$'.format(key), 'i'
        );
        let reverse = new RegExp(
            '^([\\d\\.\\/\\*\\+\\-\\(\\) kmb]+)\\%s\\%s$'.format(key, key), 'i'
        );
        return [default_, reverse];
    },

    _on_entry_text_changed: function() {
        this._remove_timeout();
        this._flash_message.hide();

        if(this.ignore_change) {
            this.ignore_change = false;
            return Clutter.EVENT_PROPAGATE;
        }

        let query_length = this._entry.text.trim().length;
        if(query_length > 1 && query_length < 18) {
            let search = this._search_history(this._entry.text);

            if(search && this._entry.text !== search.query) {
                this._entry.add_suggestion(search.query);
            }
            else {
                this._entry.clear_suggestion();
            }
        }
        else {
            this._entry.clear_suggestion();
        }

        let [default_regexp, reverse_regexp] =
            this._get_default_currency_regexps();
        if(
            default_regexp.test(this._entry.text) ||
            reverse_regexp.test(this._entry.text)
        ) {
            TIMEOUT_IDS.CALCULATOR = Mainloop.timeout_add(
                Utils.SETTINGS.get_int(PrefsKeys.TIMEOUT),
                Lang.bind(this, function() {
                    TIMEOUT_IDS.CALCULATOR = 0;

                    let reverse = reverse_regexp.test(
                        this._entry.text
                    );
                    let regexp = (
                        reverse
                        ? reverse_regexp
                        : default_regexp
                    );
                    let match = regexp.exec(
                        this._entry.text
                    );
                    let amount = match[1];
                    let from = Utils.SETTINGS.get_string(
                        PrefsKeys.CURRENCY_DEFAULT_FROM
                    );
                    let to = Utils.SETTINGS.get_string(
                        PrefsKeys.CURRENCY_DEFAULT_TO
                    );
                    let query = '%s %s to %s'.format(
                        amount,
                        reverse ? to : from,
                        reverse ? from : to
                    );
                    this.convert(query);

                    return GLib.SOURCE_REMOVE;
                })
            );

            return Clutter.EVENT_PROPAGATE;
        }

        if(this._google_currency_converter.parse_query(this._entry.text)) {
            TIMEOUT_IDS.CALCULATOR = Mainloop.timeout_add(
                Utils.SETTINGS.get_int(PrefsKeys.TIMEOUT),
                Lang.bind(this, function() {
                    TIMEOUT_IDS.CALCULATOR = 0;
                    this.convert(this._entry.text);
                    return GLib.SOURCE_REMOVE;
                })
            );
        }
        else {
            let last = this._results_view.last_added;
            if(last && last.result.query === this._entry.text) {
                return Clutter.EVENT_PROPAGATE;
            }

            let query = this.entry.text;
            let disable_timeout = Utils.SETTINGS.get_boolean(
                PrefsKeys.DISABLE_TIMEOUT
            );
            if(disable_timeout) {
                if(!Utils.ends_with(query.trim(), '=')) {
                    return Clutter.EVENT_PROPAGATE;
                }

                query = query.replace('=', '');
            }

            let exists = this._query_exists(query);
            if(exists) {
                this._history_manager.move_to_top(exists.string);
                return Clutter.EVENT_PROPAGATE;
            }

            if(disable_timeout) {
                this.calculate(query);
            }
            else {
                TIMEOUT_IDS.CALCULATOR = Mainloop.timeout_add(
                    Utils.SETTINGS.get_int(PrefsKeys.TIMEOUT),
                    Lang.bind(this, function() {
                        TIMEOUT_IDS.CALCULATOR = 0;
                        this.calculate(query);
                        return GLib.SOURCE_REMOVE;
                    })
                );
            }
        }

        return Clutter.EVENT_PROPAGATE;
    },

    _on_result_activate: function(sender, result) {
        St.Clipboard.get_default().set_text(
            St.ClipboardType.CLIPBOARD,
            result.clean_answer
        );
        this.hide();
    },

    _on_result_selected: function(sender, result) {
        this.ignore_change = true;
        this.entry.set_text(result.query);
        this.entry.select_all();
    },

    _resize: function() {
        let monitor = Main.layoutManager.currentMonitor;
        let is_primary = monitor.index === Main.layoutManager.primaryIndex;

        let available_width = monitor.width;
        let available_height = monitor.height;
        if(is_primary) available_height -= Main.panel.actor.height;

        let width_percents = Utils.SETTINGS.get_int(
            PrefsKeys.DIALOG_WIDTH_PERCENTS
        );
        let width = Math.round(available_width / 100 * width_percents);

        let height_pecents = Utils.SETTINGS.get_int(
            PrefsKeys.DIALOG_HEIGHT_PERCENTS
        );
        let height = Math.round(available_height / 100 * height_pecents);

        this.actor.set_width(width);
        this.actor.set_height(height);
    },

    _reposition: function() {
        let monitor = Main.layoutManager.currentMonitor;
        this.actor.x = Math.round(monitor.width / 2 - this.actor.width / 2);
        this.actor.y = Math.round(monitor.height / 2 - this.actor.height / 2);
    },

    _connect_captured_event: function() {
        CONNECTION_IDS.CAPTURED_EVENT =
            global.stage.connect(
                'captured-event',
                Lang.bind(this, this._on_captured_event)
            );
    },

    _disconnect_captured_event: function() {
        if(CONNECTION_IDS.CAPTURED_EVENT > 0) {
            global.stage.disconnect(CONNECTION_IDS.CAPTURED_EVENT);
            CONNECTION_IDS.CAPTURED_EVENT = 0;
        }
    },

    _on_captured_event: function(sender, event) {
        if(event.type() === Clutter.EventType.BUTTON_RELEASE) {
            let pointer_outside = !Utils.is_pointer_inside_actor(this.actor);
            if(pointer_outside) this.hide();
        }

        return Clutter.EVENT_PROPAGATE;
    },

    _show_background: function() {
        if(this._background_actor.visible) return;

        this._background_actor.width = Main.uiGroup.width;
        this._background_actor.height = Main.uiGroup.height;
        Main.uiGroup.add_child(this._background_actor);

        this._background_actor.set_opacity(0);
        this._background_actor.show();

        Tweener.removeTweens(this._background_actor);
        Tweener.addTween(this._background_actor, {
            time: SHOW_ANIMATION_TIME,
            opacity: 255
        });
    },

    _hide_background: function() {
        if(!this._background_actor.visible) return;

        Tweener.removeTweens(this._background_actor);
        Tweener.addTween(this._background_actor, {
            time: HIDE_ANIMATION_TIME,
            opacity: 0,
            onComplete: Lang.bind(this, function() {
                this._background_actor.hide();
                this._background_actor.set_opacity(255);
                Main.uiGroup.remove_child(this._background_actor);
            })
        });
    },

    _show_done: function() {
        this.shown = true;

        Main.pushModal(this.actor, {
            actionMode: Shell.ActionMode.NORMAL
        });
        this._connect_captured_event();

        if(!this._entry.is_empty()) {
            this._entry.grab_key_focus(true);
        }
    },

    _hide_done: function() {
        if(Utils.SETTINGS.get_boolean(PrefsKeys.DONT_SAVE_CURRENCY)) {
            this._remove_currency_results();
        }

        this.shown = false;
        if(Main._findModal(this.actor) !== -1) Main.popModal(this.actor);
        this._disconnect_captured_event();
    },

    _remove_currency_results: function() {
        let all = this._history_manager.all;
        let to_remove = [];

        for each(let item in all) {
            if(this._google_currency_converter.parse_query(item)) {
                to_remove.push(item);
            }
        }

        if(to_remove.length > 0) {
            this._results_view.clear();
            this._history_manager.remove(to_remove);
        }
    },

    _remove_timeout: function() {
        if(TIMEOUT_IDS.CALCULATOR !== 0) {
            Mainloop.source_remove(TIMEOUT_IDS.CALCULATOR);
            TIMEOUT_IDS.CALCULATOR = 0;
        }
    },

    _query_exists: function(query) {
        let result = false;
        if(Utils.is_blank(query)) return result;

        for each(let item in this._history_manager.all) {
            let calc_result = CalculatorResult.from_string(
                item.trim()
            );
            if(calc_result.query === query) {
                result = calc_result;
                break;
            }
        }

        return result;
    },

    _search_history: function(query) {
        let result = false;
        if(Utils.is_blank(query)) return result;

        for each(let item in this._history_manager.all) {
            let calc_result = CalculatorResult.from_string(
                item.trim()
            );
            if(Utils.starts_with(calc_result.query, query)) {
                result = calc_result;
                break;
            }
        }

        return result;
    },

    _prettify_answer: function(answer) {
        let result;

        try {
            let number = /(\d+\.?\d*)/.exec(answer);
            let match = number[1];

            if(!match) {
                result = false;
            }
            else {
                number = parseFloat(match)
                let number_string = number.toLocaleString();
                result = answer.replace(match, number_string);
            }
        }
        catch(e) {
            result = false;
        }

        return result;
    },

    calculate: function(query) {
        if(Utils.is_blank(query)) return;

        let types = [GoogleSuggestions.SUGGESTION_TYPE.CALCULATOR];
        this._google_suggestions.get_suggestions(query, types, 1,
            Lang.bind(this, function(query, result, error_message) {
                if(result === null) {
                    let message = 'GoogleCalculator:calculate(): %s'.format(
                        error_message
                    );
                    log(message);
                    this._flash_message.show(message);
                    return;
                }

                if(result.length < 1) {
                    this._flash_message.show('No answer', null, 0.5);
                }
                else {
                    let answer = result[0].text.trim();
                    let pretty_answer = (
                        (/^(\d*\.?\d*)$/.test(answer.replace('= ', '').trim()))
                        ? this._prettify_answer(answer)
                        : ''
                    );
                    let calculator_result =
                        new CalculatorResult.CalculatorResult({
                            query: query,
                            answer: answer,
                            pretty_answer: pretty_answer
                        });
                    this._history_manager.add(calculator_result.string);
                }
            })
        );
    },

    convert: function(query) {
        if(Utils.is_blank(query)) return;

        this._google_currency_converter.convert(query,
            Lang.bind(this, function(query, result, error_message) {
                if(result === null) {
                    let message = 'GoogleCalculator:convert(): %s'.format(
                        error_message
                    );
                    log(message);
                    this._flash_message.show(message);
                    return;
                }

                let calculator_result =
                    new CalculatorResult.CalculatorResult({
                        query: query,
                        answer: '= ' + result.trim(),
                        pretty_answer: this._prettify_answer(result) || ''
                    });
                this._history_manager.add(calculator_result.string);
            })
        );
    },

    show: function(animation=true) {
        if(this.shown) return;

        this.emit('showing');
        this._show_background();
        Main.uiGroup.add_child(this.actor);
        this._resize();
        this._reposition();
        this._results_view.select_first(false);

        if(!animation) {
            this.actor.show();
            this._entry.actor.opacity = 255;
            this._entry.actor.show();
            this._show_done();
            return;
        }

        this.actor.set_pivot_point(0.5, 1.0);
        this.actor.scale_x = 0.01;
        this.actor.scale_y = 0.05;
        this.actor.opacity = 0;
        this.actor.show();

        this._entry.actor.opacity = 0;
        this._entry.actor.show();

        this._results_view.actor.set_scale(0.8, 0.8);
        this._results_view.actor.set_pivot_point(0.5, 0.5);

        Tweener.removeTweens(this.actor)
        Tweener.addTween(this.actor, {
            opacity: 255,
            scale_x: 1,
            scale_y: 1,
            time: SHOW_ANIMATION_TIME,
            transition: 'easeOutExpo',
            onComplete: Lang.bind(this, this._show_done)
        });

        Tweener.removeTweens(this._results_view.actor);
        Tweener.addTween(this._results_view.actor, {
            delay: Math.round(SHOW_ANIMATION_TIME * 0.8),
            time: 0.2,
            scale_x: 1.1,
            scale_y: 1.1,
            transition: 'easeOutQuad',
            onComplete: Lang.bind(this, function() {
                Tweener.addTween(this._results_view.actor, {
                    time: 0.2,
                    scale_x: 1,
                    scale_y: 1,
                    transition: 'easeOutQuad'
                });
            })
        });

        Tweener.removeTweens(this._entry.actor);
        Tweener.addTween(this._entry.actor, {
            delay: Math.round(SHOW_ANIMATION_TIME * 0.8),
            time: 0.8,
            opacity: 255,
            transition: 'easeOutQuad'
        });
    },

    hide: function(animation=true) {
        if(!this.shown) return;

        this.emit('closing');
        this._hide_background();

        if(!animation) {
            this.actor.hide();
            Main.uiGroup.remove_child(this.actor);
            this._hide_done();
            return;
        }

        this.actor.set_pivot_point(0.5, 0.5);

        Tweener.removeTweens(this._entry.actor);
        Tweener.addTween(this._entry.actor, {
            transition: 'easeOutQuad',
            opacity: 0,
            time: 0.4
        });

        Tweener.removeTweens(this._results_view.actor);
        Tweener.addTween(this._results_view.actor, {
            time: 0.1,
            scale_x: 1.05,
            scale_y: 1.05,
            transition: 'easeOutQuad',
            onComplete: Lang.bind(this, function() {
                Tweener.addTween(this._results_view.actor, {
                    time: 0.1,
                    scale_x: 1,
                    scale_y: 1,
                    transition: 'easeOutQuad'
                });
            })
        });

        Tweener.removeTweens(this.actor);
        Tweener.addTween(this.actor, {
            delay: 0.2,
            opacity: 0,
            scale_x: 0.8,
            scale_y: 0.8,
            time: HIDE_ANIMATION_TIME,
            transition: 'easeOutQuad',
            onComplete: Lang.bind(this, function() {
                this._entry.actor.hide();
                this._entry.actor.set_opacity(255);

                this.actor.hide();
                this.actor.set_scale(1, 1);
                this.actor.set_opacity(255);
                Main.uiGroup.remove_child(this.actor);

                this._hide_done();
            })
        });
    },

    toggle: function() {
        if(this.shown) this.hide();
        else this.show();
    },

    destroy: function() {
        this._remove_timeout();
        this._disconnect_captured_event();

        this._google_currency_converter.destroy();
        this._flash_message.destroy();
        this._history_manager.destroy();
        this._results_view.destroy();
        this._google_suggestions.destroy();
        this._background_actor.destroy();
        this._entry.destroy();
        this.actor.destroy();
    },

    set shown(shown) {
        this._shown = shown;
        this.emit('notify::shown', this.shown);
    },

    get shown() {
        return this._shown;
    },

    get entry() {
        return this._entry;
    },

    set ignore_change(ignore) {
        this._ignore_entry_change = ignore;
    },

    get ignore_change() {
        return this._ignore_entry_change;
    },

    get suggestions() {
        return this._google_suggestions;
    },

    get history() {
        return this._history_manager;
    }
});
Signals.addSignalMethods(GoogleCalculator.prototype);
