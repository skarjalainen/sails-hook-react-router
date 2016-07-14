'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getRootComponent = getRootComponent;
exports.sailsReactRouter = sailsReactRouter;

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactRouter = require('react-router');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Returns the root component to use in rendering react-router.
 *    - Differs between client and server.
 * @param renderProps
 * @param routerElement
 * @returns {*}
 */
function getRootComponent(renderProps, routerElement) {
  if (__SERVER__) {
    return _react2.default.createElement(_reactRouter.RouterContext, renderProps);
  }
  return _react2.default.cloneElement(routerElement, renderProps);
}

/**
 * Internal router that is used on client and server.
 *    - Automatically merges on props / state from req.react
 * @param routes
 * @param location
 * @param history
 * @param reqOrProps
 * @param res
 * @returns {Promise}
 * @constructor
 */
function sailsReactRouter(routes, location, history, reqOrProps, res) {
  return new Promise(function (resolve, reject) {
    (0, _reactRouter.match)({ routes: routes, location: location, history: history }, function (error, redirectLocation, renderProps) {
      if (error) {
        return reject(error);
      }

      // if we're on the server and have a <Redirect/> location res.redirect to it.
      if (__SERVER__ && res && redirectLocation) {
        return res.redirect(302, redirectLocation.pathname + redirectLocation.search);
      }

      // no renderProps so no valid route - send 404 if on server
      if (__SERVER__ && !renderProps) {
        return res.notFound({ location: location });
      }

      if (renderProps) {
        renderProps.history = history;
      } else {
        renderProps = {};
      }

      // merge in any user props added onto req via polices and such.
      if (__SERVER__ && reqOrProps && reqOrProps.react && reqOrProps.react.props) {
        Object.assign(renderProps, reqOrProps.react.props);
      }

      // attach the final state onto reqOrProps.react for window.__ReactInitState__
      if (__SERVER__ && reqOrProps && reqOrProps.react) {
        reqOrProps.react.state = reqOrProps.react.props;
      }

      // client side check for window.__ReactInitState__;
      if (__CLIENT__ && reqOrProps && reqOrProps.state) {
        Object.assign(renderProps, reqOrProps.state || {});
      }

      return resolve(getRootComponent(renderProps, routes));
    });
  });
}