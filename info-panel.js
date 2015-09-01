
var InfoPanel = function() {
    var dispatcher = d3.dispatch("mouseOverNode", "mouseOutNode"),
        colorScheme = d3.scale.category10(),
        regionAttribute,
        iconGenerator = function(icon) { return "icon-host-" + icon;  },
        iconList;

    var info = function(selection) {
        selection.each(function(data) {
            var container = d3.select(this),
                selectedNode;

            container.style({opacity: 0});

            var panel = container.append("div")
                .classed({"panel panel-default info-panel": 1});

            var header = panel.append("div")
                .classed({"panel-heading": 1})
                .append("h4");

            var body = panel.append("div")
                .classed({"info-body panel-body": 1})
                    .append("div")
                        .classed({"container-fluid": 1});

            var description = body.append("div")
                .classed({description: 1});

            var projectNameContainer = body.append("div")
                .classed({"project-name-container": 1})
                .append("div")
                    .classed({"row": 1});

            projectNameContainer.append("span")
                .classed({"project-name-label nopadding col-xs-5": 1})
                .text("DHS Project Name: ");

            var projectName = projectNameContainer.append("span")
                .classed({"project-name nopadding col-xs-7": 1});

            var organizationContainer = body.append("div")
                .classed({"organization-container": 1})
                .append("div")
                    .classed({"row": 1});

            organizationContainer.append("span")
                .classed({"organization-label nopadding col-xs-5": 1})
                .text("Organization: ");

            var organizationName = organizationContainer.append("span")
                .classed({"organization-name nopadding col-xs-7": 1});

            var codeContainer = body.append("div")
                .classed({"code-container": 1})
                .append("div")
                    .classed({"row": 1});

            codeContainer.append("span")
                .classed({"code-label nopadding col-xs-5": 1})
                .text("Code: ");

            var codeLocation = codeContainer.append("div")
                .classed({"code-location nopadding col-xs-7": 1})
                .style({ "word-wrap": "break-word"});

            var releasedContainer = body.append("div")
                .classed({"released-container": 1})
                .append("div")
                    .classed({"row": 1});

            releasedContainer.append("span")
                .classed({"released-label nopadding col-xs-5": 1})
                .text("First Released: ");

            var releasedLocation = releasedContainer.append("span")
                .classed({"released-location nopadding col-xs-7": 1});

            var updateContainer = body.append("div")
                .classed({"update-container": 1})
                .append("div")
                    .classed({"row": 1});

            updateContainer.append("span")
                .classed({"update-label nopadding col-xs-5": 1})
                .text("Last Update: ");

            var updateLocation = updateContainer.append("span")
                .classed({"update-location nopadding col-xs-7": 1});

            var languageLicenseContainer = body.append("div")
                .classed({"language-license-container": 1})
                .append("div")
                    .classed({"row": 1});

            var languageLicenseIconContainer = languageLicenseContainer.append("div")
                .classed({"row language-license-icon-container": 1});

            var osContainer = body.append("div")
                .classed({"os-container": 1})
                .append("div")
                    .classed({"row": 1});

            var osIconContainer = osContainer.append("div")
                .classed({"row os-icon-container": 1});

            osContainer.append("div")
                .classed({"os-label text-center": 1})
                .text("Operating Systems");

            dispatcher.on("selectedNode.panel", clickUpdate);
            dispatcher.on("mouseOverNode", overUpdate);
            dispatcher.on("mouseOutNode", outUpdate);

            function clickUpdate(d) {
                // Node is unclicked
                if (selectedNode && selectedNode.name === d.name) {
                    selectedNode = null;
                    container.style({opacity: 0});
                } else {
                    selectedNode = d;
                    updatePanel(selectedNode);
                }
            }

            function overUpdate(d) {
                updatePanel(d);
            }

            function outUpdate() {
                if (selectedNode) {
                    updatePanel(selectedNode);
                } else {
                    container.style({opacity: 0});
                }
            }

            function updatePanel(datum) {
                container.style({opacity: 1});
                var color = colorScheme(datum[regionAttribute]);
                panel.style({
                    "border-color": color,
                    "box-shadow": function() {
                        return "0 1px 6px 0 " + color + ", 0 1px 6px 0" + color;
                    }
                });
                updateHeader(datum);
                updateBody(datum);
            }

            function updateHeader(datum) {
                header
                    .style({
                        color: colorScheme(datum[regionAttribute])
                    })
                    .text(datum.name);
            }

            function updateBody(datum) {
                updateDescription(datum);
                updateProjectName(datum);
                updateOrganizationName(datum);
                updateCodeLocation(datum);
                updateFirstReleased(datum);
                updateLastUpdate(datum);
                updateLanguageLicense(datum);
                updateOS(datum);
            }

            function updateDescription(datum) {
                description.text(function() {
                    return datum.description || '';
                });
            }

            function updateProjectName(datum) {
                projectName.text(datum.projectName);
            }

            function updateOrganizationName(datum) {
                organizationName.text(datum.organization);
            }

            function updateCodeLocation(datum) {
                codeLocation.html(
                    "<a href='" + datum.codeLocation + "'>" +
                        datum.codeLocation + "</a>"
                );
            }

            function updateFirstReleased(datum) {
                releasedLocation.text(
                    datum.startDate.toLocaleDateString() + "*");
            }

            function updateLastUpdate(datum) {
                updateLocation.text(
                    datum.lastUpdate.toLocaleDateString()+ "*"
                );
            }

            function updateLanguageLicense(datum) {
                var languages = _.map(datum.language, function(lang) {
                    return {
                        label: lang,
                        iconClass: iconGenerator(
                            _.find(iconList.languages, {label: lang}).src
                        )
                    };
                }),
                numberOfLanguages = languages.length;

                var license = {
                    label: datum.license,
                    iconClass: iconGenerator(
                        _.find(iconList.license, {label: datum.license}).src
                    )
                };

                var llContainer = container.select(".language-license-icon-container");

                llContainer.selectAll("*").remove();

                var licenseGroup = llContainer.append("div")
                    .attr({
                        class: function() {
                            return "col-xs-" + (12 / (numberOfLanguages + 1));
                        }
                    });

                licenseGroup.append("div")
                    .classed({"row text-center icon-sizer": 1})
                    .append("span")
                        .attr({
                            class: license.iconClass
                        });

                licenseGroup.append("div")
                    .classed({"row text-center": 1})
                    .append("span")
                        .text(license.label);

                licenseGroup.append("div")
                    .classed({"row text-center license-label": 1})
                    .append("span")
                        .text("License");

                var languageContainer = llContainer.append("div")
                    .attr({
                        class: function() {
                            return "col-xs-" + (numberOfLanguages * 12 /
                                (numberOfLanguages + 1));
                        }
                    });

                _.forEach(languages, function(language) {
                    var languageGroup = languageContainer.append("div")
                        .attr({
                            class: function() {
                                return "col-xs-" + (12 / numberOfLanguages);
                            }
                        });

                    languageGroup.append("div")
                        .classed({"row text-center icon-sizer": 1})
                        .append("span")
                            .attr({ class:language.iconClass });

                    languageGroup.append("div")
                        .classed({"row text-center": 1})
                        .append("span")
                            .text(language.label);
                });

                languageContainer.append("div")
                    .classed({"row text-center language-label": 1})
                    .append("span")
                        .text("Languages");
            }

            function updateOS(datum) {

                var os = _.map(datum.os, function(s) {
                    return {
                        label: s,
                        iconClass: iconGenerator(_.find(iconList.os, { label: s}).src)
                    };
                }),
                numberOfOs = os.length;

                var osIconContainer = container.select(".os-icon-container");

                osIconContainer.selectAll("*").remove();

                _.forEach(os, function(system) {
                    var group = osIconContainer.append("div")
                        .attr({
                            class: function() {
                                return "col-xs-" + (12 / numberOfOs);
                            }
                        });

                    group.append("div")
                        .classed({"row text-center icon-sizer": 1})
                        .append("span")
                            .attr({
                                class: system.iconClass
                            });

                    group.append("div")
                        .classed({"row text-center": 1})
                        .append("span")
                            .text(system.label);

                });
            }
        });

    };

    info.dispatcher = function(value) {
        if (!arguments.length) return dispatcher;
        dispatcher = value;
        return info;
    };

    info.colorScheme = function(value) {
        if (!arguments.length) return colorScheme;
        colorScheme = value;
        return info;
    };

    info.regionAttribute = function(value) {
        if (!arguments.length) return regionAttribute;
        regionAttribute = value;
        return info;
    };

    info.iconList = function(value) {
        if (!arguments.length) return iconList;
        iconList = value;
        return info;
    };

    return info;
};