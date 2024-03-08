from typing import Any
class Curve():
  def __init__(self, a, b):
    self.a = a
    self.b = b
    self.p = 0
    self.points = []
    self.base = None
    self.public_keys = {}
    self.alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?/\\~`"\' '

  def __setattr__(self, __name: str, __value: Any) -> None:
    if __name in ['a', 'b', 'p'] and not isinstance(__value, int):
      raise ValueError('Invalid value!')
    if __name == 'p' and not Curve.is_prime(__value):
      raise ValueError('Not a prime number!')
    if __name == 'points' and not isinstance(__value, list):
      raise ValueError('Invalid value!')
    if (__name__ == 'base' and __value is not None) and (not isinstance(__value, tuple) or len(__value) != 2):
      raise ValueError('Invalid value!')
    if __name == 'public_keys' and not isinstance(__value, dict):
      raise ValueError('Invalid value!')
    if __name == 'alphabet' and not isinstance(__value, str):
      raise ValueError('Invalid value!')
    if __name in ['a', 'b', 'p'] and hasattr(self, __name) and getattr(self, __name) != __value:
      self.points = []
      super().__setattr__(__name, __value)
      self.calculate_points()
      return
    super().__setattr__(__name, __value)

  @staticmethod
  def gcd(a: int, b: int) -> int:
    while b:
      a, b = b, a % b
    return a

  @staticmethod
  def simplify_fraction(num: int, den: int) -> tuple:
    if den == 0:
      return (-1, -1)
    if num == 0:
      return (0, 1)
    common = Curve.gcd(num, den)
    return (num // common, den // common)

  @staticmethod
  def is_prime(number: int) -> bool:
    return all(number % i for i in range(2, number))

  @staticmethod
  def euclid_extended(a: int, b: int) -> tuple:
    if a == 0:
      return (b, 0, 1)
    g, y, x = Curve.euclid_extended(b % a, a)
    s = 1 if a > 0 else -1
    t = 1 if b > 0 else -1
    return (g, x - ((b // a) * y) * s, y * t)

  def calculate_points(self) -> None:
    if not self.a or not self.b or not self.p:
      raise ValueError('Parameters not set!' + str(self.a) + str(self.b) + str(self.p) + str(self.points))
    for x in range(self.p):
      y2 = (x ** 3 + self.a * x + self.b) % self.p
      for y in range(self.p):
        if y ** 2 % self.p == y2:
          self.points.append((x, y))

  def insert_key(self, id: str, public_key: tuple) -> None:
    self.public_keys[id] = public_key

  def add(self, p1: tuple, p2: tuple) -> tuple:
    x1, y1 = p1
    x2, y2 = p2
    if p1 == (0, 0):
      return p2
    if p2 == (0, 0):
      return p1
    if x1 == x2 and y1 == -y2:
      return (-1, -1)

    if p1 == p2:
      num = 3 * x1 ** 2 + self.a
      den = 2 * y1
      if den == 0:
        return (-1, -1)
      num, den = self.simplify_fraction(num, den)
      lamb = (num * self.euclid_extended(abs(den), self.p)[1]) % self.p
    else:
      num = y2 - y1
      den = x2 - x1
      if den == 0:
        return (-1, -1)
      num, den = self.simplify_fraction(num, den)
      lamb = (num * self.euclid_extended(abs(den), self.p)[1]) % self.p

    x3 = (lamb ** 2 - x1 - x2) % self.p
    y3 = (lamb * (x1 - x3) - y1) % self.p
    return x3, y3

  def mult(self, point: tuple, scalar: int) -> tuple:
    if scalar == 0 or point == (0, 0):
      return (0, 0)

    result = (0, 0)
    current = point
    while scalar > 0:
      if scalar & 1:
        result = self.add(result, current)
        if result == (-1, -1):
          return result
      current = self.add(current, current)
      scalar >>= 1
    return result

  def steps(self, point: tuple, scalar: int) -> list:
    result = []
    for i in range(1, scalar + 1):
      if self.mult(point, i) != (-1, -1):
        result.append(self.mult(point, i))
    return result

  def M(self):
    return len(self.alphabet)

  def encode(self, message: str) -> list:
    if self.alphabet is None:
      raise ValueError('Alphabet not set!')
    if self.p <= (self.M() * 2):
      raise ValueError('Invalid prime number! Must be greater than 2 * M.')
    encoded = []
    h = self.p // self.M()
    for char in message:
      if char not in self.alphabet:
        raise ValueError('Character not in alphabet!')
      char_i = self.alphabet.index(char)
      j = 0
      while True:
        x = (char_i * h + j) % self.p
        if x in [point[0] for point in self.points]:
          y = [point[1] for point in self.points if point[0] == x][0]
          break
        j += 1
      encoded.append((x, y))
    return encoded

  def decode(self, points: list) -> str:
    if self.alphabet is None:
      raise ValueError('Alphabet not set!')
    if self.p <= (self.M() * 2):
      raise ValueError('Invalid prime number! Must be greater than 2 * M.')
    decoded = ''
    h = self.p // self.M()
    for point in points:
      x, _ = point
      nearest = x
      while nearest % h != 0 and nearest >= 0:
        nearest -= 1
      decoded += self.alphabet[nearest // h]
    return decoded

  def encrypt(self, message: str, dx: int, dyG: tuple) -> list:
    if self.base is None:
      raise ValueError('Base point not set!')
    if dyG == (0, 0):
      raise ValueError('Public key of the other party not set!')
    if dx == 0:
      return [(0, 0)] * len(message)
    return [(self.add(Qm, self.mult(dyG, dx)), self.mult(self.base, dx)) for Qm in self.encode(message)]

  def decrypt(self, points: list, dx: int) -> str:
    if self.base is None:
      raise ValueError('Base point not set!')
    if dx == 0:
      return ''
    msg = ''
    for encrypted, dyG in points:
      shared = self.mult(dyG, dx)
      neg_shared = shared[0], -shared[1]
      decrypted = self.add(encrypted, neg_shared)
      if decrypted == (-1, -1):
        return ''
      msg += self.decode([decrypted])
    return msg
