'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.default = function (routes, props, options) {
  if (!__CLIENT__) {
    return null;
  }

  if (!options) {
    options = defaultClientOptions;
  } else {
    options = Object.assign(defaultClientOptions, options);
  }

  var store;
  if (options.redux) {
    _iso2.default.bootstrap(function (state, node) {
      var io = (0, _sailsIo2.default)(_socket2.default);
      //io.sails.url = 'http://dashboard.local';
      store = (0, _redux.createStore)((0, _redux.combineReducers)(_extends({}, options.redux.reducers, { routing: _reactRouterRedux.routerReducer })), state, (0, _redux.compose)((0, _redux.applyMiddleware)(_reduxThunk2.default), window.devToolsExtension ? window.devToolsExtension() : function (f) {
        return f;
      }));
      //keep server session in sync with store
      store.subscribe(function () {
        var storeState = store.getState();
        if (storeState) {
          io.socket.post('/api/session', { state: storeState }, function (body, JWR) {
            if (JWR.statusCode === 200) {} else {
              console.error('Failed to save session state: ', JWR.statusCode);
            }
          });
        }
      });
    });
  }

  var location = (0, _createLocation2.default)(document.location.pathname, document.location.search);
  var history = options.redux ? (0, _reactRouterRedux.syncHistoryWithStore)((0, _createBrowserHistory2.default)(), store) : (0, _createBrowserHistory2.default)();

  if (props && window.__ReactInitState__) {
    Object.assign(window.__ReactInitState__, props);
  }

  return (0, _.sailsReactRouter)(routes, location, history, { state: window.__ReactInitState__ }).then(function (component) {
    var renderComponents = void 0;

    if (options.redux && options.isomorphicStyleLoader) {
      renderComponents = _react2.default.createElement(
        _reactRedux.Provider,
        { store: store },
        _react2.default.createElement(
          _WithStylesContext2.default,
          { onInsertCss: function onInsertCss() {
              for (var _len = arguments.length, styles = Array(_len), _key = 0; _key < _len; _key++) {
                styles[_key] = arguments[_key];
              }

              return styles.forEach(function (style) {
                return style._insertCss();
              });
            }
          },
          component
        )
      );
    } else if (options.isomorphicStyleLoader) {
      renderComponents = _react2.default.createElement(
        _WithStylesContext2.default,
        { onInsertCss: function onInsertCss() {
            for (var _len2 = arguments.length, styles = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
              styles[_key2] = arguments[_key2];
            }

            return styles.forEach(function (style) {
              return style._insertCss();
            });
          }
        },
        component
      );
    } else if (options.redux) {
      renderComponents = _react2.default.createElement(
        _reactRedux.Provider,
        { store: store },
        component
      );
    } else {
      renderComponents = component;
    }

    if (!__DEBUG__) {
      delete window.__ReactInitState__;
    }

    return (0, _reactDom.render)(renderComponents, document.getElementById(options.reactRootElementId));
  }).catch(function (err) {
    throw err;
  });
};

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactDom = require('react-dom');

var _ = require('./');

var _createLocation = require('history/lib/createLocation');

var _createLocation2 = _interopRequireDefault(_createLocation);

var _createBrowserHistory = require('history/lib/createBrowserHistory');

var _createBrowserHistory2 = _interopRequireDefault(_createBrowserHistory);

var _WithStylesContext = require('./../components/WithStylesContext');

var _WithStylesContext2 = _interopRequireDefault(_WithStylesContext);

var _reactRedux = require('react-redux');

var _reactRouterRedux = require('react-router-redux');

var _redux = require('redux');

var _reduxThunk = require('redux-thunk');

var _reduxThunk2 = _interopRequireDefault(_reduxThunk);

var _socket = require('socket.io-client');

var _socket2 = _interopRequireDefault(_socket);

var _sailsIo = require('sails.io.js');

var _sailsIo2 = _interopRequireDefault(_sailsIo);

var _iso = require('iso');

var _iso2 = _interopRequireDefault(_iso);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var defaultClientOptions = {
  reactRootElementId: 'react-root',
  isomorphicStyleLoader: true,
  redux: false
};

/**
 * Render a route client side, uses document.location
 * @param routes your routes file
 * @param props additional props to mount
 * @param options router options, see client router options
 */
module.exports = exports['default'];