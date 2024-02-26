#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Tue Oct 31 2023

@autor: Luis Chinea Rangel
"""
import modules.functions as func
from modules.curve import CurveParams
from flask import Flask, render_template, request, jsonify, redirect

ce = CurveParams()

app = Flask(__name__, static_folder='static', static_url_path='/static')
app.template_folder = 'templates'

@app.route('/', methods=['GET'])
def root():
  return render_template('index.html')

@app.route('/redirect/<website>', methods=['GET'])
def redirect_to(website):
  return redirect("http://" + website)

@app.route('/about', methods=['GET'])
def about():
  return render_template('about.html')

@app.route('/generate-curve', methods=['POST'])
def generate_curve():
  ce.set_a(request.get_json()['a'])
  ce.set_b(request.get_json()['b'])

  return jsonify({'message': 'Curve generated'}), 200

@app.route('/calculate-points', methods=['POST'])
def calculate_points():
  ce.set_p(request.get_json()['p'])
  if not func.check_prime(ce.p):
    return jsonify({'error': 'Not a prime number'}), 400
  if not ce.params_set():
    return jsonify({'error': 'Curve not generated'}), 400
  ce.calculate_points()
  return jsonify({'message': 'Points calculated', 'points': ce.points}), 200

@app.route('/base-point', methods=['POST'])
def generate_base_point():
  if ce.points is None:
    return jsonify({'error': 'Curve not generated'}), 400
  x, y = request.get_json()['base_point'].split(',')
  x = int(x)
  y = int(y)
  if (x, y) not in ce.points:
    return jsonify({'error': 'Point not on the ce'}), 400
  ce.set_base_point((x, y))
  return jsonify({'message': 'Base point set', 'points': ce.points, 'base_point': ce.base_point}), 200

@app.route('/generate-key', methods=['POST'])
def generate_key():
  private_key = int(request.get_json()['private_key'])
  if 'public_key' not in request.get_json():
    point = ce.base_point
  else:
    public_key = request.get_json()['public_key'].replace('(', '').replace(')', '')
    x, y = int(public_key.split(',')[0]), int(public_key.split(',')[1])
    point = (x, y)
  if point is None:
    return jsonify({'error': 'Base point not set'}), 400
  steps = []
  for i in range(1, private_key + 1):
    if func.multiply_scalar(point, i, (ce.a, ce.b), ce.p) == (-1, -1):
      continue
    steps.append(func.multiply_scalar(point, i, (ce.a, ce.b), ce.p))
  key = func.multiply_scalar(point, private_key, (ce.a, ce.b), ce.p)
  if key == (-1, -1):
    key = 'O'
  return jsonify({'message': 'Key generated', 'key': key, 'steps': steps}), 200

@app.route('/encrypt', methods=['POST'])
def encrypt():
  alphabet = request.get_json()['alphabet']
  message = request.get_json()['message']
  if request.get_json()['reverse'] == 'true':
    dA = int(request.get_json()['dB'])
    dB = int(request.get_json()['dA'])
  else:
    dA = int(request.get_json()['dA'])
    dB = int(request.get_json()['dB'])
  if ce.base_point is None:
    return jsonify({'error': 'Base point not set'}), 400

  encoded = []
  for char in message:
    if char not in alphabet:
      return jsonify({'error': 'Character not in alphabet'}), 400
    char_i = alphabet.index(char)
    encoded.append(func.encode(str(char_i), (ce.a, ce.b), ce.p, len(alphabet))[0])

  encrypted = []
  for char in message:
    encrypted.append(func.encrypt(str(char), (ce.a, ce.b), ce.p, ce.base_point, dA, dB, alphabet)[0])
  return jsonify({'message': 'Message encrypted', 'encoded': encoded, 'encrypted': encrypted}), 200

def start(host = 'localhost', port = 5000, debug = True, reloader = True):
  app.run(host=host, port=port, debug=debug, use_reloader=reloader)

if __name__ == '__main__':
  start()
