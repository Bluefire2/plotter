import {combineReducers} from 'redux';

import chartReducer from './chart_reducer';
import widthReducer from './width_reducer';
import heightReducer from './height_reducer';

const rootReducer = combineReducers({
    charts: chartReducer,
    chartWidth: widthReducer,
    chartHeight: heightReducer
});

export default rootReducer;