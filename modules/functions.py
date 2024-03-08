#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Tue Apr 24 2023

@autor: Luis Chinea Rangel
"""
ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
def nearest_power_of_2(n):
  """
  Calculate the nearest power of 2 greater than n.

  Args:
    n (int): Number.

  Returns:
    int: Nearest power of 2 greater than n.
  """
  power = 1
  while power < n:
    power *= 2
  return power

def PolligHellman(curve, p, P, G):
  zList = []
  conjList = []
  rootList = []
  #n = P.order()
  #factorList = n.factor()
  # for facTuple in factorList:
  #   p0 =
