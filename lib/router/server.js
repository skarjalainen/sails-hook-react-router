'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

/**
 * Serve a rendered route to a client request - uses req.url
 * @param req
 * @param res
 */


exports.default = function (req, res) {
  if (!__SERVER__) {
    return;
  }

  var redux = sails.config[req.reactHookConfigKey].redux;
  var store;
  var result;

  if (redux) {
    var state = req.session && req.session.state ? req.session.state : {};
    store = (0, _redux.createStore)((0, _redux.combineReducers)(_extends({}, redux.reducers, { routing: _reactRouterRedux.routerReducer })), state, (0, _redux.applyMiddleware)(_reduxThunk2.default));
    //keep server session in sync with store
    store.subscribe(function () {
      var storeState = store.getState();
      if (storeState) {
        req.session.state = storeState;
      }
    });
  }

  var css = [];
  var location = (0, _createLocation2.default)(req.url);
  var routes = sails.hooks[req.reactHookConfigKey].__routesCompiled;
  var withStyles = sails.config[req.reactHookConfigKey].isomorphicStyleLoader;
  var history = redux ? (0, _reactRouterRedux.syncHistoryWithStore)((0, _createMemoryHistory2.default)(), store) : (0, _createMemoryHistory2.default)();
  var reactHtmlString = '';

  if (redux) {
    if (!req.session.state) {
      sails.log.info('Initial session state created');
      req.session.state = store.getState();
    } else {
      sails.log.info('Initial session state found');
    }
  }

  (0, _.sailsReactRouter)(routes, location, history, req, res).then(function (reactElement) {
    /* eslint consistent-return:0 */
    try {
      if (redux && withStyles) {
        reactHtmlString = (0, _server.renderToString)(_react2.default.createElement(
          _reactRedux.Provider,
          { store: store },
          _react2.default.createElement(
            _WithStylesContext2.default,
            { onInsertCss: function onInsertCss() {
                for (var _len = arguments.length, styles = Array(_len), _key = 0; _key < _len; _key++) {
                  styles[_key] = arguments[_key];
                }

                return styles.forEach(function (style) {
                  return css.push(style._getCss());
                });
              }
            },
            reactElement
          )
        ));
      } else if (withStyles) {
        // also extract inline css for insertion to page header.
        reactHtmlString = (0, _server.renderToString)(_react2.default.createElement(
          _WithStylesContext2.default,
          { onInsertCss: function onInsertCss() {
              for (var _len2 = arguments.length, styles = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
                styles[_key2] = arguments[_key2];
              }

              return styles.forEach(function (style) {
                return css.push(style._getCss());
              });
            }
          },
          reactElement
        ));
      } else if (redux) {
        reactHtmlString = (0, _server.renderToString)(_react2.default.createElement(
          _reactRedux.Provider,
          { store: store },
          reactElement
        ));
      } else {
        reactHtmlString = (0, _server.renderToString)(reactElement);
      }
    } catch (err) {
      return res.serverError(err);
    }

    // convert styles to string and attach to req object
    req.react.inlineStyles = css.join('');

    if (!req.react.title) {
      req.react.title = req.react.name;
    }

    if (req.react.state) {
      delete req.react.state.components;
      delete req.react.state.router;
      delete req.react.state.matchContext;
      delete req.react.state.history;
      req.react.state = JSON.stringify(req.react.state);
    }

    if (redux) {
      var iso = new _iso2.default();
      iso.add(reactHtmlString, store.getState());
      result = {
        locals: {
          react: req.react
        },
        body: iso.render()
      };
    } else {
      result = {
        locals: {
          react: req.react
        },
        body: reactHtmlString
      };
    }

    // add the sails res.view onto res if we don't have it
    // usually not there if it's a 'before' route.
    if (!res.view) {
      (0, _res2.default)(req, res, function () {
        res.view('layout', result);
      });
    } else {
      res.view('layout', result);
    }
  }).catch(function (err) {
    sails.log.error(err);
    res.serverError(err);
  });
};

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _ = require('./');

var _server = require('react-dom/server');

var _createLocation = require('history/lib/createLocation');

var _createLocation2 = _interopRequireDefault(_createLocation);

var _createMemoryHistory = require('history/lib/createMemoryHistory');

var _createMemoryHistory2 = _interopRequireDefault(_createMemoryHistory);

var _WithStylesContext = require('./../components/WithStylesContext');

var _WithStylesContext2 = _interopRequireDefault(_WithStylesContext);

var _res = require('sails/lib/hooks/views/res.view');

var _res2 = _interopRequireDefault(_res);

var _reactRedux = require('react-redux');

var _reactRouterRedux = require('react-router-redux');

var _redux = require('redux');

var _reduxThunk = require('redux-thunk');

var _reduxThunk2 = _interopRequireDefault(_reduxThunk);

var _iso = require('iso');

var _iso2 = _interopRequireDefault(_iso);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

module.exports = exports['default'];