'use strict';
//app function, wraps the application and gets called after googleMaps API is loaded
function app(){

  //map variable declaration
  var map;

  //location class, stores info about a place
  var Location = function(name, lat, lng, rating, img){
    this.name = name;
    this.lat = lat;
    this.lng = lng;
    this.rating = rating;
    this.img = 'https://irs3.4sqi.net/img/general/150x100' + img;
    this.marker;
  };

  //initMap function, instantiates the map and appends it to the HTML document
  function initMap(){
    map = new google.maps.Map(document.getElementById('map'), {
      center: {
        lat: 45.520794,
        lng: -122.679565
      },
      scrollwheel: true,
      zoom: 15
    });
  }

  //knockout's viewModel object
  var ViewModel = function() {
    var self = this;

    //OBSERVABLES AND COMPUTED

    //search form's query, stores search form's input
    self.query = ko.observable('');
    //array of locations
    self.locations = ko.observableArray();
    //array of filtered locations
    self.filteredList = ko.computed(function() {
      var filter = self.query().toLowerCase();
      //if there's no query, return all of the locations
      if(!filter){
        return self.locations();
      }
      else{
        //else return locations that match the query
        return ko.utils.arrayFilter(self.locations(), function (item) {
          return item.name.toLowerCase().indexOf(filter) !== -1;
        });
      }
    });
    //subscription to update visible markers once a filter is applied
    self.filteredList.subscribe(function(newValue) {
      self.hideMarkers();
      self.infowindow.close();
      self.showMarkers();
    });
    //this observable stores the category value, selectable by clicking a button, set on automatic topPicks on load
    self.category = ko.observable('abc');
    //info window, content is added later on
    self.infowindow = new google.maps.InfoWindow({
      content: ''
    });
    //FourSquare API call, it's a computed function that gets called every time a different category is selected
    self.ajaxReq = ko.computed(function(){
      var CLIENT_ID = 'FXPVOMSAFOZUD1524IILXHISXJOZW03GOW21JW4JJTFXAPY0';
      var CLIENT_SECRET = 'KEBR0V3IBLQ025W0S3UVXZEBASVGXB5NDBR1KHG3WWWIHQI2';
      var category = self.category();
      var requestUrl = 'https://api.foursquare.com/v2/venues/explore?ll=' + 45.512794+ ',' + -122.679565 + '&venuePhotos=1' + '&section=' + category + '&radius= 10000' + '&client_id='+ CLIENT_ID + '&client_secret=' + CLIENT_SECRET + '&v=20151111';
      $.getJSON(requestUrl).done(function(data) {
        //hide markers, close infowindow and delete all current locations
        self.hideMarkers();
        self.infowindow.close();
        self.locations.removeAll();
        //iterate through response object and use data to create a location object
        for(var i= 0; i< 10; i++){
          var currentItem = data.response.groups[0].items[i];
          var currentLoc = new Location(
          currentItem.venue.name,
          currentItem.venue.location.lat,
          currentItem.venue.location.lng,
          currentItem.venue.rating,
          currentItem.venue.photos.groups[0].items[0].suffix);
          //add a marker and eventListener to the current Location object
          self.createMarker(currentLoc);
          //add the created object the the list
          self.locations.push(currentLoc);
          //error message in case API request fails
        }}).fail(function(){alert('ERROR: Couldn not connect to FourSquare API');});
      });

    //OPERATIONS

    //sets all the markers inside the filteredList to visible
    self.showMarkers= function(){
      var listSize = self.filteredList().length;
      for(var i= 0; i<listSize; i++){
        self.filteredList()[i].marker.setVisible(true);
      }
    };
    //sets all the markers inside the original list to not visible
    self.hideMarkers= function(){
      var listSize = self.locations().length;
      for(var i= 0; i<listSize; i++){
        self.locations()[i].marker.setVisible(false);
      }
    };
    //creates a marker and adds an eventListener
    self.createMarker = function(location){
      location.marker = new google.maps.Marker({
        position: {lat: location.lat, lng: location.lng},
        map: map,
        title: location.name,
        visible: true
      });
      //event Listener
      location.marker.addListener('click', function(){self.isSelected(location);});
    };
    //this function contains the event listener behaviour, it's used for both markers and the list elements (in the HTML document)
    self.isSelected = function(location) {
      //close infowindow, set his content, and open it again
      if (window.matchMedia("(max-width: 767px)").matches){
        $.sidr('close', 'sidr');
      }
      self.infowindow.close();
      self.infowindow.setContent('<strong>' + location.name + '</strong>' + '<br>' + 'Rating: ' + location.rating + '<br>' + '<img src="' + location.img + '">');
      self.infowindow.open(map, location.marker);
      //center the map
      map.setCenter({
        lat: location.lat,
        lng: location.lng
      });
      //start marker's bounce animation
      location.marker.setAnimation(google.maps.Animation.BOUNCE);
      //and stop if after a set amount of time
      setTimeout(function() {
        location.marker.setAnimation(false);
      }, 2050);
    };
  };

  //this function fires up the application
  function init() {
  //initMap first
  initMap();
  $(document).ready(function() {
  $('#simple-menu').sidr();
  if (window.matchMedia("(min-width: 767px)").matches){
    $.sidr('open', 'sidr');
  }
  });
  //then start knockout.js
  ko.applyBindings(new ViewModel());
  }

  //function call
  init();
}