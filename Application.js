
function Application() {
    'use strict';
    var self = this,
        $nop = null,
       pegjs = PEG;

    function createEditor(id, ro, fn) {
        if (self.editors[id])
            return;

        var ed = self.editors[id] = ace.edit(id);
        ed.setReadOnly(ro);

        if (fn) {
            fn(ed.getSession());
        }
    }

    //-----------------------------------------------------------------------//
    // Application Properties

    self.editors = {};

    Object.defineProperty(self, 'grammar', {
        get: function () {
            return localStorage.getItem('grammar') || "";
        },
        set: function (value) {
            localStorage.setItem('grammar', value);
        }
    });

    Object.defineProperty(self, 'message', {
        set: function (value) {
            $('#messages').text(value);
        }
    });

    Object.defineProperty(self, 'parser', {
        get: function () {
            self.message = "";
            try {
                return pegjs.buildParser(self.grammar);
            }
            catch (ex) {
                self.message = ex.message + ' [' + ex.line + ',' + ex.column + ']';
                return null;
            }
        }
    });

    //-----------------------------------------------------------------------//
    // Application Methods

    self.log = function () {
        if (location.hostname === 'localhost') {
            console.log.apply(console, arguments);
        }
    };

    self.onTabShown = function (event) {
        var tab = $(event.target).data('target');
        switch (tab) {
            case '#grammar': {
                createEditor('ed-grammar', false, function (session) {
                    session.on('change', function () {
                        self.grammar = session.getValue();
                        self.parser;
                    });

                    session.setValue(self.grammar);
                });


            } break;

            case '#testing': {
                createEditor('ed-test-in', false);
                createEditor('ed-test-out', false);
                createEditor('ed-test-tree', true, function (session) {

                });
            } break;

            case '#decoding': {
                createEditor('ed-decode-input', false);
                createEditor('ed-decode-output', true, function (session) {

                });
            } break;
        }
    };

    // Initialization & Bindings
    $('[data-toggle="tab"]').on('shown.bs.tab', self.onTabShown);
    self.log("Application::init() -> ready");
}

window.application = new Application();
