#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Tue Apr 24 2023

@autor: Luis Chinea Rangel
"""
ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'


def PolligHellman(curve, p, P, G):
  zList = []
  conjList = []
  rootList = []
  #n = P.order()
  #factorList = n.factor()
  # for facTuple in factorList:
  #   p0 =


import random
import hashlib
from ecdsa import SECP256k1, SigningKey

# Initialization
curve = SECP256k1
G = curve.generator
n = curve.order

# Function to convert an elliptic curve point to a hashable value
def hash_point(point):
    return int(hashlib.sha256(point.x().to_bytes(32, 'big')).hexdigest(), 16)

# Algorithm 1
def algorithm1():
    c1 = random.randint(2, n - 1)
    M1 = c1 * G
    return c1, M1

# Algorithm 2
def algorithm2(a, b, h, e, c1, V):
    j = random.randint(0, 1)
    u = random.randint(0, 1)
    Z = a * c1 * G + b * c1 * V + h * j * G + e * u * V
    c2 = hash_point(Z)
    M2 = c2 * G
    print("This is c2", c2)
    return c2, M2

# Algorithm 3 (Attack)
def attack(a, b, h, e, M1, M2, V, v):
    Z1 = a * M1 + b * v * M1
    for j in range(2):
        for u in range(2):
            Z2 = Z1 + h * j * G + e * u * V
            c2 = hash_point(Z2)
            if c2 * G == M2:
                return c2_attempt
    return None

# Calls
c1, M1 = algorithm1()
v = random.randint(2, n - 1)
V = v * G
a, b, h, e = [random.randint(1, n - 1) for _ in range(4)]
c2, M2 = algorithm2(a, b, h, e, c1, V)
result = attack(a, b, h, e, M1, M2, V, v)
print("c2 found:", result)
