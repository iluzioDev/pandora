#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Sun Feb 25 2024

@autor: Luis Chinea Rangel
"""
import modules.functions as functions

class CurveParams:
  def __init__(self):
    self.a = None
    self.b = None
    self.p = None
    self.points = None
    self.base_point = None

  def set_a(self, a):
    self.a = a

  def set_b(self, b):
    self.b = b

  def set_p(self, p):
    self.p = p

  def set_base_point(self, base_point):
    self.base_point = base_point

  def params_set(self):
    return self.a is not None and self.b is not None and self.p is not None

  def calculate_points(self):
    self.points = functions.calculate_points((self.a, self.b), self.p)
