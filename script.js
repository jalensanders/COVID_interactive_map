mapboxgl.accessToken = 'pk.eyJ1IjoiamFsZW5zYW5kZXJzIiwiYSI6ImNsa2MwM3BjbjBpenczZXFuMWd6ZXlwemcifQ.-RiPZQAAt-8T776u-veXJw'; // Replace with your Mapbox access token

// Initialize the map
var map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/light-v10',
  center: [-120.4473, 47.4009], // Centered on Washington State
  zoom: 6 // Adjust the zoom level as needed
});

// Load the GeoJSON data
fetch('assets/wa-covid-data-102521.geojson')
  .then(function (response) {
    return response.json();
  })
  .then(function (data) {
    // Set the GeoJSON data as the source for the map
    map.addSource('wa-covid-data', {
      type: 'geojson',
      data: data
    });

    // Function to calculate equal intervals for the fully vaccinated rates
    function calculateIntervals(data, numIntervals) {
      var fullyVaxRates = data.features.map(function (feature) {
        return feature.properties.fullyVaxPer10k;
      });

      var intervalRange = (Math.max(...fullyVaxRates) - Math.min(...fullyVaxRates)) / numIntervals;
      var intervals = [];
      for (var i = 0; i <= numIntervals; i++) {
        intervals.push(Math.min(...fullyVaxRates) + intervalRange * i);
      }
      return intervals;
    }

    // Calculate equal intervals for the fully vaccinated rates (5 intervals)
    var intervals = calculateIntervals(data, 5);

    // Create a choropleth layer with equal intervals
    map.addLayer({
      id: 'choropleth-layer',
      type: 'fill',
      source: 'wa-covid-data',
      paint: {
        'fill-color': [
          'step',
          ['get', 'fullyVaxPer10k'],
          '#ffffcc', // Color for lowest interval
          intervals[1], '#a1dab4',
          intervals[2], '#41b6c4',
          intervals[3], '#2c7fb8',
          intervals[4], '#253494' // Color for highest interval
        ],
        'fill-opacity': 0.7
      }
    });

    // Create a popup to show data on hover
    var popup = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false
    });

    // Add a hover effect to update the popup content and show it on mousemove
    map.on('mousemove', 'choropleth-layer', function (e) {
      var countyName = e.features[0].properties.name;
      var fullyVaxRate = e.features[0].properties.fullyVaxPer10k;
      var tooltipContent = '<strong>' + countyName + '</strong><br>Fully Vaccinated Rate: ' + fullyVaxRate + ' per 10,000 people';

      popup.setLngLat(e.lngLat)
        .setHTML(tooltipContent)
        .addTo(map);
    });

    // Change the cursor to a pointer when hovering over the choropleth layer
    map.on('mouseenter', 'choropleth-layer', function () {
      map.getCanvas().style.cursor = 'pointer';
    });

    // Change the cursor back to the default when not hovering over the choropleth layer
    map.on('mouseleave', 'choropleth-layer', function () {
      map.getCanvas().style.cursor = '';
      popup.remove(); // Remove the popup when the mouse leaves the layer
    });

    // Add a legend to the map
    var legend = document.getElementById('legend');
    var colors = ['#ffffcc', '#a1dab4', '#41b6c4', '#2c7fb8', '#253494'];
    var labels = ['< ' + intervals[1], intervals[1], intervals[2], intervals[3], intervals[4] + '+'];
    for (var i = 0; i < colors.length; i++) {
      var div = document.createElement('div');
      div.className = 'legend-item';
      div.style.backgroundColor = colors[i];
      div.innerHTML = labels[i];
      legend.appendChild(div);
    }
  })
  .catch(function (error) {
    console.log('Error fetching data:', error);
  });