import './index.scss';
import App from './App';
import React from 'react';
import ReactDOM from 'react-dom';
import reportWebVitals from './reportWebVitals';
import { doInit } from './actions/auth';
import { routerMiddleware } from 'connected-react-router';
import { createStore, applyMiddleware, compose } from 'redux';
import { Provider } from 'react-redux'
// import { ReduxThunk { from 'redux-thunk'
import * as serviceWorker from './serviceWorker';
import axios from 'axios';
import config from './config';
import baseURLConfig from './baseURLConfig';
import rootReducer from './reducers/index';
import { thunk } from 'redux-thunk';

const middlewareEnhancer = applyMiddleware(thunk)

const composeWithDevTools =
  window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose

const composedEnhancers = composeWithDevTools(middlewareEnhancer)

const store = createStore(rootReducer, composedEnhancers)

axios.defaults.baseURL = baseURLConfig();
axios.defaults.headers.common['Content-Type'] = "application/json";
const token = localStorage.getItem('token');
if (token) {
    axios.defaults.headers.common['Authorization'] = "Bearer " + token;
}

/*export const store = createStore(
  createRootReducer(history),
  compose(
    applyMiddleware(
      routerMiddleware(history),
      ReduxThunk
    ),
  )
);*/


// export const store = createStore(rootReducer);
store.dispatch(doInit());

ReactDOM.render(
    <Provider store={store}>
        <App/>
    </Provider>,
    document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
//reportWebVitals();
