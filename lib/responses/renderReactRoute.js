'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = renderReactRouteResponse;

var _router = require('./../router');

/**
 * Returns a sails response so res.renderServerResponse can be used in policies
 * and controllers.
 * @param req
 * @param res
 * @returns {Function}
 * @private
 */
function renderReactRouteResponse(req, res) {
  return function response(props, routeOverride) {
    if (routeOverride) {
      req.url = routeOverride;
    }

    if (props) {
      Object.assign(req.react.props, props);
    }

    return (0, _router.serverRouter)(req, res);
  };
}
module.exports = exports['default'];