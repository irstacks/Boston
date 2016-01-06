home = {};
home.map = function (container, width, height) {
	this.scale = 200000;
	this.translate = [width / 2, height / 2];
	this.refCenter = [.45, .4];
	this.translate = [width * this.refCenter [0], height * this.refCenter [1]]; 
	this.center = 0;
	this.width = width;
	this.height = height;
	this.container = container;
	this.topology = {};
	this.features = {};
	this.rateById = d3.map ();
	this.svg = d3.select (container).append ("svg").attr ("width", width).attr ("height", height); 
	this.quantize = d3.scale.quantize ().domain ([0, 1000]).range (d3.range (9).map (function (i) { return "q" + i + "-9"}));
	this.topologies = {};
	this.projection = d3.geo.mercator ();
	this.redraw = function (topo, quantifier) {
		if (!topo) {
			for (t in this.topologies) {
				this.redraw (t, quantifier);
			}
			return;
		}
		this.topologies[topo].redraw (quantifier);
	}
	this.setScaleAndCenter = function (s, c) {
		this.scale = s;
		this.center = c;
		this.redraw ();
	}
	this.setScale = function (s) {
		this.scale = s;
		this.redraw ();
	}
	this.setCenter = function (c) {
		this.center = c;
		this.redraw ();
	}
	this.getPath = function () {
		this.projection
			.scale(this.scale)
			.rotate ([-this.center.lon, 0])
			.center ([0, this.center.lat])
			.translate (this.translate);

		return d3.geo.path ().projection (this.projection);
	}
	this.getArc = function () {
		return d3.geo.greatArc().precision(3);
	}
	this.lineConnectElements = function (elmA, elmB) {
		var path = this.getPath ();
		var arc = this.getArc ();
		var a = d3.select(elmA);

		var centroidA = path.centroid (a.datum ());
		var b = d3.select (elmB);
		var centroidB = path.centroid (b.datum ())
		var links = [];

		links.push ({"source": path.projection().invert (centroidA), "target": path.projection ().invert (centroidB)});
		var layer = this.svg.append ("g").attr ("class", "lineLayer");
		layer.append ("path")
			.data (links)
			.attr ("d", function (x) { return path(arc (x)); })
			.attr ("vector-effect", "non-scaling-stroke")
			.style ({'stroke-width': 1, 'stroke': '#B10000', 'stroke-linejoin': 'round', 'fill': 'none'})
	}
	this.zoomTo = function (selector, context) {
		if (!context) context = 20;
		var e = d3.select (selector);
		var path = this.getPath ();
		var width = this.width;
		var height = this.height;
		var bounds = path.bounds(e.datum ()),
			dx = bounds[1][0] - bounds[0][0],
			dy = bounds[1][1] - bounds[0][1],
			x = (bounds[0][0] + bounds[1][0]) / 2,
			y = (bounds[0][1] + bounds[1][1]) / 2,
			scale = (context / 100) / Math.max(dx / width, dy / height),
			translate = [width * this.refCenter [0] - scale * x, height * this.refCenter [1] - scale * y];

		this.svg
			.selectAll ("path")
			.transition ()
			.duration (350)
			.attr ("transform", "translate(" + translate + ")scale(" + scale + ")");

		this.svg
			.selectAll ("text")
			//.attr ("x", function (d) { return path.centroid (d)[0]; })
			//.attr ("y", function (d) { return path.centroid (d)[1]; })
			.attr ("transform", "translate(" + translate + ")scale(" + scale + ")")
	}
	this.addFeatures = function (topo, collection, key, quantifier) {
		if (collection && collection.objects) {
			var features = collection.objects [key];
			if (features) {
				this.topologies [topo] = new home.map.topology (this.svg, topo, this.getPath (), collection, features);
				this.svg.append ("g")
					.attr ("class", topo);
				this.redraw (topo, quantifier);

				return this.topologies [topo];
			} else {
				throw "No Features found: (" + topo + ")" + key;
			}
		} else {
			throw "Empty features colletions? " + topo;
		}
	}

	d3.select (container).style ("height", height + "px").style ("width", width + "px");
};
home.map.topology = function (cont, name, path, t, f) {
	this.container = cont;
	this.name = name;
	this.topology = t;
	this.features = f;
	this.quantize = d3.scale.quantize ().domain ([0, 100]).range (d3.range (9).map (function (i) { return "q" + i + "-9"}));
	this.path = path;
	this.redraw = function (setId, quantifier, labeler) {
		var path = this.path;
		var qn = quantifier ? $.proxy (function (a) { return quantifier.fn.apply (quantifier.context, [a, quantifier.args]) }, quantifier) : null;
		this.container.select ("g." + this.name).selectAll ("path")
			.data (topojson.feature (this.topology, this.features).features)
			.attr ("d", function (x) { return path (x); })
			.attr ("class", qn)
			.attr ("id", setId)
			.enter ()
			.append ("path")
			.on ("click", this.createCallback (this._click))
			.on ("mouseover", this.createCallback (this._mouseover))
			.on ("mouseout", this.createCallback (this._mouseout));
		/*
		if (labeler) {	
			this.container.select ("g." + this.name).selectAll ("text")
				.data (topojson.feature (this.topology, this.features).features)
				.text ($.proxy (labeler.fn, labeler.context, labeler.ar))
				.attr ("x", function (d) { return path.centroid (d)[0]; })
				.attr ("y", function (d) { return path.centroid (d)[1]; })
				.attr ("class", "label")
				.enter ()
				.append ("svg:text")
				.attr ("x", function (d) { return path.centroid (d)[0]; })
				.attr ("y", function (d) { return path.centroid (d)[1]; })
				.attr ("class", "label")
				.text (labeler)
		} else {
			this.container.select ("g." + this.name).selectAll ("text").attr ("class", "");
		}
		*/
	}
	this.createCallback = function (cb) {
		var me = this;
		return function () {
			cb (me, this);
		};
	}
	this.callbacks = {};
	this.on = function (ev, cb) {
		if (!this.callbacks [ev]) {
			this.callbacks [ev] = [];
		}
		this.callbacks [ev][this.callbacks[ev].length] = cb;	
	}
	this.callbacksFor = function (ev, scope, element) {
		if (!this.callbacks [ev]) return;
		for (cb in this.callbacks [ev]) {
			if (cb) { 
				this.callbacks [ev][cb] (scope, element);	
			}
		}
	}
	this._click = function (me, caller) {
		me.callbacksFor ("click", me, caller);
	}
	this._mouseover = function (me, caller) {
		me.callbacksFor ("mouseover", me, caller);
	}
	this._mouseout = function (me, caller) {
		me.callbacksFor ("mouseout", me, caller);
	}
}