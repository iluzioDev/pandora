#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Tue Oct 31 2023

@autor: Luis Chinea Rangel
"""
from modules.curve import Curve
from flask import Flask, render_template, request, jsonify, redirect

ce = None
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
  global ce
  ce = Curve(int(request.get_json()['a']), int(request.get_json()['b']))
  return jsonify({'message': 'Curve generated'}), 200

@app.route('/points', methods=['POST'])
def calculate_points():
  global ce
  try:
    ce.p = int(request.get_json()['p'])
  except ValueError as e:
    return jsonify({'error': str(e)}), 400
  return jsonify({'message': 'Points calculated', 'points': ce.points}), 200

@app.route('/base', methods=['POST'])
def generate_base():
  global ce
  if ce.points is None:
    return jsonify({'error': 'Points not calculated'}), 400
  x, y = map(int, request.get_json()['base'].split(','))
  if (x, y) not in ce.points:
    return jsonify({'error': 'Point not on the ce'}), 400
  try:
    ce.base = (x, y)
  except ValueError as e:
    return jsonify({'error': str(e)}), 400
  return jsonify({'message': 'Base point set', 'points': ce.points, 'base': ce.base}), 200

@app.route('/public', methods=['POST'])
def generate_public():
  global ce
  dx = int(request.get_json()['dx'])
  id = request.get_json()['id']
  if ce.base is None:
    return jsonify({'error': 'Base point not set'}), 400
  dxG = 'O' if ce.mult(ce.base, dx) == (-1, -1) else ce.mult(ce.base, dx)
  if dxG != 'O':
    ce.insert_key(id, dxG)
  return jsonify({'message': 'Public key generated', 'dxG': dxG, 'steps': ce.steps(ce.base, dx)}), 200

@app.route('/shared', methods=['POST'])
def generate_shared():
  global ce
  dyG = 'O' if request.get_json()['dyG'] == 'O' else tuple(map(int, request.get_json()['dyG'].strip('()').split(',')))
  if dyG == 'O':
    return jsonify({'error': 'Public key of the other party not set'}), 400
  dx = int(request.get_json()['dx'])
  shared = 'O' if ce.mult(dyG, dx) == (-1, -1) else ce.mult(dyG, dx)
  if shared != 'O':
    ce.insert_key('shared', shared)
  return jsonify({'message': 'Shared key generated', 'shared': shared, 'steps': ce.steps(dyG, dx)}), 200

@app.route('/encrypt', methods=['POST'])
def encrypt():
  global ce
  ce.alphabet = request.get_json()['alphabet']
  message = request.get_json()['message']
  dx = int(request.get_json()['dx'])
  dyG = 'O' if request.get_json()['dyG'] == 'O' else tuple(map(int, request.get_json()['dyG'].strip('()').split(',')))
  try:
    encoded = ce.encode(message)
    encrypted = ce.encrypt(message, dx, dyG)
    return jsonify({'message': 'Message encrypted', 'encoded': encoded, 'encrypted': encrypted}), 200
  except ValueError as e:
    return jsonify({'error': str(e)}), 400

def start(host = 'localhost', port = 5000, debug = True, reloader = True):
  app.run(host=host, port=port, debug=debug, use_reloader=reloader)

if __name__ == '__main__':
  start()
