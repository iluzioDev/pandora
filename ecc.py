#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Tue Oct 31 2023

@autor: Luis Chinea Rangel
"""
from flask import Flask, render_template, request, jsonify, redirect
from src.point import Point
from src.curve import Curve

ec = None
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

@app.route('/curve', methods=['POST'])
def generate_curve():
  global ec
  ec = Curve(int(request.get_json()['a']), int(request.get_json()['b']), True)
  return jsonify({'message': 'Curve generated'}), 200

@app.route('/points', methods=['POST'])
def calculate_points():
  global ec
  try:
    ec.p = int(request.get_json()['p'])
  except ValueError as e:
    return jsonify({'error': str(e)}), 400
  return jsonify({'message': 'Points calculated', 'points': [point.toJSON() for point in ec.points]}), 200

@app.route('/base', methods=['POST'])
def generate_base():
  global ec
  if ec.points is None:
    return jsonify({'error': 'Points not calculated'}), 400
  try:
    base = Point(ec.a, ec.p, *map(int, request.get_json()['base'][1:-1].split(',')))
    if base not in ec.points:
      raise ValueError('Point not on the ec')
    ec.base = base
  except ValueError as e:
    return jsonify({'error': str(e)}), 400
  return jsonify({'message': 'Base point set', 'points': [point.toJSON() for point in ec.points], 'base': ec.base.toJSON()}), 200

@app.route('/public', methods=['POST'])
def generate_public():
  global ec
  dx = int(request.get_json()['dx'])
  id = request.get_json()['id']
  if ec.base is None:
    return jsonify({'error': 'Base point not set'}), 400
  dxG = ec.base * dx
  if not dxG.at_infinity():
    ec.insert_key(id, dxG)
  else:
    return jsonify({'message': 'Invalid private key'}), 200
  return jsonify({'message': 'Public key generated', 'dxG': dxG.toJSON(), 'steps': [point.toJSON() for point in ec.steps(ec.base, dx)]}), 200

@app.route('/shared', methods=['POST'])
def generate_shared():
  global ec
  if request.get_json()['dyG'] == '(O)':
    return jsonify({'error': 'Public key of the other party not set'}), 400
  dyG = Point(ec.a, ec.p, *map(int, request.get_json()['dyG'].strip('()').split(',')))
  dx = int(request.get_json()['dx'])
  shared = dyG * dx
  if not shared.at_infinity():
    ec.insert_key('shared', shared)
  else:
    return jsonify({'message': 'Invalid shared key'}), 200
  return jsonify({'message': 'Shared key generated', 'shared': shared.toJSON(), 'steps': [point.toJSON() for point in ec.steps(dyG, dx)]}), 200

@app.route('/encrypt', methods=['POST'])
def encrypt():
  global ec
  ec.alphabet = request.get_json()['alphabet']
  message = request.get_json()['message']
  dx = int(request.get_json()['dx'])
  dyG = '(O)' if request.get_json()['dyG'] == '(O)' else Point(ec.a, ec.p, *map(int, request.get_json()['dyG'][1:-1].split(',')))
  try:
    encoded = ec.encode(message)
    encrypted = ec.encrypt(message, dx, dyG)
    return jsonify({'message': 'Message encrypted', 'encoded': [point.toJSON() for point in encoded], 'encrypted': [(point[0].toJSON(), point[1].toJSON()) for point in encrypted]}), 200
  except ValueError as e:
    return jsonify({'error': str(e)}), 400

def start(host = 'localhost', port = 5000, debug = True, reloader = True):
  app.run(host=host, port=port, debug=debug, use_reloader=reloader)

if __name__ == '__main__':
  start()
