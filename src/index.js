import React from 'react';
import ReactDOM from 'react-dom';
import {Provider} from 'react-redux';
import {createStore, applyMiddleware} from 'redux';

import reducers from './reducers';
import './index.css';
import App from './App';
import registerServiceWorker from './registerServiceWorker';

const initialState = {
    // sample chart for testing:
    charts: [
        {
            variables: {
                'X': 'B(10, 0.2)',
                'Y': 'B(10, 0.5)',
                'Z': 'B(10, 0.7)',
                'H': 'N(3, 5)',
                'I': 'N(6, 2)'
            },
            minX: 0,
            maxX: 10,
            minY: 0,
            maxY: 0.4
        },
        {
            variables: {
                'X': 'B(10, 0.2)',
                'Y': 'B(10, 0.5)',
                'Z': 'B(10, 0.7)',
                'H': 'N(3, 5)',
                'I': 'N(6, 2)'
            },
            minX: 0,
            maxX: 10,
            minY: 0,
            maxY: 0.4
        }
    ],
    chartWidth: 1000,
    chartHeight: 500
};

const createStoreWithMiddleware = applyMiddleware()(createStore);

ReactDOM.render(
    <Provider store={createStoreWithMiddleware(reducers, initialState)}>
        <App/>
    </Provider>
    , document.getElementById('root'));

registerServiceWorker();