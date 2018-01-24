import React, {Component} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {addChart, changeHeight, changeWidth} from '../actions/index';

import VariableInput from '../components/variable_input';

class InputContainer extends Component {
    render() {
        const placeholderValue = "X~B(10, 0.3)";
        return (
            <div id="input-container">
                <VariableInput placeholder={placeholderValue}/><br/>
                <button className="btn" id="render-btn">Render</button>
            </div>
        );
    }
}

const mapStateToProps = state => {
    return {
        width: state.chartWidth,
        height: state.chartHeight
    };
};

const mapDispatchToProps = dispatch => {
    return bindActionCreators({
        addChart,
        changeHeight,
        changeWidth
    }, dispatch);
};

export default connect(mapStateToProps, mapDispatchToProps)(InputContainer);