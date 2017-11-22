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
const Soup = imports.gi.Soup;
const ExtensionUtils = imports.misc.extensionUtils;

const Me = ExtensionUtils.getCurrentExtension();
const Utils = Me.imports.utils;
const PrefsKeys = Me.imports.prefs_keys;

const CURRENCIES = [
    {code: 'AED', name: 'United Arab Emirates Dirham (AED)'},
    {code: 'AFN', name: 'Afghan Afghani (AFN)'},
    {code: 'ALL', name: 'Albanian Lek (ALL)'},
    {code: 'AMD', name: 'Armenian Dram (AMD)'},
    {code: 'ANG', name: 'Netherlands Antillean Guilder (ANG)'},
    {code: 'AOA', name: 'Angolan Kwanza (AOA)'},
    {code: 'ARS', name: 'Argentine Peso (ARS)'},
    {code: 'AUD', name: 'Australian Dollar (A$)'},
    {code: 'AWG', name: 'Aruban Florin (AWG)'},
    {code: 'AZN', name: 'Azerbaijani Manat (AZN)'},
    {code: 'BAM', name: 'Bosnia-Herzegovina Convertible Mark (BAM)'},
    {code: 'BBD', name: 'Barbadian Dollar (BBD)'},
    {code: 'BDT', name: 'Bangladeshi Taka (BDT)'},
    {code: 'BGN', name: 'Bulgarian Lev (BGN)'},
    {code: 'BHD', name: 'Bahraini Dinar (BHD)'},
    {code: 'BIF', name: 'Burundian Franc (BIF)'},
    {code: 'BMD', name: 'Bermudan Dollar (BMD)'},
    {code: 'BND', name: 'Brunei Dollar (BND)'},
    {code: 'BOB', name: 'Bolivian Boliviano (BOB)'},
    {code: 'BRL', name: 'Brazilian Real (R$)'},
    {code: 'BSD', name: 'Bahamian Dollar (BSD)'},
    {code: 'BTC', name: 'Bitcoin (฿)'},
    {code: 'BTN', name: 'Bhutanese Ngultrum (BTN)'},
    {code: 'BWP', name: 'Botswanan Pula (BWP)'},
    {code: 'BYR', name: 'Belarusian Ruble (BYR)'},
    {code: 'BZD', name: 'Belize Dollar (BZD)'},
    {code: 'CAD', name: 'Canadian Dollar (CA$)'},
    {code: 'CDF', name: 'Congolese Franc (CDF)'},
    {code: 'CHF', name: 'Swiss Franc (CHF)'},
    {code: 'CLF', name: 'Chilean Unit of Account (UF) (CLF)'},
    {code: 'CLP', name: 'Chilean Peso (CLP)'},
    {code: 'CNH', name: 'CNH (CNH)'},
    {code: 'CNY', name: 'Chinese Yuan (CN¥)'},
    {code: 'COP', name: 'Colombian Peso (COP)'},
    {code: 'CRC', name: 'Costa Rican Colón (CRC)'},
    {code: 'CUP', name: 'Cuban Peso (CUP)'},
    {code: 'CVE', name: 'Cape Verdean Escudo (CVE)'},
    {code: 'CZK', name: 'Czech Republic Koruna (CZK)'},
    {code: 'DEM', name: 'German Mark (DEM)'},
    {code: 'DJF', name: 'Djiboutian Franc (DJF)'},
    {code: 'DKK', name: 'Danish Krone (DKK)'},
    {code: 'DOP', name: 'Dominican Peso (DOP)'},
    {code: 'DZD', name: 'Algerian Dinar (DZD)'},
    {code: 'EGP', name: 'Egyptian Pound (EGP)'},
    {code: 'ERN', name: 'Eritrean Nakfa (ERN)'},
    {code: 'ETB', name: 'Ethiopian Birr (ETB)'},
    {code: 'EUR', name: 'Euro (€)'},
    {code: 'FIM', name: 'Finnish Markka (FIM)'},
    {code: 'FJD', name: 'Fijian Dollar (FJD)'},
    {code: 'FKP', name: 'Falkland Islands Pound (FKP)'},
    {code: 'FRF', name: 'French Franc (FRF)'},
    {code: 'GBP', name: 'British Pound (£)'},
    {code: 'GEL', name: 'Georgian Lari (GEL)'},
    {code: 'GHS', name: 'Ghanaian Cedi (GHS)'},
    {code: 'GIP', name: 'Gibraltar Pound (GIP)'},
    {code: 'GMD', name: 'Gambian Dalasi (GMD)'},
    {code: 'GNF', name: 'Guinean Franc (GNF)'},
    {code: 'GTQ', name: 'Guatemalan Quetzal (GTQ)'},
    {code: 'GYD', name: 'Guyanaese Dollar (GYD)'},
    {code: 'HKD', name: 'Hong Kong Dollar (HK$)'},
    {code: 'HNL', name: 'Honduran Lempira (HNL)'},
    {code: 'HRK', name: 'Croatian Kuna (HRK)'},
    {code: 'HTG', name: 'Haitian Gourde (HTG)'},
    {code: 'HUF', name: 'Hungarian Forint (HUF)'},
    {code: 'IDR', name: 'Indonesian Rupiah (IDR)'},
    {code: 'IEP', name: 'Irish Pound (IEP)'},
    {code: 'ILS', name: 'Israeli New Sheqel (₪)'},
    {code: 'INR', name: 'Indian Rupee (Rs.)'},
    {code: 'IQD', name: 'Iraqi Dinar (IQD)'},
    {code: 'IRR', name: 'Iranian Rial (IRR)'},
    {code: 'ISK', name: 'Icelandic Króna (ISK)'},
    {code: 'ITL', name: 'Italian Lira (ITL)'},
    {code: 'JMD', name: 'Jamaican Dollar (JMD)'},
    {code: 'JOD', name: 'Jordanian Dinar (JOD)'},
    {code: 'JPY', name: 'Japanese Yen (¥)'},
    {code: 'KES', name: 'Kenyan Shilling (KES)'},
    {code: 'KGS', name: 'Kyrgystani Som (KGS)'},
    {code: 'KHR', name: 'Cambodian Riel (KHR)'},
    {code: 'KMF', name: 'Comorian Franc (KMF)'},
    {code: 'KPW', name: 'North Korean Won (KPW)'},
    {code: 'KRW', name: 'South Korean Won (₩)'},
    {code: 'KWD', name: 'Kuwaiti Dinar (KWD)'},
    {code: 'KYD', name: 'Cayman Islands Dollar (KYD)'},
    {code: 'KZT', name: 'Kazakhstani Tenge (KZT)'},
    {code: 'LAK', name: 'Laotian Kip (LAK)'},
    {code: 'LBP', name: 'Lebanese Pound (LBP)'},
    {code: 'LKR', name: 'Sri Lankan Rupee (LKR)'},
    {code: 'LRD', name: 'Liberian Dollar (LRD)'},
    {code: 'LSL', name: 'Lesotho Loti (LSL)'},
    {code: 'LTL', name: 'Lithuanian Litas (LTL)'},
    {code: 'LVL', name: 'Latvian Lats (LVL)'},
    {code: 'LYD', name: 'Libyan Dinar (LYD)'},
    {code: 'MAD', name: 'Moroccan Dirham (MAD)'},
    {code: 'MDL', name: 'Moldovan Leu (MDL)'},
    {code: 'MGA', name: 'Malagasy Ariary (MGA)'},
    {code: 'MKD', name: 'Macedonian Denar (MKD)'},
    {code: 'MMK', name: 'Myanmar Kyat (MMK)'},
    {code: 'MNT', name: 'Mongolian Tugrik (MNT)'},
    {code: 'MOP', name: 'Macanese Pataca (MOP)'},
    {code: 'MRO', name: 'Mauritanian Ouguiya (MRO)'},
    {code: 'MUR', name: 'Mauritian Rupee (MUR)'},
    {code: 'MVR', name: 'Maldivian Rufiyaa (MVR)'},
    {code: 'MWK', name: 'Malawian Kwacha (MWK)'},
    {code: 'MXN', name: 'Mexican Peso (MX$)'},
    {code: 'MYR', name: 'Malaysian Ringgit (MYR)'},
    {code: 'MZN', name: 'Mozambican Metical (MZN)'},
    {code: 'NAD', name: 'Namibian Dollar (NAD)'},
    {code: 'NGN', name: 'Nigerian Naira (NGN)'},
    {code: 'NIO', name: 'Nicaraguan Córdoba (NIO)'},
    {code: 'NOK', name: 'Norwegian Krone (NOK)'},
    {code: 'NPR', name: 'Nepalese Rupee (NPR)'},
    {code: 'NZD', name: 'New Zealand Dollar (NZ$)'},
    {code: 'OMR', name: 'Omani Rial (OMR)'},
    {code: 'PAB', name: 'Panamanian Balboa (PAB)'},
    {code: 'PEN', name: 'Peruvian Nuevo Sol (PEN)'},
    {code: 'PGK', name: 'Papua New Guinean Kina (PGK)'},
    {code: 'PHP', name: 'Philippine Peso (Php)'},
    {code: 'PKG', name: 'PKG (PKG)'},
    {code: 'PKR', name: 'Pakistani Rupee (PKR)'},
    {code: 'PLN', name: 'Polish Zloty (PLN)'},
    {code: 'PYG', name: 'Paraguayan Guarani (PYG)'},
    {code: 'QAR', name: 'Qatari Rial (QAR)'},
    {code: 'RON', name: 'Romanian Leu (RON)'},
    {code: 'RSD', name: 'Serbian Dinar (RSD)'},
    {code: 'RUB', name: 'Russian Ruble (RUB)'},
    {code: 'RWF', name: 'Rwandan Franc (RWF)'},
    {code: 'SAR', name: 'Saudi Riyal (SAR)'},
    {code: 'SBD', name: 'Solomon Islands Dollar (SBD)'},
    {code: 'SCR', name: 'Seychellois Rupee (SCR)'},
    {code: 'SDG', name: 'Sudanese Pound (SDG)'},
    {code: 'SEK', name: 'Swedish Krona (SEK)'},
    {code: 'SGD', name: 'Singapore Dollar (SGD)'},
    {code: 'SHP', name: 'St. Helena Pound (SHP)'},
    {code: 'SKK', name: 'Slovak Koruna (SKK)'},
    {code: 'SLL', name: 'Sierra Leonean Leone (SLL)'},
    {code: 'SOS', name: 'Somali Shilling (SOS)'},
    {code: 'SRD', name: 'Surinamese Dollar (SRD)'},
    {code: 'STD', name: 'São Tomé &amp; Príncipe Dobra (STD)'},
    {code: 'SVC', name: 'Salvadoran Colón (SVC)'},
    {code: 'SYP', name: 'Syrian Pound (SYP)'},
    {code: 'SZL', name: 'Swazi Lilangeni (SZL)'},
    {code: 'THB', name: 'Thai Baht (THB)'},
    {code: 'TJS', name: 'Tajikistani Somoni (TJS)'},
    {code: 'TMT', name: 'Turkmenistani Manat (TMT)'},
    {code: 'TND', name: 'Tunisian Dinar (TND)'},
    {code: 'TOP', name: 'Tongan Paʻanga (TOP)'},
    {code: 'TRY', name: 'Turkish Lira (TRY)'},
    {code: 'TTD', name: 'Trinidad &amp; Tobago Dollar (TTD)'},
    {code: 'TWD', name: 'New Taiwan Dollar (NT$)'},
    {code: 'TZS', name: 'Tanzanian Shilling (TZS)'},
    {code: 'UAH', name: 'Ukrainian Hryvnia (UAH)'},
    {code: 'UGX', name: 'Ugandan Shilling (UGX)'},
    {code: 'USD', name: 'US Dollar ($)'},
    {code: 'UYU', name: 'Uruguayan Peso (UYU)'},
    {code: 'UZS', name: 'Uzbekistani Som (UZS)'},
    {code: 'VEF', name: 'Venezuelan Bolívar (VEF)'},
    {code: 'VND', name: 'Vietnamese Dong (₫)'},
    {code: 'VUV', name: 'Vanuatu Vatu (VUV)'},
    {code: 'WST', name: 'Samoan Tala (WST)'},
    {code: 'XAF', name: 'Central African CFA Franc (FCFA)'},
    {code: 'XCD', name: 'East Caribbean Dollar (EC$)'},
    {code: 'XDR', name: 'Special Drawing Rights (XDR)'},
    {code: 'XOF', name: 'West African CFA Franc (CFA)'},
    {code: 'XPF', name: 'CFP Franc (CFPF)'},
    {code: 'YER', name: 'Yemeni Rial (YER)'},
    {code: 'ZAR', name: 'South African Rand (ZAR)'},
    {code: 'ZMK', name: 'Zambian Kwacha (1968–2012) (ZMK)'},
    {code: 'ZMW', name: 'Zambian Kwacha (ZMW)'},
    {code: 'ZWL', name: 'Zimbabwean Dollar (2009) (ZWL)'}
];
const QUERY_REGEXP = /([\d\.\/\*\+\-\(\) kmb]+) ([a-z]+) (?:in|to) ([a-z]+)/i;
const SUFFIXES_REGEXP = /(\d+\.?\d*)(k?m?b?)/gi;
const RESULT_REGEXP = /<span class=bld>(.+?)<\/span>/;

