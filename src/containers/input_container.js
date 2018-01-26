import React, {Component} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {addChart, changeHeight, changeWidth} from '../actions/index';

class InputContainer extends Component {
    constructor(props) {
        super(props);
        this.state = {
            title: '',
            variablesText: '',
            rangeText: ''
        };
    }

    titleChange(e) {
        this.setState({
            title: e.target.value
        });
    }

    variablesChange(e) {
        this.setState({
            variablesText: e.target.value
        });
    }

    rangeChange(e) {
        this.setState({
            rangeText: e.target.value
        });
    }

    renderButtonClick() {
        // TODO: write proper error handling if the user enters invalid input
        const title = this.state.title,
            variablesText = this.state.variablesText,
            rangeText = this.state.rangeText;

        // helper methods
        const removeWhitespace = string => string.replace(/ /g, ''),
            stringToInt = string => +string;

        // parse out variables
        const variableLines = variablesText.split('\n'),
            variables = {};
        variableLines.forEach(elem => {
            const variableNameAndValue = elem.split('~').map(removeWhitespace),
                name = variableNameAndValue[0];

            variables[name] = variableNameAndValue[1];
        });

        // parse out range and domain
        const rangeValues = rangeText.split(',').map(removeWhitespace).map(stringToInt),
            [minX, maxX, minY, maxY] = rangeValues;

        this.props.addChart({
            title,
            variables,
            minX,
            maxX,
            minY,
            maxY
        });
    }

    render() {
        const placeholders = {
            title: 'My chart',
            variables: 'X~B(10, 0.3)',
            range: '0, 10, 0, 0.4'
        };
        return (
            <div id="input-container">
                <div className="form-group">
                    <label htmlFor="title-input">Title:</label>
                    <input id="title-input" className="form-control" type="text" placeholder={placeholders.title}
                           value={this.state.title}
                           onChange={this.titleChange.bind(this)}/>
                </div>
                <br/>
                <div className="form-group">
                    <label htmlFor="variable-input">Variables:</label>
                    <textarea id="variable-input" className="form-control" placeholder={placeholders.variables}
                              rows="5"
                              value={this.state.variablesText}
                              onChange={this.variablesChange.bind(this)}/>
                </div>
                <br/>
                <div className="form-group">
                    <label htmlFor="range-input">minX, maxX, minY, maxY:</label>
                    <input id="range-input" className="form-control" type="text" placeholder={placeholders.range}
                           value={this.state.range}
                           onChange={this.rangeChange.bind(this)}/>
                </div>
                <br/>
                <button className="btn" id="render-btn" onClick={this.renderButtonClick.bind(this)}>Render</button>
            </div>
        );
    }
}

const mapDispatchToProps = dispatch => {
    return bindActionCreators({
        addChart,
        changeHeight,
        changeWidth
    }, dispatch);
};

export default connect(null, mapDispatchToProps)(InputContainer);