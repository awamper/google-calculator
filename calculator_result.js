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

const CalculatorResult = new Lang.Class({
    Name: 'GoogleCalculator.CalculatorResult',

    _init: function(data) {
        for each(let key in Object.keys(data)) {
            this[key] = data[key];
        }
    },

    get string() {
        return JSON.stringify({
            query: this.query,
            answer: this.answer
        });
    }
});

function from_string(string) {
    let result = new CalculatorResult(JSON.parse(string));
    return result;
}
