export default class Alphabet {
  constructor(characters = "") {
    this._value = new Set(this.parseCharacters(characters));
    this.types = {
      "spanish": {
        "value": "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ",
        "numeric_system": false,
      },
      "alphabetic": {
        "value": "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
        "numeric_system": false,
      },
      "binary": {
        "value": "01",
        "numeric_system": true,
      },
      "decimal": {
        "value": "0123456789",
        "numeric_system": true,
      },
      "hexadecimal": {
        "value": "0123456789ABCDEF",
        "numeric_system": true,
      },
    };
    this.options = {
      "case-sensitive": true,
      "alphanumeric": false,
    };
  }

  set value(characters) {
    this._value = new Set(this.parseCharacters(characters));
  }

  get value() {
    return this._value;
  }

  set value_by_type(type) {
    this._value = this.types[type];
  }

  getTypes() {
    return Object.keys(this.types);
  }

  getOptions() {
    return Object.keys(this.options);
  }

  check_options() {
    if (!this.options["case-sensitive"]) {
      const upper = [...this._value].map(char => char.toUpperCase());
      const lower = [...this._value].map(char => char.toLowerCase());
      console.log(upper, lower);
      this._value = new Set(lower.concat(upper));
    }
    if (this.options["alphanumeric"])
      this._value = new Set([...this._value, ...this.types["decimal"].value]);
  }

  parseCharacters(characters) {
    if (typeof characters === 'string')
      return characters.split("");
    return [];
  }
}
