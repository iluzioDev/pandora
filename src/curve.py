from typing import Any
from ecdsa import SECP256k1, SigningKey
from .utils import is_prime
from .point import Point

class Curve():
  def __init__(self, a, b, simulation: bool = False):
    self.a = a
    self.b = b
    self.p = 0
    self.n = 0
    self.points = []
    self.base = Point(a, 0)
    self.public_keys = {}
    self.simulation = simulation
    self.alphabet = ''

  def __setattr__(self, __name: str, __value: Any) -> None:
    if __name in ['a', 'b', 'p', 'n'] and not isinstance(__value, int):
      raise ValueError('Invalid value!')
    # if __name == 'p' and not is_prime(__value):
    #   raise ValueError('Not a prime number!')
    if __name == 'points' and not isinstance(__value, list):
      raise ValueError('Invalid value!')
    if __name__ == 'base' and not isinstance(__value, 'Point'):
      raise ValueError('Invalid value!')
    if __name == 'public_keys' and not isinstance(__value, dict):
      raise ValueError('Invalid value!')
    if __name == 'alphabet' and not isinstance(__value, str):
      raise ValueError('Invalid value!')
    if __name in ['a', 'b', 'p'] and hasattr(self, __name) and getattr(self, __name) != __value:
      self.points = []
      super().__setattr__(__name, __value)
      if self.simulation:
        self.calculate_points()
      return
    super().__setattr__(__name, __value)

  def order(self) -> int:
    return len(self.points) + 1

  def M(self) -> int:
    return len(self.alphabet)

  def calculate_points(self) -> None:
    if self.a is None or self.b is None or self.p is None:
      raise ValueError(f'Parameters not set! a: {self.a}, b: {self.b}, p: {self.p}')
    for x in range(self.p):
      y2 = (x ** 3 + self.a * x + self.b) % self.p
      for y in range(self.p):
        if y ** 2 % self.p == y2:
          self.points.append(Point(self.a, self.p, x, y))

  def insert_key(self, id: str, public_key: 'Point') -> None:
    self.public_keys[id] = public_key

  def steps(self, point: 'Point', scalar: int) -> list:
    result = []
    for i in range(1, scalar + 1):
      if not (point * i).at_infinity():
        result.append(point * i)
    return result

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
        if x in [point.x for point in self.points]:
          y = [point.y for point in self.points if point.x == x][0]
          break
        j += 1
      encoded.append(Point(self.a, self.p, x, y))
    return encoded

  def decode(self, points: list) -> str:
    if self.alphabet is None:
      raise ValueError('Alphabet not set!')
    if self.p <= (self.M() * 2):
      raise ValueError('Invalid prime number! Must be greater than 2 * M.')
    decoded = ''
    h = self.p // self.M()
    for point in points:
      x = point.x
      nearest = x
      while nearest % h != 0 and nearest >= 0:
        nearest -= 1
      decoded += self.alphabet[nearest // h]
    return decoded

  def encrypt(self, message: str, dx: int, dyG: 'Point') -> list:
    if self.base is None:
      raise ValueError('Base point not set!')
    if dyG == Point(self.a, self.p):
      raise ValueError('Public key of the other party not set!')
    if dx == 0:
      return [Point(self.a, self.p)] * len(message)
    return [(Qm + (dyG * dx), self.base * dx) for Qm in self.encode(message)]

  def decrypt(self, points: list, dx: int) -> str:
    if self.base is None:
      raise ValueError('Base point not set!')
    if dx == 0:
      return ''
    msg = ''
    for encrypted, dyG in points:
      shared = dyG * dx
      decrypted = encrypted - shared
      if decrypted == None:
        return ''
      msg += self.decode([decrypted])
    return msg
