class LangData {
    _json: any[];
    _locale: string;

    constructor(json: any[], locale) {
        this._json = json;
        this._locale = locale;
    }

    json() {
        return this._json;
    }

    locale() {
        return this._locale;
    }

    gettext(id : string) {
        let res = id;
        if(this.json()[id]) {
            if(this.json()[id][0] == null) {
                res = this.json()[id][1];
            } else {
                res = this.json()[id][1][0];
            }
        }
        return res;
    }
}

export const setLocale = async (locale: string) => {
    const res = await fetch(
      `https://raw.githubusercontent.com/lispcoc/cdda-lang-json/main/${locale}.json`,
      {
        mode: "cors",
      }
    );
    if (!res.ok)
      throw new Error(`Error ${res.status} (${res.statusText}) fetching data`);
    const json = await res.json();
    lang = new LangData(json, locale);
};

let locale = 'ja';

export let lang = null;
export const __ = (id : string) => {
    while(!lang) {};
    return lang.gettext(id);
}