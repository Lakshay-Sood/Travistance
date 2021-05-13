/* eslint-disable */
export const displayMap = locations => {
  //mapboxgl variable is provided from the cdn used in tour.pug
  mapboxgl.accessToken =
    'pk.eyJ1IjoibGFrc2hheS1zb29kIiwiYSI6ImNrZWFicmI4bzJlbGoyc29iaWFtd3Z6cnkifQ.H0Rzh8iSJ37qYmSBOXGnyg';

  let map = new mapboxgl.Map({
    container: 'map', //targeting element with id=map in the rendered html
    style: 'mapbox://styles/lakshay-sood/ckeabunea050h19qhyhms4wjn',
    logoPosition: 'top-left', //so that its not visible
    maxZoom: 10,
    // scrollZoom: false,
    // doubleClickZoom: false,
    interactive: false
    // maxBounds: lngLatBounds
  });

  // const lngLatLocations = locations.map(loc => loc.coordinates);
  // console.log(lngLatLocations);
  const lngLatBounds = new mapboxgl.LngLatBounds();

  locations.forEach(loc => {
    //## adding marker for each location of tour
    const el = document.createElement('div');
    el.className = 'marker'; //defined in css file to look like a green marker pin
    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom'
    })
      .setLngLat(loc.coordinates)
      .setPopup(
        new mapboxgl.Popup({ anchor: 'top', closeOnClick: false }).setHTML(
          `<p>Day ${loc.day}: ${loc.description}</p>`
        )
      )
      .addTo(map);

    //## adding popup for each location of tour
    new mapboxgl.Popup({ anchor: 'top', closeOnClick: false })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
      .addTo(map);

    lngLatBounds.extend(loc.coordinates);
  });

  map.fitBounds(lngLatBounds, {
    padding: {
      top: 150,
      right: 200,
      bottom: 150,
      left: 200
    }
  });

  const locCoordinates = locations.map(loc => loc.coordinates);

  map.on('load', function() {
    map.addSource('route', {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: locCoordinates
        }
      }
    });
    map.addLayer({
      id: 'route',
      type: 'line',
      source: 'route',
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': '#6e8587',
        'line-width': 5
      }
    });
  });
};
