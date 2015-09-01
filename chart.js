/*
    File containing the chart generator.
 */

var Chart = function() {
    var margin = {top: 20, right: 10, bottom: 20, left: 10},
        dispatcher = d3.dispatch(),
        regionAttribute,
        pieRadius = 225,
        bufferInnerRadius = 100,
        bufferPadAngle = 0.1,
        nudge = 1,
        textArcPadAngle = 0.005,
        defaultCharge = function(d) {
            return -0;
        },
        defaultGravity = 0.02,
        defaultFriction = 0,
        textRegionDistance = 30,
        circlePadding = 5,
        firstSortedByVariable = 'domain',
        secondSortedByVariable = 'startDate',
        colorScheme = d3.scale.category10();

    var chart = function(selection) {
        selection.each(function(data) {
            // General Variables
            var container = d3.select(this),
                width = this.clientWidth,
                height = this.clientHeight,
                chartWidth = width - margin.left - margin.right,
                chartHeight = height - margin.top - margin.bottom,
                center = {
                    x: chartWidth / 2,
                    y: chartHeight / 2
                },
                barHeight = 15,
                barToTextPadding = 20,
                data = _.sortByOrder(
                    data,
                    [firstSortedByVariable, secondSortedByVariable],
                    ['asc', 'desc']
                ),
                barRegions = _.countBy(data, regionAttribute),
                numberOfRegions = _.size(barRegions),
                groupedByRegion = _.groupBy(data, regionAttribute),
                yScalePoints = {},
                textPathRadius = pieRadius + textRegionDistance / 2,
                pathLineLength = 2 * Math.sin(Math.PI / numberOfRegions) *
                    textPathRadius,
                pathLine = [
                    {x: 0, y: 0},
                    {x: pathLineLength / 2, y: 0},
                    {x: pathLineLength, y: 0}
                ],
                pathCurve = [
                    {x: 0, y: 0},
                    {x: pathLineLength / 2, y: -textRegionDistance},
                    {x: pathLineLength, y: 0}
                ];

            // Calculate bar and text locations
            var yPosition = 0;
            _.forEach(barRegions, function(number, regionName) {
                var firstBar = yPosition + barToTextPadding,
                    lastBar = firstBar + number * barHeight * 1.05;

                yScalePoints[regionName] = {
                    textLocation: yPosition,
                    scale: d3.scale.ordinal()
                        .domain(_.map(groupedByRegion[regionName], 'name'))
                        .range(
                            d3.range(
                                firstBar,
                                lastBar,
                                (lastBar - firstBar) / number
                            )
                        )
                };

                yPosition = lastBar + barToTextPadding;
            });


            // Force layout variables
            var regions = _.chain(data)
                    .map(function(d) { return d[regionAttribute]; })
                    .uniq()
                    .value(),
                circleRadius = barHeight / 2,
                selectedNode,
                regionPolygons = [],
                regionCentroids = [];

            var pie = d3.layout.pie()
                .value(function(d) {return 1; });

            var arc = d3.svg.arc()
                .innerRadius(0)
                .outerRadius(pieRadius);

            var arcRegion = d3.svg.arc()
                .innerRadius(bufferInnerRadius)
                .padAngle(bufferPadAngle)
                .outerRadius(pieRadius);

            var arcText = d3.svg.arc()
                .innerRadius(pieRadius)
                .padAngle(textArcPadAngle)
                .outerRadius(pieRadius + textRegionDistance);

            // Lines drawn to separate region attribute lines on timeline
            var timelineLinesGenerator = d3.svg.line()
                .x(function(d) { return d.x; })
                .y(function(d) { return regionYScale(d.y); })
                .interpolate("linear");

            // Path generator for text
            var textLineGenerator = d3.svg.line()
                .x(function(d) { return d.x; })
                .y(function(d) { return d.y; })
                .interpolate("basis");

            var force = d3.layout.force()
                .gravity(defaultGravity)
                .friction(defaultFriction)
                .charge(defaultCharge)
                .size([width, height]);

            // Barchart layout variables
            var xScale = d3.time.scale()
                    .domain([
                        d3.min(data, function(d) { return d.startDate; }),
                        d3.max(data, function(d) { return d.lastUpdate; })
                    ])
                    .range([margin.left, chartWidth])
                    .nice();

            var xAxis = d3.svg.axis()
                .scale(xScale)
                .orient("bottom");

            var regionYScale = d3.scale.ordinal()
                .domain(regions)
                .range(
                    _.map(
                        yScalePoints,
                        function(d) {
                            return d.textLocation;
                        }
                    )
                );

            var svg = container.append("svg")
                .attr("width", width)
                .attr("height", height)
                .style("overflow", "visible");

            // Barchart components
            var barContainer = svg.append("g")
                .classed({timeline: 1});

            barContainer.append("g")
                .attr("transform", "translate(" + [0, chartHeight] + ")")
                .classed({"x-axis": 1})
                .call(xAxis);

            var timelineLines = barContainer.append("g")
                .selectAll(".timeline-line")
                .data(regions)
                .call(function(region) {
                    region.enter().append("path")
                        .classed({"timeline-line": 1})
                        .attr({
                            d: function(d, i) {
                                return timelineLinesGenerator([
                                    {x: margin.left, y: d},
                                    {x: margin.left, y: d}
                                ]);
                            }
                        })
                        .style({
                            stroke: function(d, i) {
                                return colorScheme(d[regionAttribute]);
                            },
                            "stroke-width": "1px",
                            opacity: 0.4
                        });
                });

            // Force layout components
            var regionBg = svg.append("g")
                .attr("transform", "translate(" + [center.x, center.y] + ")")
                .selectAll(".region")
                    .data(pie(regions))
                    .call(function(region) {
                        region.enter().append("path")
                            .classed({"region region-background": 1})
                            .attr("d", arc);
                     });

            var region = svg.append("g")
                .attr("transform", "translate(" + [center.x, center.y] + ")")
                .selectAll(".region")
                .data(pie(regions))
                .call(function(region) {
                    region.enter().append("path")
                        .classed({region: 1})
                        .attr("d", arcRegion)
                        .style({
                          fill: "none"
                        })
                    .each(function(d) {
                        regionPolygons[d.data] = pathToPoints(this);
                        regionCentroids[d.data] = arcRegion.centroid(d);
                    });
                });

            function pathToPoints(path) {
                var segs = path.pathSegList;
                return d3.range(segs.numberOfItems - 1).map(function(i) {
                    return [segs.getItem(i).x, segs.getItem(i).y];
                });
            }

            var textBackgroundRegion = svg.append("g")
                .attr("transform", "translate(" + [center.x, center.y] + ")")
                .selectAll(".text-background")
                .data(pie(regions))
                .call(function(region) {
                    var textBackground = region.enter().append("g")
                        .classed({"region text-background": 1});

                    textBackground.append("path")
                        .classed({"text-background-arc": 1})
                        .attr({
                            d: arcText,
                        })
                        .style({
                            fill: "#b5bdc3",
                            opacity: 1
                        });
            });

            var textGroups = svg.append("g")
                .selectAll(".text-group")
                .data(pie(regions))
                .call(function(region) {
                    var textGroup = region.enter().append("g")
                        .classed({"text-translate": 1})
                        .attr({
                            transform: "translate(" + [
                                center.x - pathLineLength / 2,
                                center.y - pieRadius
                            ] + ")"
                        })
                    .append("g")
                        .classed({"text-rotate": 1})
                        .attr({
                            transform: function(d, i) {
                                return "rotate(" +
                                    [
                                        (i * (360 / numberOfRegions)) +
                                            (360 / numberOfRegions / 2),
                                        pathLineLength / 2,
                                        pieRadius
                                    ] +
                                    ")";

                            }
                        });

                    var text = textGroup.append("text")
                        .classed({"display-text": 1})
                        .attr({
                            dy: textRegionDistance / 2 - 3
                        });

                    textGroup.append("path")
                        .classed({"path-for-text": 1})
                        .style({
                            "fill": "none"
                        })
                        .attr({
                            d: textLineGenerator(pathCurve),
                            id: function(d, i) { return "path" + i; }
                        });

                    text.append("textPath")
                        .classed({"text-path": 1})
                        .attr({
                            "startOffset": "50%",
                            "xlink:href": function(d, i) {
                                return "#path" + i;
                            }
                        })
                        .style({
                            "text-anchor": "middle"
                        })
                        .append("tspan")
                        .classed({"actual-text-path": 1})
                        .style({
                            "font-size": "12pt",
                            "fill": "white",
                            "opacity": 0.87,
                        })
                        .text(function(d) { return d.data; });
            });

            // Start nodes at centroid of their region
            data.forEach(function(d) {
                var centroid = regionCentroids[d[regionAttribute]];
                d.x = centroid[0] + center.x;
                d.y = centroid[1] + center.y;
                d.radius = circleRadius;
            });

            force
              .nodes(data)
              .on("tick", tick)
              .start();

            var node = svg.selectAll(".node")
                .data(data)
                .call(function(node) {
                    node.enter().append("rect")
                    .classed({node: 1})
                        .attr({
                            id: function(d) {
                                return _.kebabCase(d.name);
                            }
                        })
                        .style({
                            opacity: 0,
                            fill: function(d) {
                                return colorScheme(d[regionAttribute]);
                            }
                        });

                    node.transition()
                        .duration(750)
                        .attr({
                            width: barHeight,
                            height: barHeight,
                            rx: barHeight / 2,
                            ry: barHeight / 2
                        })
                        .style("opacity", 1);

                    dispatcher.on("selectedNode.highlight", updateNode);

                    node.on("mouseover", mouseOver);
                    node.on("mouseout", mouseOut);

                    function updateNode(d) {
                        var theNode = d3.select("#" + _.kebabCase(d.name));

                        var clickedSameNode = selectedNode ?
                                selectedNode.data()[0] === theNode.data()[0] :
                                false;

                        if (selectedNode) {
                            selectedNode.style({ stroke: null });
                        }

                        if (!clickedSameNode) {
                            selectedNode = theNode;

                            selectedNode.style({
                                "stroke": "black",
                                "stroke-width": 2 + "px"
                            });
                        } else {
                            selectedNode = null;
                        }
                    }

                    function mouseOver(d) {
                        var thisCircle = d3.select(this);
                        if (thisCircle.style("opacity") !== "0") {
                            d3.select(this).style({ opacity: 0.6 });
                            dispatcher.mouseOverNode(d);
                        }
                    }

                    function mouseOut(d) {
                        var thisCircle = d3.select(this);
                        if (thisCircle.style("opacity") !== "0") {
                            thisCircle.style({ opacity: 1 });
                            dispatcher.mouseOutNode(d);
                        }
                    }
                })
                .call(force.drag);

            function tick(e) {
              var k = 0.1 * e.alpha;

              data.forEach(function(d) {
                var tx = [d.x - center.x, d.y - center.y],
                  cx = regionCentroids[d[regionAttribute]],
                  dx = Math.sqrt(
                    Math.pow(tx[0] - cx[0], 2),
                    Math.pow(tx[1] - cx[1], 2)
                  );

                var inPoly = pointInPolygon(tx, regionPolygons[d[regionAttribute]]);

                if(!inPoly) {
                  d.x += (tx[0] < cx[0] ? 1 : -1) * nudge;
                  d.y += (tx[1] < cx[1] ? 1 : -1) * nudge;
                } else {
                  d.x += (cx[0] - tx[0]) * k;
                  d.y += (cx[1] - tx[1]) * k;
                }
              });

              node.each(collide(0.5))
                .attr("x", function(d) { return d.x; })
                .attr("y", function(d) { return d.y; });
            }

            // from https://github.com/substack/point-in-polygon
            // ray-casting algorithm based on
            // http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html
            function pointInPolygon(point, vs) {

                var x = point[0], y = point[1];

                var inside = false;
                for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
                    var xi = vs[i][0], yi = vs[i][1];
                    var xj = vs[j][0], yj = vs[j][1];

                    var intersect = (
                      ((yi > y) != (yj > y)) &&
                      (x < (xj - xi) * (y - yi) / (yj - yi) + xi)
                    );
                    if (intersect) inside = !inside;
                }

                return inside;
            }

            // Resolves collisions between d and all other circles.
            // Taken from http://bl.ocks.org/mbostock/7881887
            function collide(alpha) {
              var quadtree = d3.geom.quadtree(data);
              return function(d) {
                var r = d.radius + circlePadding,
                    nx1 = d.x - r,
                    nx2 = d.x + r,
                    ny1 = d.y - r,
                    ny2 = d.y + r;
                quadtree.visit(function(quad, x1, y1, x2, y2) {
                  if (quad.point && (quad.point !== d)) {
                    var x = d.x - quad.point.x,
                        y = d.y - quad.point.y,
                        l = Math.sqrt(x * x + y * y),
                        r = d.radius + quad.point.radius + circlePadding;
                    if (l < r) {
                      l = (l - r) / l * alpha;
                      d.x -= x *= l;
                      d.y -= y *= l;
                      quad.point.x += x;
                      quad.point.y += y;
                    }
                  }
                  return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
                });
              };
            }

            dispatcher.on("drawDomain", function() {
                var t0 = container.transition().duration(500);

                // Nodes transform to circles
                t0.selectAll(".node").attr({width: barHeight});

                // Timeline divider lines disappear
                t0.selectAll(".timeline-line")
                    .attr({
                        d: function(d, i) {
                            return timelineLinesGenerator([
                                {x: margin.left, y: d},
                                {x: margin.left, y: d}
                            ]);
                        },
                    });

                // Timeline scale is removed
                t0.selectAll(".timeline").style({opacity: 0});

                var t1 = t0.transition().duration(500);

                // Nodes translate back to original pie position
                t1.selectAll(".node")
                    .attr({
                        x: function(d) { return d.x; },
                        y: function(d) { return d.y; }
                    });

                // Restart the force drag layout
                t1.each("end", function() {
                    node.call(force.drag);
                    force.start();
                });

                var t2 = t1.transition()
                        .delay(function(d, i) {
                            return i * 50;
                        })
                        .delay(1000)
                        .duration(1000);

                // Translate 1/2 from origin
                t2.selectAll(".text-translate")
                    .attr({
                        transform: "translate(" + [
                            center.x - pathLineLength / 2,
                            center.y - pieRadius
                        ] + ")"
                    });

                t2.selectAll(".text-rotate")
                    .attr({
                        transform: function(d, i) {
                            return "rotate(" +
                                [
                                    (i * (360 / numberOfRegions)) +
                                        (360 / numberOfRegions / 2),
                                    pathLineLength / 2,
                                    pieRadius
                                ] +
                                ")";
                        }
                    });


                var t3 = t2.transition().delay(1500)
                    .duration(750);

                // Position text to fit on curve
                t3.selectAll(".text-path")
                    .attr({"startOffset": "50%"});

                t3.selectAll(".text-path")
                    .style({ "text-anchor": "middle"});


                t3.selectAll(".display-text")
                    .attr({dy: textRegionDistance / 2 - 3});

                // Change line path to curve path
                t3.selectAll(".path-for-text")
                    .attrTween("d", arcTransition());

                function arcTransition() {
                    return function(d, i, a) {
                        return d3.interpolate(a, textLineGenerator(pathCurve));
                    };
                }


                var t4 = t3.transition();

                // Region text is translated to pie position
                t4.selectAll(".text-translate")
                    .attr({
                        transform: "translate(" + [
                            center.x - pathLineLength / 2,
                            center.y - pieRadius
                        ] + ")"
                    });


                // Show text background color
                t4.selectAll(".text-background")
                    .selectAll("path")
                    .style({opacity: 1});

                // Show the pie slices
                t4.selectAll(".region-background").style({opacity: 1});

                // Change text color to white
                t4.selectAll(".actual-text-path")
                    .style({fill: "white"});

            });

            dispatcher.on("drawTimeline", function() {
                stopForceDrag();

                d3.transition()
                .ease("linear")
                .each(function() {
                    hideTextBackground();
                    hidePieSlices();
                    fillTextWithColor();
                })/*
                .each("end", function() {
                })*/
                .transition()
                .duration(500)
                .each(function() {
                    intermediateTranslateToOrigin();
                    originRotateText();
                    modifyPathToLine();
                    positionTextToFitOnPath();
                })
                .each("end", function() {
                    translateToOrigin();
                })
                .transition()
                .delay(1500)
                .duration(500)
                .each(function() {
                    moveNodesToTimelinePosition();
                })
                .each("end", function() {
                    showTimeline();
                    extendTimelineLines();
                    extendNodeBars();
                });


                function stopForceDrag() {
                    force.stop();
                    node.call(timelineDrag);
                }

                function hideTextBackground() {
                    container.selectAll(".text-background")
                        .selectAll("path").transition()
                        .style("opacity", 0);
                }

                function hidePieSlices() {
                    container.selectAll(".region-background").transition()
                        .style("opacity", 0);
                }

                function fillTextWithColor() {
                    container.selectAll(".actual-text-path").transition()
                        .style({
                            fill: function(d) { return colorScheme(d.data); }
                        });
                }

                function intermediateTranslateToOrigin() {
                    container.selectAll(".text-translate").transition()
                        .duration(1000)
                        .attr({
                            transform: function(d, i) {
                                return "translate(" + [
                                center.x,
                                yScalePoints[d.data].textLocation
                                ] + ")"; }
                        });
                }

                function originRotateText() {
                    container.selectAll(".text-rotate").transition()
                        .attr({
                            transform: function(d, i) {
                                return "rotate(0)";
                            }
                        });
                }

                function modifyPathToLine() {
                    container.selectAll(".path-for-text").transition()
                        .attrTween("d", lineTransition());

                    function lineTransition() {
                        return function(d, i, a) {
                            return d3.interpolate(a,
                                textLineGenerator(pathLine));
                        };

                    }
                }

                function positionTextToFitOnPath() {
                    container.selectAll(".text-path").transition()
                        .style({"text-anchor": "start"});

                    container.selectAll(".text-path").transition()
                        .attr({"startOffset": "0%"});

                    container.selectAll(".display-text").transition()
                        .attr({dy: 16});
                }

                function translateToOrigin() {
                    container.selectAll(".text-translate").transition()
                        .duration(500)
                        .attr({
                            transform: function(d, i) {
                                return "translate(" + [
                                margin.left,
                                yScalePoints[d.data].textLocation
                                ] + ")"; }
                        });
                }

                function showTimeline() {
                    container.selectAll(".timeline").transition()
                        .style("opacity", 1);
                }

                function moveNodesToTimelinePosition() {
                    node.transition()
                        .attr({
                            x: function(d) {
                                return xScale(d.startDate) - barHeight / 2;
                            },
                            y: function(d, i) {
                                return yScalePoints[d[regionAttribute]]
                                    .scale(d.name);
                            }
                        });
                }

                function extendTimelineLines() {
                    container.selectAll(".timeline-line").transition()
                        .attr({
                            d: function(d, i) {
                                return timelineLinesGenerator([
                                    {x: margin.left, y: d},
                                    {x: chartWidth, y: d}
                                ]);
                            },
                        });
                }

                function extendNodeBars() {
                    node.transition()
                        .attr({
                            width: function(d) {
                                return xScale(d.lastUpdate) -
                                    xScale(d.startDate) +
                                    barHeight;
                            }
                        });
                }
            });


            dispatcher.on("filterUpdate", function(filters) {

                node.transition().style({
                    opacity: function(d) { return viewable(d); },
                    "pointer-events": function (d) {
                        return viewable(d) ? "all" : "none";
                    }
                });


                function viewable(d) {
                    if (!filterListIsEmpty()) {
                        var isMuted = true,
                            dataHasFilter = {};

                        _.forIn(filters, function(keptValues, filterType) {

                            if (filterType !== 'others') {
                                if (!_.isEmpty(keptValues)) {
                                    dataHasFilter[filterType] = false;

                                    // keyword filter
                                    if (filterType === "all") {
                                        var allValues =
                                            JSON.stringify(_.values(d)).toLowerCase();

                                        if (allValues.indexOf(keptValues) !== -1) {
                                                dataHasFilter[filterType] = true;
                                                return;
                                        }

                                    } else {
                                        var isMatch = _.some(keptValues, function(keptValue) {

                                            if (_.isArray(d[filterType])) {
                                                if (keptValue === 'other') {
                                                    return _.some(d[filterType],
                                                        function(value) {
                                                            return _.some(filters.others,
                                                                function(other) {
                                                                    return value === other;
                                                            });
                                                        });
                                                }

                                                return _.some(d[filterType],
                                                    function(value) {
                                                        return value.toLowerCase()
                                                            .indexOf(keptValue) !== -1;
                                                    });
                                            }

                                            if (keptValue === 'other') {
                                                return _.some(filters.others, function(other) {
                                                    return d[filterType].toLowerCase() === other;
                                                });
                                            }

                                            return d[filterType].toLowerCase()
                                                    .indexOf(keptValue) !== -1;
                                        });

                                        if (isMatch) {
                                            dataHasFilter[filterType] = true;
                                            return;
                                        }
                                    }
                                }
                            }
                        });

                        isMuted = !_.every(_.values(dataHasFilter),
                            function(isTrue) {
                                return isTrue;
                        });

                        return isMuted ? 0 : 1;
                    }

                    return 1;
                }

                function filterListIsEmpty() {
                    return _.every(filters, function(filterType) {
                        return _.isEmpty(filterType);
                    });
                }
            });


            var timelineDrag = d3.behavior.drag()
                .on("dragstart", dragstart);

            function dragstart(d) {
                force.stop();
            }
        });
    };

    chart.margin = function(value) {
        if (!arguments.length) return margin;
        margin = value;
        return chart;
    };

    chart.regionAttribute = function(value) {
        if (!arguments.length) return regionAttribute;
        regionAttribute = value;
        return chart;
    };

    chart.pieRadius = function(value) {
        if (!arguments.length) return pieRadius;
        pieRadius = value;
        return chart;
    };

    chart.dispatcher = function(value) {
        if (!arguments.length) return dispatcher;
        dispatcher = value;
        return chart;
    };

    chart.colorScheme = function(value) {
        if (!arguments.length) return colorScheme;
        colorScheme = value;
        return chart;
    };

    return chart;
};