;(function() {
    'use strict';
    window.pkgconfig = function(){
        return {
            regionAttribute: 'domain',
            filters: [],
            columns: {
                domain: {
                    src: 'Domain'
                },
                organization: {
                    src: 'Organization'
                },
                sectors: {
                    src: 'Organization Type',
                    label: 'Sectors',
                    load: function(d){
                        return d.split('+')
                            .map(function(d){ return d.trim(); });
                    }
                },
                numberOfOrganizations: {
                    src: 'Number of Orgs'
                },
                name: {
                    src: 'SOFTWARE',
                    test: function(d){ return d.name; }
                },
                projectName: {
                    src: 'PROJECT NAME',
                    label: 'Project'
                },
                language: {
                    src: 'LANG',
                    label: 'Language',
                    load: function(d){
                        var sep = [",", "+", "and"];
                        var env = d.trim()
                            .split(/,|\+| and /)
                            .map(function(d){ return d.trim(); })
                            .filter(function(d){
                                return d && d.length && sep.indexOf(d) === -1;
                            });

                        return env.length ? env : "Unknown";
                    }
                },
                license: {
                    src: 'LICENSE',
                    label: 'License'
                },
                os: {
                    src: 'OS',
                    label: 'Environment',
                    load: function(d) {
                        var sep = [",", "+", "and"];
                        var env = d.trim()
                            .split(/,|\+| and /)
                            .map(function(d){ return d.trim(); })
                            .filter(function(d){
                                return d && d.length && sep.indexOf(d) === -1;
                            });

                        return env.length ? env : "Unknown";
                    }
                },
                program: {
                    src: 'DHS Program'
                },
                startDate: {
                    src: 'Date of Release',
                    label: 'Release Date',
                    load: function(d) {
                        return new Date(d);
                    }
                },
                lastUpdate: {
                    src: 'Date of Last Update',
                    label: 'Last Update',
                    load: function(d) {
                        return new Date(d);
                    }
                },
                codeLocation: {
                    src: 'Source Code URL',
                    label: 'Code Location'
                }
            },
            icons: {
                os: {
                    windows: {
                        src: "windows7",
                        label: "Windows"
                    },
                    linux: {
                        src: "linux",
                        label: "Linux"
                    },
                    mac: {
                        src: "mac",
                        label: "Mac"
                    },
                    android: {
                        src: "android",
                        label: "Android"
                    }
                },
                license: {
                    apache: {
                        src: "apache",
                        label: "Apache 2.0"
                    },
                    bsd: {
                        src: "bsd",
                        label: "BSD"
                    },
                    geni: {
                        src: "geni",
                        label: "GENI"
                    },
                    gpl: {
                        src: "gpl",
                        label: "GPL"
                    },
                    jhu: {
                        src: "jhu",
                        label: "JHU/APL"
                    },
                    mit: {
                        src: "mit",
                        label: "MIT"
                    },
                    mozilla: {
                        src: "mozilla",
                        label: "Mozilla 2.0"
                    },
                    uiuc: {
                        src: "uiuc",
                        label: "UIUC"
                    },
                    usc: {
                        src: "usc",
                        label: "USC"
                    },
                    w3c: {
                        src: "w3c",
                        label: "W3C"
                    },
                },
                languages: {
                    python: {
                        src: "python",
                        label: "Python"
                    },
                    java: {
                        src: "java",
                        label: "Java"
                    },
                    ruby: {
                        src: "ruby",
                        label: "Ruby"
                    },
                    scala: {
                        src: "scala",
                        label: "Scala"
                    },
                    postgresql: {
                        src: "postgresql",
                        label: "PostgreSQL"
                    },
                    perl: {
                        src: "perl",
                        label: "Perl"
                    },
                    c: {
                        src: "c",
                        label: "C"
                    },
                    cpp: {
                        src: "c2",
                        label: "C++"
                    }
                }
            }
        };
    };
}).call(this);