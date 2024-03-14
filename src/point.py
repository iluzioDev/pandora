import json
from .utils import euclid_extended, simplify

class Point():
  def __init__(self, x = 0, y = 0):
    self.x = x
    self.y = y

  def __eq__(self, other: 'Point') -> bool:
    if other == None:
      return False
    return self.x == other.x and self.y == other.y

  def __neg__(self) -> 'Point':
    return Point(self.x, -self.y)

  def __add__(self, info: tuple) -> 'Point':
    other, curve = info
    if self.at_infinity():
        return other
    if other.at_infinity():
        return self
    if self == -other:
        return Point(-1, -1)

    if self == other:
        num, den = (3 * self.x ** 2 + curve.a), (2 * self.y)
    else:
        num, den = (other.y - self.y), (other.x - self.x)

    num, den = simplify(num, den)
    lamb = (num * euclid_extended(abs(den), curve.p)[1]) % curve.p

    x3 = (lamb ** 2 - self.x - other.x) % curve.p
    y3 = (lamb * (self.x - x3) - self.y) % curve.p

    return Point(x3, y3)

  def __sub__(self, other: 'Point') -> 'Point':
    return self + -other

  def __mul__(self, info: tuple) -> 'Point':
    scalar, curve = info
    if scalar == 0 or self.at_infinity():
        return Point(-1, -1)

    result = Point()
    addend = self
    while scalar:
        if scalar & 1:
            if result == Point():
                result = addend
            else:
                result += (addend, curve)
        addend += (addend, curve)
        scalar >>= 1
    return result

  def __str__(self) -> str:
    return f'({self.x}, {self.y})'

  def toJSON(self) -> str:
    return json.dumps({"x": self.x, "y": self.y}, indent=4)

  def at_infinity(self) -> bool:
    return self.x == -1 and self.y == -1
