#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Tue Oct 31 2023

@autor: Luis Chinea Rangel
"""
import modules.functions as functions
from flask import Flask, render_template, request, jsonify, redirect

a = None
b = None
p = None
points = None
base_point = None

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
  global a, b
  a = request.get_json()['a']
  b = request.get_json()['b']
  return jsonify({'message': 'Curve generated'}), 200

@app.route('/calculate-points', methods=['POST'])
def calculate_points():
  global a, b, p, points
  p = request.get_json()['p']
  if not functions.check_prime(p):
    return jsonify({'error': 'Not a prime number'}), 400
  if a is None or b is None or p is None:
    return jsonify({'error': 'Curve not generated'}), 400
  points = functions.calculate_points((a, b), p)
  return jsonify({'message': 'Points calculated', 'points': points}), 200

@app.route('/base-point', methods=['POST'])
def generate_base_point():
  global points, base_point
  if points is None:
    return jsonify({'error': 'Curve not generated'}), 400
  x, y = request.get_json()['base_point'].split(',')
  x = int(x)
  y = int(y)
  base_point = (x, y)
  if (x, y) not in points:
    return jsonify({'error': 'Point not on the curve'}), 400
  return jsonify({'message': 'Base point set', 'points': points, 'base_point': base_point}), 200

@app.route('/generate-key', methods=['POST'])
def generate_key():
  global a, b, p, base_point
  private_key = int(request.get_json()['private_key'])
  if 'public_key' not in request.get_json():
    point = base_point
  else:
    public_key = request.get_json()['public_key'].replace('(', '').replace(')', '')
    x, y = int(public_key.split(',')[0]), int(public_key.split(',')[1])
    point = (x, y)
  if point is None:
    return jsonify({'error': 'Base point not set'}), 400
  steps = []
  for i in range(1, private_key + 1):
    if functions.multiply_point_by_scalar(point, i, (a, b), p) == (-1, -1):
      continue
    steps.append(functions.multiply_point_by_scalar(point, i, (a, b), p))
  key = functions.multiply_point_by_scalar(point, private_key, (a, b), p)
  if key == (-1, -1):
    key = 'O'
  return jsonify({'message': 'Key generated', 'key': key, 'steps': steps}), 200

@app.route('/encrypt', methods=['POST'])
def encrypt():
  global a, b, p, base_point
  message = request.get_json()['message']
  if request.get_json()['reverse'] == 'true':
    dA = int(request.get_json()['dB'])
    dB = int(request.get_json()['dA'])
  else:
    dA = int(request.get_json()['dA'])
    dB = int(request.get_json()['dB'])
  if base_point is None:
    return jsonify({'error': 'Base point not set'}), 400
  encoded_message, M, h = functions.encode(message, (a, b), p)
  encrypted_message, public_key = functions.encrypt(message, (a, b), p, base_point, dA, dB)
  return jsonify({'message': 'Message encoded', 'encoded_message': encoded_message, 'encrypted_message': encrypted_message, 'public_key': public_key}), 200

def start(host = 'localhost', port = 5000, debug = True, reloader = True):
  app.run(host=host, port=port, debug=debug, use_reloader=reloader)

if __name__ == '__main__':
  start()
