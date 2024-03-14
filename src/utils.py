def gcd(a: int, b: int) -> int:
  while b:
    a, b = b, a % b
  return a

def simplify(num: int, den: int) -> tuple:
  if den == 0:
    return (-1, -1)
  if num == 0:
    return (0, 1)
  common = gcd(num, den)
  return (num // common, den // common)

def near_2pow(n: int) -> int:
  power = 1
  while power < n:
    power *= 2
  return power

def is_prime(num: int) -> bool:
  return all(num % i for i in range(2, num))

def euclid_extended(a: int, b: int) -> tuple:
  if a == 0:
    return (b, 0, 1)
  g, y, x = euclid_extended(b % a, a)
  s = 1 if a > 0 else -1
  t = 1 if b > 0 else -1
  return (g, x - ((b // a) * y) * s, y * t)
