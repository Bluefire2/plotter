import {combineReducers} from 'redux';

import chartReducer from './chart_reducer';
import widthReducer from './width_reducer';
import heightReducer from './height_reducer';
import { reducer as formReducer } from 'redux-form';

const rootReducer = combineReducers({
    charts: chartReducer,
    chartWidth: widthReducer,
    chartHeight: heightReducer,
    form: formReducer
});

export default rootReducer;