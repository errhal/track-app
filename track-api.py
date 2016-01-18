# -*- coding: utf-8 -*-
from flask import Flask, render_template, request, redirect, session, jsonify
from flask.ext.pymongo import PyMongo
from uuid import uuid4

import pprint, json, random, bson.json_util
import Queue as Q
from bson import Binary, Code

app_url = ''
app = Flask(__name__)
app.secret_key = 'FF6XaS84h68MQ36j6LaHw0SQ3r8qY2YG'

from werkzeug.debug import DebuggedApplication
app.debug = True
app.wsgi_app = DebuggedApplication(app.wsgi_app, True)

app.config['MONGO_HOST'] = 'ds047355.mongolab.com'
app.config['MONGO_PORT'] = '47355'
app.config['MONGO_DBNAME'] = 'track-app'
app.config['MONGO_USERNAME'] = 'admin'
app.config['MONGO_PASSWORD'] = 'password'
mongo = PyMongo(app)

@app.route(app_url + '/' , methods = ['GET'])
def index():
	return render_template('index.html')

@app.route(app_url + '/api/cities', methods = ['GET','POST','PUT','DELETE'])
def cities():
	if request.method == 'GET':
		return bson.json_util.dumps(mongo.db.cities.find())
	elif request.method == 'POST':
		req = bson.json_util.loads(request.get_data())
		name = req['name']
		longitude = req['longitude']
		latitude = req['latitude']
		if name and longitude and latitude:
			mongo.db.cities.insert({"name": name, "latitude": latitude, "longitude": longitude})
			return "200"
		else:
			return "400"
	elif request.method == 'PUT':
		req = request.get_data()
		req = bson.json_util.loads(req)
		mongo.db.cities.update_one({"_id": req['_id']},{'$set': {'latitude': req['lat'], 'longitude': req['lng']}})
		return 200
	elif request.method == 'DELETE':
		req = request.get_data()
		req = bson.json_util.loads(req)
		mongo.db.cities.remove({"_id":req['_id']})
		mongo.routes.remove({"destination": req['_id']})
		mongo.routes.remove({"source": req['_id']})
		return "200"

@app.route(app_url + '/api/routes', methods = ['GET','POST','PUT','DELETE'])
def routes():
	if request.method == 'GET':
		return bson.json_util.dumps(mongo.db.routes.find())
	elif request.method == "POST":
		req = bson.json_util.loads(request.get_data())
		if req['destination'] and req['distance'].isdigit() and req['source']:
			mongo.db.routes.insert({"source": req['source'], "destination": req['destination'], "distance": req['distance']})
			return "200"
		else:
			return "400"
	elif request.method == "DELETE":
		req = bson.json_util.loads(request.get_data())
		mongo.db.routes.remove({'_id': req['_id']})
		return "200"
	elif request.method == "PUT":
		req = bson.json_util.loads(request.get_data())
		mongo.db.routes.update_one({'_id': req['_id'] },{'$set':{'distance': req['distance']}})


@app.route(app_url + '/api/tracks', methods = ['GET','POST','PUT','DELETE'])
def tracks():
	if request.method == "GET":
		return bson.json_util.dumps(mongo.db.tracks.find())
	elif request.method == "POST":
		req = bson.json_util.loads(request.get_data())
		if "from" not in req or "to" not in req or req["from"]=="" or req["to"] == "":
			return "Wrong cities",400
		src = req['from']
		des = req['to']
		nodes = {}
		odl = {}
		poprzednik = {}
		q = Q.PriorityQueue()
		for i in mongo.db.cities.find():
			nodes.update({i['_id']: []})
			if i['_id'] != src:
				odl[i['_id']] = 110000000
				q.put((odl[i['_id']] , i['_id']))
			else:
				odl[i['_id']] = 0
				q.put((odl[i['_id']] , i['_id']))
		for i in mongo.db.routes.find():
			nodes[i['source']].append({i['destination']: i['distance']})
			#nodes[i['destination']].append({i['source']: i['distance']})
		while not q.empty():
			el = q.get()
			for x in nodes[el[1]]:
				if odl[x.keys()[0]] >  odl[el[1]] + int(x.values()[0]):
					poprzednik[x.keys()[0]] = el[1]
					odl[x.keys()[0]] = odl[el[1]] + int(x.values()[0])
					q.put((odl[x.keys()[0]] , x.keys()[0]))
		path = []
		back = des
		while 1:
			if back in poprzednik:
				if poprzednik[back] == src:
					break
				c = mongo.db.cities.find({"_id": poprzednik[back]})
				path.append(c)
				back = poprzednik[back]
			else:
				 break
		path.append(odl[des])
		return bson.json_util.dumps(path)
if __name__ == '__main__':
	app.run(host='localhost')