var GoogleCurrencyConverter = new Lang.Class({
    Name: 'GoogleCurrencyConverter',

    _init: function() {
        // nothing
    },

    _code_exists: function(code) {
        let result = false;

        for each(let currency in CURRENCIES) {
            if(currency.code.trim().toUpperCase() === code.toUpperCase()) {
                result = code;
                break;
            }
        }

        return result;
    },

    _build_url: function(amount, from, to) {
        let url = Utils.SETTINGS.get_string(PrefsKeys.GOOGLE_CURRENCY_URL);
        url = url.format(
            encodeURIComponent(amount),
            encodeURIComponent(from),
            encodeURIComponent(to)
        );
        return url;
    },

    _expand_suffixes: function(query) {
        let match;
        let result = query;

        while((match = SUFFIXES_REGEXP.exec(query)) !== null) {
            let number = parseFloat(match[1]);
            let suffix = match[2].trim();

            if(suffix.toUpperCase() === 'K') {
                result = result.replace(match[0], number * 1000);
            }
            else if(suffix.toUpperCase() === 'M') {
                result = result.replace(match[0], number * 1000000);
            }
            else if(suffix.toUpperCase() === 'B') {
                result = result.replace(match[0], number * 1000000000);
            }
        }

        return result;
    },

    parse_query: function(query) {
        query = query.trim();
        if(!QUERY_REGEXP.test(query)) return false;

        let match = QUERY_REGEXP.exec(query);
        let code_from = match[2].trim();
        let code_to = match[3].trim();
        let amount = this._expand_suffixes(match[1]);

        try {
            amount = eval(amount);
        }
        catch(e) {
            return false;
        }

        if(
            amount < 1 ||
            !this._code_exists(code_from) ||
            !this._code_exists(code_to)
        ) return false;

        return {
            amount: amount,
            code_from: code_from,
            code_to: code_to
        };
    },

    convert: function(query, callback) {
        let params = this.parse_query(query)

        if(!params) {
            callback(query, null, 'Not supported query.');
            return;
        }
        if(Utils.is_blank(query)) {
            callback(query, null, 'Query is empty.');
            return;
        }

        let url = this._build_url(
            params.amount,
            params.code_from,
            params.code_to
        );
        query = '%s %s to %s'.format(
            params.amount,
            params.code_from.toUpperCase(),
            params.code_to.toUpperCase()
        );
        let message = Soup.Message.new('GET', url);
        Utils.HTTP_SESSION.queue_message(message,
            Lang.bind(this, function(http_session, response) {
                if(response.status_code !== Soup.KnownStatusCode.OK) {
                    let error_message =
                        'GoogleCurrencyConverter:convert(): ' +
                        'Error: code %s, reason %s'.format(
                            response.status_code,
                            response.reaseon_phrase
                        );
                    callback(query, null, error_message);
                    return;
                }

                let result = RESULT_REGEXP.exec(response.response_body.data);
                if(result === null) {
                    callback(query, null, 'Could not convert');
                    return;
                }
                result = result[1];

                if(!Utils.is_blank(result)) {
                    let rate = parseFloat(result) / params.amount;

                    if(rate <= 0.0001) {
                        let reverse_query = '%s %s to %s'.format(
                            1, params.code_to, params.code_from
                        );
                        this.convert(reverse_query,
                            Lang.bind(this, function(q, rate, e) {
                                if(rate === null) {
                                    callback(q, rate, e);
                                    return;
                                }

                                let reverse_result = (
                                    1 / parseFloat(rate) * params.amount
                                ).toFixed(4).toString() + ' %s'.format(
                                    params.code_to.toUpperCase()
                                );
                                callback(query, reverse_result);
                            })
                        )
                    }
                    else {
                        callback(query, result);
                    }
                }
                else {
                    callback(query, null, 'No result');
                }
            })
        );
    },

    destroy: function() {
        // nothing
    }
});
