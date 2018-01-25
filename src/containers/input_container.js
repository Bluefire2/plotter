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

    renderButtonClick() {
        const text = this.state.variablesText,
            lines = text.split('\n'),
            variables = {};

        const removeWhitespace = string => {
            return string.replace(/ /g, '');
        };

        lines.forEach(elem => {
            const variableNameAndValue = elem.split('~').map(removeWhitespace),
                name = variableNameAndValue[0];

            variables[name] = variableNameAndValue[1];
        });

        this.props.addChart({
            variables,
            minX: 0,
            maxX: 10,
            minY: 0,
            maxY: 0.4
        });
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