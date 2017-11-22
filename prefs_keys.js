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

var ACTIVATION_METHODS = {
    TIMEOUT: 0,
    RETURN: 1,
    EQUALS_SIGN: 2
};

var ACTIVATION_METHOD_NAMES = [
    'Timeout',
    '<Enter>',
    'Add "=" at the end'
];

var SHOW_CALCULATOR = 'show-calculator';
var HISTORY_LIMIT = 'history-limit';
var HISTORY = 'history';
var GOOGLE_SUGGESTIONS_URL = 'google-suggestions-url';
var GOOGLE_CURRENCY_URL = 'google-currency-url';
var TIMEOUT = 'timeout';
var INDICATOR = 'indicator';
var DIALOG_WIDTH_PERCENTS = 'dialog-width-percents';
var DIALOG_HEIGHT_PERCENTS = 'dialog-height-percents';
var ENABLE_EFFECTS = 'enable-effects';
var CURRENCY_DEFAULT_FROM = 'currency-default-from';
var CURRENCY_DEFAULT_TO = 'currency-default-to';
var CURRENCY_DEFAULT_KEY = 'currency-default-key';
var HELP_URL = 'help-url';
var DONT_SAVE_CURRENCY = 'dont-save-currency';
var DONT_PRETTIFY_ANSWERS = 'dont-prettify-answers';
var ACTIVATION_METHOD = 'activation-method';
