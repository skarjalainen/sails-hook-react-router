import React from 'react';
import { render } from 'react-dom';
import { sailsReactRouter } from './';
import createLocation from 'history/lib/createLocation';
import createBrowserHistory from 'history/lib/createBrowserHistory';
import WithStylesContext from './../components/WithStylesContext';
import { Provider } from 'react-redux';
import { routerReducer, syncHistoryWithStore } from 'react-router-redux';
import { createStore, combineReducers, applyMiddleware, compose } from 'redux';
import thunk from 'redux-thunk';
import socketIOClient from 'socket.io-client';
import sailsIOClient from 'sails.io.js';
import Iso from "iso";

const defaultClientOptions = {
  reactRootElementId: 'react-root',
  isomorphicStyleLoader: true,
  redux: false,
};

/**
 * Render a route client side, uses document.location
 * @param routes your routes file
 * @param props additional props to mount
 * @param options router options, see client router options
 */
export default function (routes, props, options) {
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
    Iso.bootstrap((state, node) => {
      let io = sailsIOClient(socketIOClient);
      //io.sails.url = 'http://dashboard.local';
      store = createStore(
        combineReducers({...options.redux.reducers, routing: routerReducer}),
        state,
        compose(
          applyMiddleware(thunk),
          window.devToolsExtension ? window.devToolsExtension() : f => f
        )
      );
      //keep server session in sync with store
      store.subscribe(() => {
        let storeState = store.getState();
        if (storeState) {
          io.socket.post('/api/session', { state: storeState }, (body, JWR) => {
            if (JWR.statusCode === 200) {
            } else {
              console.error('Failed to save session state: ', JWR.statusCode);
            }
          });
        }
      });
    });
  }

  const location = createLocation(document.location.pathname, document.location.search);
  const history = options.redux ?
                  syncHistoryWithStore(createBrowserHistory(), store) :
                  createBrowserHistory();

  if (props && window.__ReactInitState__) {
    Object.assign(window.__ReactInitState__, props);
  }

  return sailsReactRouter(routes, location, history, { state: window.__ReactInitState__ })
    .then((component) => {
      let renderComponents;

      if (options.redux && options.isomorphicStyleLoader) {
        renderComponents = (
          <Provider store={store}>
            <WithStylesContext onInsertCss={
              (...styles) => styles.forEach(style => style._insertCss()) }
            >
              {component}
            </WithStylesContext>
          </Provider>
        );
      } else if (options.isomorphicStyleLoader) {
        renderComponents = (
          <WithStylesContext onInsertCss={
            (...styles) => styles.forEach(style => style._insertCss()) }
          >
            {component}
          </WithStylesContext>
        );
      } else if (options.redux) {
        renderComponents = (
          <Provider store={store}>
            {component}
          </Provider>
        );
      } else {
        renderComponents = component;
      }

      if (!__DEBUG__) {
        delete window.__ReactInitState__;
      }

      return render(renderComponents, document.getElementById(options.reactRootElementId));
    })
    .catch((err) => {
      throw err;
    });
}
