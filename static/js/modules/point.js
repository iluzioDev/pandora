export default class Point {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  equals(other) {
    return this.x === other.x && this.y === other.y;
  }

  negate() {
    return new Point(this.x, -this.y, this.curve);
  }

  toString() {
    return `(${this.x}, ${this.y})`;
  }

  toJSON() {
    return JSON.stringify({ x: this.x, y: this.y }, null, 4);
  }
}
