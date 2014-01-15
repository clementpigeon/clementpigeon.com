var App = new Marionette.Application();

App.addRegions({
    "controls": "#controls",
    "map": "#map",
    "info": "#info"
});

App.module('Controls', function(Controls, App, Backbone, Marionette, $, _){

	var ControlsView = Marionette.ItemView.extend({
		template: '#template-controls',
		
		ui: {

		},

		onRender: function(){
			App.controls.year = 1996;
			this.selectedYear();
			this.$('.type_select #monde').addClass('selected');
			this.play();
		},

		selectedYear: function(){
			this.$('.year_select li')
			.removeClass('selected')
			.filter(function(i, el){
				return ($(el).attr('id') == App.controls.year);
			})
			.addClass('selected')
		},

		events: {
			'click .play': 'play',
			'click .pause': 'pause',

			'click .year_select li': 'clickYear',

			'click .type_select li': 'zoomSelect',

			'click .more_symbols .enfants': 'toggleEnfants',
			'click .more_symbols .missions': 'toggleMissions',
			'click .more_symbols .formations': 'toggleFormations',
		},

		clickYear: function(event){
			App.controls.year = $(event.currentTarget).html();
			App.vent.trigger('year:change');
			this.selectedYear();
			if (this.playInterval) {
				clearInterval(this.playInterval);
				this.play();
			}
		},

		play: function(event){
			var that = this;
			this.playInterval = setInterval(function(){
				App.controls.year++;
				if (App.controls.year > 2013) App.controls.year = 1996;
				App.vent.trigger('year:change');
				setTimeout(function(){that.selectedYear()}, 400);		
			}, 3000);
			this.$('.play_pause .pause').removeClass('selected');
			this.$('.play_pause .play').addClass('selected');
		},

		pause: function(event){
			this.$('.play_pause .play').removeClass('selected');
			this.$('.play_pause .pause').addClass('selected');
			if (this.playInterval) clearInterval(this.playInterval);
		},

		zoomSelect: function(event){
			this.$('.type_select li').removeClass('selected');
			this.$(event.currentTarget).addClass('selected');
			var zoomSelection = $(event.currentTarget).attr('id')
			App.vent.trigger('zoom:' + zoomSelection);
		},

		toggleMissions: function(event){
			var missionsState = event.currentTarget.checked;
			console.log('display Missions: ' + missionsState);
		},

		toggleFormations: function(event){
			var formationsState = event.currentTarget.checked;
			console.log('display Missions: ' + formationsState);
		},

		toggleEnfants: function(event){
			var enfantsState = event.currentTarget.checked;
			console.log('display Enfants: ' + enfantsState);
		},
	});



    var Controller = Marionette.Controller.extend({

        initialize: function(options){
            this.region = options.region;
        },

        show: function(){
            var controlsView = new ControlsView({});
            this.region.show(controlsView);
        }
    });

    Controls.addInitializer(function(){
	    Controls.controller = new Controller({
	        region: App.controls
	    });
	    Controls.controller.show();
	});
});




App.module('Main', function(Main, App, Backbone, Marionette, $, _){

	Main.Controller = function(){
		// load data
		this.year = 1996;
	};

	_.extend(Main.Controller.prototype, {
		//start the app by showing the appropriate views
		start: function(){
			// this.showControls();
			// this.showMap(data);
		},

		// showControls: function(){
		// 	var controlsView = new ControlsView();
		// 	App.controls.show(controlsView);
		// },

		// showMap: function(data){
		// 	var mapView = new mapView();
		// 	App.controls.show(mapView);
		// },

		// showCountryInfo: function(country){
		// 	App.main.show(new TodoList.Views.ListView({
		// 		model: country
		// 	}))
		// },

	});

	// TodoList initializer
	// get the todolist up and running by initializing the mediator
	// when the app is started, pulling in existing todos and displaying them

	Main.addInitializer(function(){
		this.controller = new Main.Controller();
		this.controller.start();
	})

});


