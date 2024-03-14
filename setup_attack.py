import random
import hashlib
from src.point import Point
from src.curve import Curve

class Setup():
  def __init__(self, curve: 'Curve'):
    self.curve = curve
    self.c1 = None
    self.c2 = None

  @staticmethod
  def hash_point(point: 'Point') -> int:
    return int(hashlib.sha256(point.x.to_bytes(32, 'big')).hexdigest(), 16)

  def M1(self) -> 'Point':
    return self.curve.base * (self.c1, self.curve)

  def M2(self) -> 'Point':
    return self.curve.base * (self.c2, self.curve)

  def alg1(self, n) -> None:
    self.c1 = random.randint(2, n - 1)
    return self.c1, self.M1()

  def alg2(self, a, b, h, e, V) -> None:
    j = random.randint(0, 1)
    u = random.randint(0, 1)
    curve = self.curve
    Z = self.M1() * (a, curve)
    Z += (V * (b * self.c1, curve), curve)
    Z += (self.curve.base * (h * j, curve), curve)
    Z += (V * (e * u, curve), curve)
    self.c2 = Setup.hash_point(Z)
    return self.c2, self.M2()

  def attack(self, a, b, h, e, V, v) -> int:
    curve = self.curve
    Z1 = (self.M1() * (a, curve))
    Z1 += (self.M1() * (b * v, curve), curve)
    for j in range(2):
      for u in range(2):
        Z2 = Z1
        Z2 += (self.curve.base * (h * j, curve), curve)
        Z2 += (V * (e * u, curve), curve)
        c2 = Setup.hash_point(Z2)
        if curve.base * (c2, curve) == self.M2():
          return c2
    return

ce = Curve(0, 7)
ce.p = 115792089237316195423570985008687907853269984665640564039457584007908834671663
ce.base = Point(79086247176140945631788741473243917373392091539978947803256065440939503345144, 46592427867154248619823560021064937204868064911504510519907326227152259586360)
n = 115792089237316195423570985008687907852837564279074904382605163141518161494337
attacker = Setup(ce)
attacker.alg1(n)
v = random.randint(2, n - 1)
V = attacker.curve.base * (v, ce)
a, b, h, e = [random.randint(1, n - 1) for _ in range(4)]
attacker.alg2(a, b, h, e, V)
print(attacker.attack(a, b, h, e, V, v))
