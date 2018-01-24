import React, {Component} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {addChart, changeHeight, changeWidth} from '../actions/index';

class InputContainer extends Component {
    constructor(props) {
        super(props);
        this.state = {
            variablesText: ""
        };
    }

    textareaChangeHandler(e) {
        this.setState({
            variablesText: e.target.value
        });
    }

    renderButtonClick(e) {
        // TODO: write the handler
    }

    render() {
        const placeholderValue = "X~B(10, 0.3)";
        return (
            <div id="input-container">
                <textarea id="variable-input" placeholder={placeholderValue}
                          value={this.state.variablesText}
                          onChange={this.textareaChangeHandler.bind(this)}/>
                <br/>
                <button className="btn" id="render-btn" onClick={this.renderButtonClick.bind(this)}>Render</button>
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