var svg_width = 900,
  svg_height = 500;

var margin = { top: 80, right: 60, bottom: 110, left: 60 };
var margin2 = { top: 430, right: 60, bottom: 30, left: 60 };

var width = svg_width - margin.left - margin.right,
  height = svg_height - margin.top - margin.bottom,
  height2 = svg_height - margin2.top - margin2.bottom;

var parseDate = d3.timeParse("%Y%m%d");

var x = d3.scaleTime().range([0, width]),
  x2 = d3.scaleTime().range([0, width]);

var y = d3.scaleLinear().range([height, 0]),
  y2 = d3.scaleLinear().range([height2, 0]);

var color = d3.scaleOrdinal(d3.schemeCategory10);

var colors = {
  "Avila Adobe": "#9D02D7",
  "Firehouse Museum": "#FFB14E",
  "Chinese American Museum": "#FA8775",
  "Interpretive Center": "#EA5F94",
};

var xAxis = d3.axisBottom(x);
var yAxis = d3.axisLeft(y);
var xAxis2 = d3.axisBottom(x2);

var brush = d3
  .brushX()
  .extent([
    [0, 0],
    [width, height2],
  ])
  .on("brush end", brushed);

var zoom = d3
  .zoom()
  .scaleExtent([1, Infinity])
  .translateExtent([
    [0, 0],
    [width, height],
  ])
  .extent([
    [0, 0],
    [width, height],
  ])
  .on("zoom", zoomed);

var line = d3
  .line()
  .x(function (d) {
    return x(d.date);
  })
  .y(function (d) {
    return y(d.visits);
  })
  .curve(d3.curveBasis);

var line2 = d3
  .line()
  .x(function (d) {
    return x2(d.date);
  })
  .y(function (d) {
    return y2(d.visits);
  })
  .curve(d3.curveBasis);

var svg = d3
  .select("#graph")
  .append("svg")
  .attr("width", svg_width + 100)
  .attr("height", svg_height);

svg
  .append("defs")
  .append("clipPath")
  .attr("id", "clip")
  .append("rect")
  .attr("width", width)
  .attr("height", height);

var focus = svg
  .append("g")
  .attr("class", "focus")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var context = svg
  .append("g")
  .attr("class", "context")
  .attr("transform", "translate(" + margin2.left + "," + margin2.top + ")");

d3.csv("dataset.csv", function (data) {
  color.domain(
    d3.keys(data[0]).filter(function (key) {
      return key !== "date";
    })
  );

  data.forEach(function (d) {
    d.date = parseDate(d.date);
  });

  var counties = color.domain().map(function (name) {
    return {
      name: name,
      values: data.map(function (d) {
        return { date: d.date, visits: +d[name] };
      }),
    };
  });

  x.domain(
    d3.extent(data, function (d) {
      return d.date;
    })
  );
  x2.domain(
    d3.extent(data, function (d) {
      return d.date;
    })
  );

  y.domain([
    d3.min(counties, function (c) {
      return d3.min(c.values, function (v) {
        return v.visits;
      });
    }),
    d3.max(counties, function (c) {
      return d3.max(c.values, function (v) {
        return v.visits;
      });
    }),
  ]);

  y2.domain(y.domain());

  focus
    .append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis);

  focus
    .append("g")
    .attr("class", "y axis")
    .call(yAxis)
    .append("text")
    .attr("transform", "rotate(270)")
    .attr("x", 60)
    .attr("dy", ".32em")
    .attr("fill", "black")
    .text("Visits");

  var county = focus
    .selectAll(".county")
    .data(counties)
    .enter()
    .append("g")
    .attr("class", "county");

  county
    .append("path")
    .attr("class", "line")
    .attr("clip-path", "url(#clip)")
    .attr("d", function (d) {
      return line(d.values);
    })
    .style("stroke", function (d) {
      return colors[d.name];
    });

  county
    .append("text")
    .datum(function (d) {
      return { name: d.name, value: d.values[d.values.length - 1] };
    })
    .attr("class", "label")
    .attr("transform", function (d) {
      return "translate(" + x(d.value.date) + "," + y(d.value.visits) + ")";
    })
    .attr("x", 3)
    .attr("dy", ".35em")
    .text(function (d) {
      return d.name;
    });

  var county2 = context
    .selectAll(".county")
    .data(counties)
    .enter()
    .append("g")
    .attr("class", "county");

  county2
    .append("path")
    .attr("class", "line")
    .attr("d", function (d) {
      return line2(d.values);
    })
    .style("stroke", function (d) {
      return colors[d.name];
    });

  context
    .append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height2 + ")")
    .call(xAxis2);

  context
    .append("g")
    .attr("class", "brush")
    .call(brush)
    .call(brush.move, x.range());

  svg
    .append("rect")
    .attr("class", "zoom")
    .attr("width", width)
    .attr("height", height)
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
    .call(zoom);
});

function brushed() {
  if (d3.event.sourceEvent && d3.event.sourceEvent.type === "zoom") return;

  var s = d3.event.selection || x2.range();

  x.domain(s.map(x2.invert, x2));

  focus.selectAll(".line").attr("d", function (d) {
    return line(d.values);
  });
  focus.select(".axis--x").call(xAxis);

  svg
    .select(".zoom")
    .call(
      zoom.transform,
      d3.zoomIdentity.scale(width / (s[1] - s[0])).translate(-s[0], 0)
    );
}

function zoomed() {
  if (d3.event.sourceEvent && d3.event.sourceEvent.type === "brush") return;

  var t = d3.event.transform;

  x.domain(t.rescaleX(x2).domain());

  focus.selectAll(".line").attr("d", function (d) {
    return line(d.values);
  });

  focus.select(".axis--x").call(xAxis);

  context.select(".brush").call(brush.move, x.range().map(t.invertX, t));
}
