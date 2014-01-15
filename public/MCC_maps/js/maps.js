App.module('Maps', function(Maps, App, Backbone, Marionette, $, _){


	var MapView = Marionette.ItemView.extend({

		initialize: function(){
			this.createMap();

			this.listenTo(App.vent, 'year:change', this.updateMap);
			this.listenTo(App.vent, 'zoom:monde', this.unZoom);
			this.listenTo(App.vent, 'zoom:afrique', this.zoomAfrique);
			this.listenTo(App.vent, 'zoom:france', this.zoomFrance);

			this.updateMap();
		},

		createMap: function(){

			var width = 700,
			    height = 500;

			this.zoomFactor = 1;
			this.translateLeft = 0;
			this.translateUp = 0;

			// définir la projection et le path generator pour la carte
			this.projection = d3.geo.kavrayskiy7()
			.scale(200)
			.translate([width / 2-100, height / 2+40]);

			this.pathGenerator = d3.geo.path().projection(this.projection);
			
			// décoder le topojson en geojson
			var geojsonWorld = topojson.object(worldTopoJSON, worldTopoJSON.objects.countries).geometries;

			// créer le svg
			this.svg = d3.select("#map").append("svg")
			    .attr("width", width)
			    .attr("height", height);

		    this.g = this.svg.append('g');

			// tracer les pays, avec la classe MCC si applicable
		    this.countries = this.g.selectAll(".country") 
		    .data(geojsonWorld)
		    .enter().append("path")
		    .attr("class", function(country) { 
		      var classes = "country " + country.id;
		      if (countries[country.id] ){
		      	classes += " mcc";
		      }
		      return classes; 
		    })
		    .attr("d", this.pathGenerator)
			.style("stroke-width", 0.6);

		    // créer un sous-ensemble de geojsonWorld pour efficiency
		    this.geojsonMcc = geojsonWorld
		    .filter(function(country){
		    	var isMcc = false;
		    	_(countries).each(function(v, k){
		    	  if (country.id == k) {
		    	    isMcc = true;
		    	   };
		    	})
		    	return isMcc;
		    })
		},

		zoomFrance: function(){
			this.zoomFactor = 14;
			this.translateLeft = -3230;
			this.translateUp = -1530;

			var transformation = "translate(" + this.translateLeft + "," + this.translateUp + ")scale(" + this.zoomFactor + ")";

			this.g.transition()
			    .duration(1000)
			    .attr("transform", transformation);

			this.g.selectAll('.country').transition()
			    .duration(1000).style("stroke-width", 0.1);
		},

		zoomAfrique: function(){
			this.zoomFactor = 2.2;
			this.translateLeft = -280;
			this.translateUp = -330;

			var transformation = "translate(" + this.translateLeft + "," + this.translateUp + ")scale(" + this.zoomFactor + ")";

			this.g.transition()
			    .duration(1000)
			    .attr("transform", transformation);
			    // .style("stroke-width", 0.1);	
			
			this.g.selectAll('.country').transition()
			    .duration(1000)
			    .style("stroke-width", 0.2);	
			// this.updatePays();
			// var year = App.controls.year;
		    
		 //    var rScale_zoom_Afrique = d3.scale.linear()
		 //      .domain([0, 1, 50])
		 //      .rangeRound([0, 5, 20]);

			// var new_circle = this.g.selectAll(".symbol")
			// .data(data[year]['countries'], function(c){return c['id']})
			// .transition(1000)
			// .delay(500)
			// .attr("r", function(d) { return rScale_zoom_Afrique(d['enfants']) || 0 ;});
		},

		unZoom: function(){
			this.zoomFactor = 1;
			this.translateLeft = 0;
			this.translateUp = 0;

			this.g.transition()
			    .duration(1000)
			    .attr("transform", "translate(1)scale(" + this.zoomFactor + ")");

			this.g.selectAll('.country').transition()
			    .duration(1000)
			    .style("stroke-width", 0.6);


		},

		updateMap: function(){
			this.updateSites();
			this.updatePays();
		},



		updatePays: function(){
			// échelle pour le rayon des cercles
			var year = App.controls.year;
			this.pays_rScale = d3.scale.linear()
			  .domain([0, 1, 40])
			  .rangeRound([0, 6, 35]);
			  // .rangeRound([0, Math.round(6 / this.zoomFactor), Math.round(45 / this.zoomFactor)]);

			var that = this;
			var updated = this.g.selectAll(".symbol")
			.data(data[year]['countries'], function(c){return c['id']});

			updated.enter().append("svg:circle")
			.attr("class", "symbol")
			.attr("cx", function(d) { 
				var this_country = _(that.geojsonMcc).findWhere({'id': parseInt(d.id)}) ;
				var center = Math.round(that.pathGenerator.centroid(this_country)[0]);
			  	return center;
			  })
			.attr("cy", function(d) { 
				var this_country = _(that.geojsonMcc).findWhere({'id': parseInt(d.id)}) 
				var center = Math.round(that.pathGenerator.centroid(this_country)[1]);
			  	return center;
			  })
			.on("mouseover", this.hoverPays)
			.on("mouseout", function(){
			  $('.pays_popup').remove();
			})
			.on('click', this.displayCountryInfo);

			updated.exit().transition()
			.duration(800)
			.attr("r", 0)
			.remove();
			
			updated.transition()
			.duration(1000)
			.attr("r", function(d) { return that.pays_rScale(d['enfants']) || 0 ;});

		},


		updateSites: function(){
			var that = this;
			var year = App.controls.year;
			// échelle pour le rayon des cercles
			var France_rScale = d3.scale.linear()
			  .domain([0, 1, 50])
			  .rangeRound([0, 2, 3]);

			var France_rScale_zoom = d3.scale.linear()
			  .domain([0, 1, 90])
			  .rangeRound([0, 5, 16]);

			var updated = this.g.selectAll(".symbol_france")
			.data(data[year]['sites'], function(c){return c['ville']});

			updated.enter().append("svg:circle")
			.attr("class", "symbol_france")
			.attr("cx", function(d) { 
				var coord = that.projection([+sites[d.ville].lng, sites[d.ville].lat])
			  	return Math.round(coord[0]);
			  })
			.attr("cy", function(d) { 
				var coord = that.projection([+sites[d.ville].lng, sites[d.ville].lat])
			  	return Math.round(coord[1]);
			  	return center;
			  })
			.on("mouseover", this.hoverSite)
			.on("mouseout", function(){
			  $('.site_popup').remove();
			})
			.on('click', this.displayCountryInfo);

			updated.exit().transition()
			.duration(800)
			.attr("r", 0)
			.remove();
			
			updated.transition()
			.duration(1000)
			.attr("r", function(d) { return France_rScale(d['enfants']) || 0 ;});
		},

		hoverPays: function (d){   //le datum est passé en d
			view = App.Maps.controller.mapView;

			var $tooltip = $("<div class='pays_popup'></div>");
			$tooltip.html("<b>" + countries[d.id].name + "</b><br />" + d.enfants + " enfants");

			var x = parseInt( $(this).attr("cx") * view.zoomFactor + view.translateLeft + 25);
			var y = parseInt( $(this).attr("cy") * view.zoomFactor + view.translateUp - 25);
			$tooltip.css("left", x + "px");
			$tooltip.css("top", y + "px");

			$('#map').append($tooltip);
		},

		hoverSite: function (d){   //le datum est passé en d

			view = App.Maps.controller.mapView;

			var $tooltip = $("<div class='site_popup'></div>");
			$tooltip.html("<b>" + d.ville + "</b><br />" + d.enfants + " enfants");

			var x = parseInt( $(this).attr("cx") * view.zoomFactor + view.translateLeft + 25);
			var y = parseInt( $(this).attr("cy") * view.zoomFactor + view.translateUp - 25);
			$tooltip.css("left", x + "px");
			$tooltip.css("top", y + "px");

			$('#map').append($tooltip);
		},

		displayCountryInfo: function (datum){
			console.log('display info for ' + datum.id);
			var country = new Country(datum);
			App.info.show(new CountryInfoBoxView({model: country}));

		},

		ui: {

		},

		events: {


		},



	});

	
	var Country = Backbone.Model.extend({
		initialize: function(datum){
			this.set(datum);
			this.set({
				name: countries[datum.id].name,
				flag_url: countries[datum.id].flag_url,
				capitale: countries[datum.id].capitale,
				langues: countries[datum.id].langues,
				population_2011: countries[datum.id].population_2011,
				total: countries[datum.id].total,
			})
		},
	
	});

	var CountryInfoBoxView = Marionette.ItemView.extend({
		initialize: function(){
			// console.log(this.model);
		},

		template: '#info-template',

	});



    var Controller = Marionette.Controller.extend({

        initialize: function(options){
            this.region = options.region
        },

        show: function(){
            this.mapView = new MapView();
            //this.region.show(franceMapView);
        }

    });

    Maps.addInitializer(function(){
	    Maps.controller = new Controller({
	        region: App.map
	    });
	    Maps.controller.show();
	});
});