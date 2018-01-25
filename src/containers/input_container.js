import React, {Component} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {addChart, changeHeight, changeWidth} from '../actions/index';

class InputContainer extends Component {
    constructor(props) {
        super(props);
        this.state = {
            variablesText: '',
            title: ''
        };
    }

    textareaChange(e) {
        this.setState({
            variablesText: e.target.value
        });
    }

    titleChange(e) {
        this.setState({
            title: e.target.value
        });
    }

    renderButtonClick() {
        const text = this.state.variablesText,
            lines = text.split('\n'),
            variables = {},
            title = this.state.title;

        const removeWhitespace = string => {
            return string.replace(/ /g, '');
        };

        lines.forEach(elem => {
            const variableNameAndValue = elem.split('~').map(removeWhitespace),
                name = variableNameAndValue[0];

            variables[name] = variableNameAndValue[1];
        });

        this.props.addChart({
            title,
            variables,
            minX: 0,
            maxX: 10,
            minY: 0,
            maxY: 0.4
        });
    }

    render() {
        const placeholders = {
            variables: 'X~B(10, 0.3)',
            title: 'My chart'
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
                              onChange={this.textareaChange.bind(this)}/>
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