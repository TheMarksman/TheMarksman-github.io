/*
    Main file interfacing between all the different visualization components.
 */

var VizGenerator = function() {
    var dispatch = d3.dispatch('drawDomain',
                               'drawTimeline',
                               'filterUpdate',
                               'mouseOverNode',
                               'mouseOutNode',
                               'selectedNode'),
        chartSelector,
        infoSelector,
        config,
        filters = {
            license: [],
            os: [],
            all: '',
            others: []
        },
        colorScheme = d3.scale.ordinal()
                        .domain(['Architecture',
                                 'Network Security',
                                 'Situational Awareness',
                                 'Forensics',
                                 'Framework',
                                 'Software Assurance'
                        ])
                        .range(['#4d6162',
                                '#0f7572',
                                '#779d9d',
                                '#223242',
                                '#666976',
                                '#bebec4']);

    var api = function(selection) {
        var domainBtn = d3.select('.btn-domain'),
            timelineBtn = d3.select('.btn-timeline'),
            clearFilterBtn = d3.select('.btn-clear-filter'),
            clearedFilter = _.cloneDeep(filters);

        var chart = Chart()
            .regionAttribute(config.regionAttribute)
            .colorScheme(colorScheme)
            .dispatcher(dispatch);

        var _vis = selection.select(chartSelector)
            .datum(selection.datum())
            .call(chart);

        var info = InfoPanel()
            .regionAttribute(config.regionAttribute)
            .iconList(config.icons)
            .colorScheme(colorScheme)
            .dispatcher(dispatch);

        var _infoPanel = selection.select(infoSelector)
            .datum(selection.datum())
            .call(info);

        $('.license-select').multiselect({
            nonSelectedText: 'License',
            buttonWidth: '140px',
            onChange: buttonFilterWrapper('license')
        });

        $('.os-select').multiselect({
          nonSelectedText: 'Operating System',
          buttonWidth: '150px',
          onChange: buttonFilterWrapper('os')
        });

        function buttonFilterWrapper(filterOn) {
            return function (option, isChecked) {
                var value = $(option).val();

                if (isChecked) {
                    filters[filterOn].push(value.toLowerCase());
                } else {
                    _.remove(filters[filterOn], function(filter) {
                        return filter === value.toLowerCase();
                    });
                }

                dispatch.filterUpdate(filters);
            };
        }

        var inputBox = d3.select('.input-keyword');

            var $input = $(inputBox.node());
            $input.typeahead({
                source: selection.datum(),
                afterSelect: inputFieldWrapper
            });

        inputBox.on('input', inputFieldWrapper);

        function inputFieldWrapper() {
            var val = inputBox.property('value').toLowerCase();

            filters.all = val;

            dispatch.filterUpdate(filters, 'all');
        }

        domainBtn.classed({'btn-primary': 1});

        domainBtn.on('click', function() {
            timelineBtn.classed({'btn-primary': 0});
            domainBtn.classed({'btn-primary': 1});
            dispatch.drawDomain();
        });

        timelineBtn.on('click', function() {
            timelineBtn.classed({'btn-primary': 1});
            domainBtn.classed({'btn-primary': 0});
            dispatch.drawTimeline();
        });

        clearFilterBtn.on('click', function() {
            filters = _.cloneDeep(clearedFilter);

            $('.input-keyword').val('');

            $('.os-select').multiselect('deselectAll', false);
            $('.os-select').multiselect('updateButtonText');

            $('.license-select').multiselect('deselectAll', false);
            $('.license-select').multiselect('updateButtonText');

            dispatch.filterUpdate(filters);
        });

        d3.selectAll(".node").on("click", function(d) {
            var hash =  "#" + _.kebabCase(d.name);


            if (location.hash === hash) {
                dispatch.selectedNode(d3.select(location.hash).data()[0]);
                location.hash = "#";
            } else {
                location.hash = hash;
                dispatch.selectedNode(d3.select(location.hash).data()[0]);
            }
        });


        var initialHashCheck = function() {
            if (location.hash && location.hash !== "#") {
                dispatch.selectedNode(d3.select(location.hash).data()[0]);
            }
        };

        d3.select(window).on("load", initialHashCheck);
    };

    api.config = function(value) {
        if (!arguments.length) return config;
        config = value;
        return api;
    };

    api.chartSelector = function(selector) {
        if (!arguments.length) return chartSelector;
        chartSelector = selector;
        return api;
    };

    api.infoSelector = function(selector) {
        if (!arguments.length) return infoSelector;
        infoSelector = selector;
        return api;
    };

    api.filters = function(value) {
        if (!arguments.length) return filters;
        filters = value;
        return api;
    };

    return api;
};