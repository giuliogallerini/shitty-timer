'use strict';

var app = window.app;

app.CurrentUser = function(){

	// initializing the user based on the informations saved in the localStorage
	this.user = !!window.localStorage.user ? JSON.parse(window.localStorage.user) : {};
	this.keepUnknown =  !!window.localStorage.keepUnknown ? JSON.parse(window.localStorage.keepUnknown) : false;
	this.allowGeolocalization = !!window.localStorage.allowGeolocalization ? JSON.parse(window.localStorage.allowGeolocalization) : true;

	// checking if the position of the user has been already set before
	if(!!this.user.position){
		var initGoogleMaps = this._initMap.bind(this, {lat: this.user.position.latitude, lng: this.user.position.longitude}, 19); // initializing Google maps with the position saved of the user
		this._waitGoogle(initGoogleMaps) // wait Google Api connection
	}else{
		this._getLocation(); // asking geolocalization permissions and position
	}

	// starting CurrentUser
	this._initialize();
}

app.CurrentUser.prototype = {
	_initialize: function(){

		// save user details when exiting the page
		window.addEventListener('beforeunload', this._saveUser.bind(this));

		// check if first visit
		if(this._firstTime()){
			// ask for permissions
			this._askPermissions(function(username){
				this.user.username = username;
			}.bind(this));
		}else if (!this.keepUnknown && !this.user.username) { // is username empty and we have the permission to ask it?
			this._askUsername(function(username){
				this.user.username = username;
			}.bind(this));
		}
	},

	// get the coordinate of currentUser
	_getLocation: function() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(function(position){
				this.user.position = {};
				this.user.position.latitude =  position.coords.latitude;
				this.user.position.longitude = position.coords.longitude;
				this._initMap({lat: position.coords.latitude, lng: position.coords.longitude})
			}.bind(this));
    } else {
        console.warn('WARNING:', 'This browser doesn\'t support geolocation')
				this.allowGeolocalization = false;
    }
	},

	// return true if the user has never been registered
	_firstTime: function(){
		if(!this.user.username) return true

		return false
	},

	// ask permission interaction
	_askPermissions: function(callback){
		$(document).ready(function(){
			$('.speech-bubble h3').typed({
			    strings: ["Hey there!<br /> I haven't seen<br />you before", "Do you live here?"],
			    contentType: 'html', // or 'text'
					startDelay: 200,
					backDelay: 1500,
			});
		});
		$('#first-time-form').fadeIn();
		$('#first-time-form .permission').on('click', function(e){
			e.preventDefault();
			this.keepUnknown = $('#keep-unknown').get(0).checked;
			var permission = $(e.currentTarget).data('value') === 1;
			if(permission) return this._askUsername(callback);
			callback('Stranger');

			$('.speech-bubble h3').typed({
			    strings: ["Okay...", "My bad, see you!"],
			    contentType: 'html', // or 'text'
					backDelay: 500,
			});
			setTimeout(function () {
				$('#first-time-form').fadeOut();
			}, 2000);
		}.bind(this));
	},

	// ask username interaction with the user
	_askUsername: function(callback){
		$('#first-time-form .controls').fadeOut(400);
		$('.speech-bubble h3').typed({
		    strings: ["Me too!", "My mission is help you<br />during your stay here", "How should I call you?"],
		    contentType: 'html', // or 'text'
				backDelay: 1000,
		});
		$('#first-time-form .done').fadeIn();
		$('#username-form').fadeIn();
		$('.done').fadeIn();
		$('.done').on('click', function(e){
			e.preventDefault();
			var username = $('#username').val();
			$('#username-form').fadeOut();
			$('.done').fadeOut();
			$('.speech-bubble h3').typed({
			    strings: ["Welcome in the house "+username+"!"],
			    contentType: 'html', // or 'text'
			});
			callback(username);
		});
	},

	// save user information to localStorage
	_saveUser: function(){
		window.localStorage.user = JSON.stringify(this.user);
		window.localStorage.keepUnknown = this.keepUnknown;
		window.localStorage.allowGeolocalization = this.allowGeolocalization;
	},

	// wait for Google api to load
	_waitGoogle: function(callback){
		var waitForGoogle = setInterval(function () {
			if(!!google){
				callback();
				clearInterval(waitForGoogle);
			}
		}, 50);
	},

	// initialize Google maps for current position of user
	_initMap: function(center, zoom){
			var map = new google.maps.Map(document.getElementById('map'), {
				center: center,
				zoom: zoom,
				imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m'
			});
			var marker = new google.maps.Marker({
				position: center,
				draggable: true,
        animation: google.maps.Animation.DROP,
				icon: '../images/marker-house.png',
				map: map
			});
	},

	// reset current user in localStorage
	_reset: function(){
		window.removeEventListener('beforeunload', this._saveUser.bind(this));
	}
}