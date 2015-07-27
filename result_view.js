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

const ResultView = new Lang.Class({
    Name: 'GoogleCalculator.ResultView',

    _init: function(result) {
        this._result = result;

        this.actor = new St.BoxLayout({
            style_class: 'google-calculator-result-view-box',
            vertical: true
        });
        this._query = new St.Label({
            style_class: 'google-calculator-result-view-query'
        });
        this._answer = new St.Label({
            style_class: 'google-calculator-result-view-answer'
        });
        this.actor.add(this._query);
        this.actor.add(this._answer);

        this.set_result(result);
    },

    set_result: function(result) {
        this._query.set_text(result.query);
        this._answer.set_text(result.answer);
    },

    destroy: function() {
        this._result = null;
        this.actor.destroy();
    }
});
