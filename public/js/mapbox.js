export const displayMap = (locations) => {
  if (typeof maplibregl !== "undefined") {
    const map = new maplibregl.Map({
      container: "map",
      style:
        "https://api.maptiler.com/maps/streets-v2/style.json?key=QAbMY8lUX8I5Q7yqOe7J",
      scrollZoom: false,
    });

    const bounds = new maplibregl.LngLatBounds();

    map.on("load", function () {
      locations.forEach((loc) => {
        // Create marker
        const el = document.createElement("div");
        el.className = "marker";

        new maplibregl.Marker({
          element: el,
          anchor: "bottom",
        })
          .setLngLat(loc.coordinates)
          .addTo(map);

        // Add popup
        new maplibregl.Popup({ offset: 30 })
          .setLngLat(loc.coordinates)
          .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
          .addTo(map);

        bounds.extend(loc.coordinates);
      });

      // Zoom to fit all markers
      map.fitBounds(bounds, {
        padding: { top: 200, bottom: 150, left: 100, right: 100 },
        linear: true, // optional smooth transition
      });
    });
  }
};
