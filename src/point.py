import json
from .utils import euclid_extended, simplify

class Point():
  def __init__(self, a, p, x = 0, y = 0):
    self.a = a
    self.p = p
    self.x = x
    self.y = y

  def __eq__(self, other: 'Point') -> bool:
    if other == None:
      return False
    return self.x == other.x and self.y == other.y

  def __neg__(self) -> 'Point':
    return Point(self.a, self.p, self.x, -self.y)

  def __add__(self, other: 'Point') -> 'Point':
    if self.at_infinity():
        return other
    if other.at_infinity():
        return self
    if self == -other:
        return Point(self.a, self.p, -1, -1)

    if self == other:
        num, den = (3 * self.x ** 2 + self.a), (2 * self.y)
    else:
        num, den = (other.y - self.y), (other.x - self.x)

    num, den = simplify(num, den)
    lamb = (num * euclid_extended(abs(den), self.p)[1]) % self.p

    x3 = (lamb ** 2 - self.x - other.x) % self.p
    y3 = (lamb * (self.x - x3) - self.y) % self.p

    return Point(self.a, self.p, x3, y3)

  def __sub__(self, other: 'Point') -> 'Point':
    return self + -other

  def __mul__(self, scalar: int) -> 'Point':
    if scalar == 0 or self.at_infinity():
        return Point(self.a, self.p, -1, -1)

    result = Point(self.a, self.p)
    addend = self
    while scalar:
        if scalar & 1:
            if result == Point(self.a, self.p):
                result = addend
            else:
                result += addend
        addend += addend
        scalar >>= 1
    return result

  def __str__(self) -> str:
    return f'({self.x}, {self.y})'

  def toJSON(self) -> str:
    return json.dumps({"x": self.x, "y": self.y}, indent=4)

  def at_infinity(self) -> bool:
    return self.x == -1 and self.y == -1
