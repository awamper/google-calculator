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
const Pango = imports.gi.Pango;
const GLib = imports.gi.GLib;
const Mainloop = imports.mainloop;
const Main = imports.ui.main;
const Tweener = imports.ui.tweener;
const ExtensionUtils = imports.misc.extensionUtils;

const Me = ExtensionUtils.getCurrentExtension();
const Utils = Me.imports.utils;
const PrefsKeys = Me.imports.prefs_keys;
const PopupDialog = Me.imports.popup_dialog;

const LABEL_MAX_FONT_SIZE = 50;
const LABEL_MIN_FONT_SIZE = 10;

const TIMEOUT_IDS = {
    FLASH_MESSAGE: 0
};

const EFFECT_NAME = 'GoogleCalculator.FlashMessage effects';

var FlashMessage = new Lang.Class({
    Name: 'GoogleCalculator.FlashMessage',
    Extends: PopupDialog.PopupDialog,

    _init: function(source_actor) {
        this.parent({
            modal: false,
            style_class: 'google-calculator-flash-message-box'
        });
        this._source_actor = source_actor;

        this._icon = new St.Icon({
            visible: false,
            style_class: 'google-calculator-flash-message-icon'
        });
        this._label = new St.Label({
            style_class: 'google-calculator-flash-message-label'
        });
        this._label.clutter_text.set_ellipsize(Pango.EllipsizeMode.NONE);
        this._label.clutter_text.set_line_wrap(true);

        this.actor.set_vertical(true);
        this.actor.add(this._icon, {
            expand: true,
            x_fill: false,
            y_fill: false,
            x_align: St.Align.MIDDLE,
            y_align: St.Align.END
        });
        this.actor.add(this._label, {
            expand: true,
            x_fill: false,
            y_fill: false,
            x_align: St.Align.MIDDLE,
            y_align: St.Align.MIDDLE
        });

        this._timeout = 2 * 1000;
        this._extra_space = 5;
    },

    _resize_label: function() {
        let size;

        if(this._label.text.length > 20) {
            size = Math.round(this._label.text.length * 0.5);
            if(size > LABEL_MAX_FONT_SIZE) size = LABEL_MAX_FONT_SIZE;
            if(size < LABEL_MIN_FONT_SIZE) size = LABEL_MIN_FONT_SIZE;
        }
        else {
            size = LABEL_MAX_FONT_SIZE;
        }

        this._label.style = 'font-size: %spx;'.format(size);
    },

    _resize: function() {
        this._icon.icon_size = Math.round(this._source_actor.width * 0.3);
        this.actor.width = this._source_actor.width + this._extra_space;
        this.actor.height = this._source_actor.height + this._extra_space;
        this._resize_label();
    },

    _reposition: function() {
        this._resize();
        let [x, y] = this._source_actor.get_transformed_position();
        this.parent(x - this._extra_space / 2, y + this._extra_space / 2);
    },

    _remove_timeout: function() {
        if(TIMEOUT_IDS.FLASH_MESSAGE !== 0) {
            Mainloop.source_remove(TIMEOUT_IDS.FLASH_MESSAGE);
            TIMEOUT_IDS.FLASH_MESSAGE = 0;
        }
    },

    _show_done: function() {
        TIMEOUT_IDS.FLASH_MESSAGE = Mainloop.timeout_add(this._timeout,
            Lang.bind(this, function() {
                TIMEOUT_IDS.FLASH_MESSAGE = 0;
                this.hide();
                return GLib.SOURCE_REMOVE;
            })
        );

        this.parent();
    },

    show: function(text, icon_name=null, timeout=2) {
        this._remove_timeout();

        if(this.shown && !this.hiding) return;
        if(this.hiding) Tweener.removeTweens(this.actor);

        Tweener.removeTweens(this._source_actor);
        Tweener.addTween(this._source_actor, {
            time: 0.2,
            opacity: 100,
            transition: 'easeOutQuad'
        });

        this._timeout = timeout * 1000;
        this._label.set_text(text);

        if(icon_name !== null) {
            this._icon.icon_name = icon_name;
            this._icon.show();
        }

        let enable_effects = Utils.SETTINGS.get_boolean(
            PrefsKeys.ENABLE_EFFECTS
        );
        let tweener_props = {
            time: 2,
            delay: 0.5,
            factor: 1
        };

        if(enable_effects) {
            this.actor.set_pivot_point(0.5, 0.5);

            if(!this.shown && enable_effects) {
                for(let i = 0; i < 5; i++) {
                    let blur_effect = new Clutter.BlurEffect();
                    this._source_actor.add_effect_with_name(
                        EFFECT_NAME,
                        blur_effect
                    );
                }
            }

            let desaturate_effect = new Clutter.DesaturateEffect();
            desaturate_effect.set_factor(0);
            this._source_actor.add_effect_with_name(
                EFFECT_NAME,
                desaturate_effect
            );

            Tweener.removeTweens(desaturate_effect);
            Tweener.addTween(desaturate_effect, tweener_props);
        }

        this._reposition();

        Main.uiGroup.set_child_above_sibling(this.actor, null);
        this.actor.set_opacity(0);
        this.actor.show();

        Tweener.removeTweens(this.actor);
        Tweener.addTween(this.actor, {
            opacity: 255,
            time: 0.3,
            transition: 'easeOutQuad',
            onComplete: Lang.bind(this, function() {
                this._show_done();
                this.shown = true;
            })
        });
    },

    hide: function() {
        this._remove_timeout();

        Tweener.removeTweens(this._source_actor);
        Tweener.addTween(this._source_actor, {
            time: 0.2,
            opacity: 255,
            transition: 'easeOutQuad'
        });

        for each(let effect in this._source_actor.get_effects()) {
            if(effect.name !== EFFECT_NAME) continue;

            if(effect instanceof Clutter.DesaturateEffect) {
                let desaturate_effect = effect;
                Tweener.removeTweens(desaturate_effect);
                Tweener.addTween(desaturate_effect, {
                    time: 2,
                    factor: 0,
                    onComplete: Lang.bind(this, function() {
                        this._source_actor.remove_effect(desaturate_effect);
                    })
                });
            }
            else {
                this._source_actor.remove_effect(effect);
            }
        }

        this.hiding = true;

        Tweener.removeTweens(this.actor);
        Tweener.addTween(this.actor, {
            opacity: 0,
            time: 0.3,
            transition: 'easeOutQuad',
            onComplete: Lang.bind(this, function() {
                this.actor.hide();
                this.actor.set_opacity(255);
                this._hide_done();
                this.shown = false;
            })
        });
    },

    destroy: function() {
        this._remove_timeout();

        this._source_actor = null;
        this._icon.destroy();
        this._label.destroy();
        this.parent();
    }
});
