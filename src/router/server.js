import React from 'react';
import { sailsReactRouter } from './';
import { renderToString } from 'react-dom/server';
import createLocation from 'history/lib/createLocation';
import createMemoryHistory from 'history/lib/createMemoryHistory';
import WithStylesContext from './../components/WithStylesContext';
import addResView from 'sails/lib/hooks/views/res.view';
import { Provider } from 'react-redux';
import { syncHistoryWithStore, routerReducer } from 'react-router-redux';
import { createStore, combineReducers, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import Iso from "iso";

/**
 * Serve a rendered route to a client request - uses req.url
 * @param req
 * @param res
 */
export default function (req, res) {
  if (!__SERVER__) {
    return;
  }

  const redux = sails.config[req.reactHookConfigKey].redux;
  var store;
  var result;

  if (redux) {
    let state = (req.session && req.session.state) ? req.session.state : {};
    store = createStore(
      combineReducers({...redux.reducers, routing: routerReducer}),
      state,
      applyMiddleware(thunk)
    );
    //keep server session in sync with store
    store.subscribe(() => {
      let storeState = store.getState();
      if (storeState) {
        req.session.state = storeState;
      }
    });
  }

  const css = [];
  const location = createLocation(req.url);
  const routes = sails.hooks[req.reactHookConfigKey].__routesCompiled;
  const withStyles = sails.config[req.reactHookConfigKey].isomorphicStyleLoader;
  const history = redux ?
                  syncHistoryWithStore(createMemoryHistory(), store) :
                  createMemoryHistory();
  let reactHtmlString = '';

  if (redux) {
    if (!req.session.state) {
      sails.log.info('Initial session state created');
      req.session.state = store.getState();
    } else {
      sails.log.info('Initial session state found');
    }
  }

  sailsReactRouter(
    routes,
    location,
    history,
    req,
    res
  ).then((reactElement) => { /* eslint consistent-return:0 */
    try {
      if (redux && withStyles) {
        reactHtmlString = renderToString(
          <Provider store={store}>
            <WithStylesContext onInsertCss={
              (...styles) => styles.forEach(style => css.push(style._getCss()))}
            >
              {reactElement}
            </WithStylesContext>
          </Provider>
        );
      } else if (withStyles) {
        // also extract inline css for insertion to page header.
        reactHtmlString = renderToString(
          <WithStylesContext onInsertCss={
            (...styles) => styles.forEach(style => css.push(style._getCss()))}
          >
            {reactElement}
          </WithStylesContext>
        );
      } else if (redux) {
        reactHtmlString = renderToString(
          <Provider store={store}>
            {reactElement}
          </Provider>
        );
      } else {
        reactHtmlString = renderToString(reactElement);
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
      var iso = new Iso();
      iso.add(reactHtmlString, store.getState());
      result = {
        locals: {
          react: req.react,
        },
        body: iso.render(),
      };
    } else {
      result = {
        locals: {
          react: req.react,
        },
        body: reactHtmlString,
      };
    }

    // add the sails res.view onto res if we don't have it
    // usually not there if it's a 'before' route.
    if (!res.view) {
      addResView(req, res, () => {
        res.view('layout', result);
      });
    } else {
      res.view('layout', result);
    }
  }).catch((err) => {
    sails.log.error(err);
    res.serverError(err);
  });
}
