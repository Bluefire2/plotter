import React, {Component} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {Field, reduxForm} from 'redux-form';
import {addChart} from '../actions/index';

const DEFAULT_DOMAIN = [0, 10, 0, 1];

class InputContainer extends Component {
    renderField(field) {
        const {meta: {touched, error}} = field,
            divClasses = `form-group${touched && error ? ' has-danger' : ''}`,
            baseInputClasses = `form-control${touched && error ? ' is-invalid' : ''}`,
            inputClasses = typeof field.classes === 'undefined' ? baseInputClasses : baseInputClasses + ' ' + field.classes;
        let input;
        if (field.type === 'textarea') {
            input = <textarea
                id={field.id}
                placeholder={field.placeholder}
                className={inputClasses}
                type={field.type}
                {...field.input}
            />;
        } else {
            input = <input
                id={field.id}
                placeholder={field.placeholder}
                className={inputClasses}
                type={field.type}
                {...field.input}
            />;
        }

        return (
            <div className={divClasses}>
                <label>{field.label}</label>
                {input}
                <div className="invalid-feedback">
                {touched ? error : ''}
                </div>
            </div>
        );
    }

    onSubmit(values) {
        const title = values.title,
            variables = parseOutVariables(values.variables),
            {minX, maxX, minY, maxY} = values.domain ? parseOutDomain(values.domain) : DEFAULT_DOMAIN;

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
        const {handleSubmit} = this.props;
        const placeholders = {
            title: 'My chart',
            variables: 'X~B(10, 0.3)\nY~Po(4)',
            domain: '0, 10, 0, 0.4'
        };
        return (
            <div id="input-container">
                <form onSubmit={handleSubmit(this.onSubmit.bind(this))}>
                    <Field
                        label="Title:"
                        name="title"
                        type="text"
                        placeholder={placeholders.title}
                        component={this.renderField}
                    />
                    <Field
                        label="Variables:"
                        name="variables"
                        type="textarea"
                        id="variable-input"
                        placeholder={placeholders.variables}
                        component={this.renderField}
                    />
                    <Field
                        label="minX, maxX, minY, maxY:"
                        name="domain"
                        type="text"
                        placeholder={placeholders.domain}
                        component={this.renderField}
                    />
                    <button type="submit" className="btn">Render</button>
                </form>
            </div>
        );
    }
}

// helper functions
const removeWhitespace = string => string.replace(/ /g, ''),
    stringToInt = string => +string,
    isInteger = data => typeof data === 'number' && (data % 1) === 0;

// create an error object structure
function errorObj(msg) {
    return {
        error: true,
        errorMsg: msg
    }
}

function parseOutVariables(text) {
    let error = false;
    const variables = {},
        lines = text.split('\n');

    lines.forEach(elem => {
        const variableNameAndValue = elem.split('~').map(removeWhitespace);

        if (variableNameAndValue.length !== 2 || variableNameAndValue[0].length === 0 || variableNameAndValue[1].length === 0) {
            error = true;
            return false; // break out of loop
        } else {
            const name = variableNameAndValue[0];
            variables[name] = variableNameAndValue[1];
        }
    });

    if (!error) {
        return variables;
    } else {
        return errorObj('Invalid variables')
    }
}

function parseOutDomain(text) {
    // parse out range and domain
    const rangeValues = text.split(',').map(removeWhitespace).map(stringToInt);

    if (rangeValues.length !== 4) {
        return errorObj('Please enter four values separated by commas');
    } else if (rangeValues.some(isNaN)) {
        // make sure all of the values are numbers
        return errorObj('Values must be numbers');
    }

    const [minX, maxX, minY, maxY] = rangeValues;

    if ([minX, maxX].some(elem => !isInteger(elem))) {
        return errorObj('X values must be integers');
    } else if([minY, maxY].some(elem => elem < 0 || elem > 1)) {
        return errorObj('Y range must be between 0 and 1');
    }

    return {minX, maxX, minY, maxY};
}

function validate(values) {
    const errors = {};

    if (!values.variables) {
        errors.variables = "You must enter at least one variable"
    } else {
        const parsedVars = parseOutVariables(values.variables);
        if (parsedVars.error) {
            errors.variables = parsedVars.errorMsg;
        }
    }

    if(values.domain) {
        const parsedDomain = parseOutDomain(values.domain);
        if (parsedDomain.error) {
            errors.domain = parsedDomain.errorMsg;
        }
    }

    return errors;
}

const form = reduxForm({
    validate,
    form: 'NewChartForm'
})(InputContainer);

const mapDispatchToProps = dispatch => {
    return bindActionCreators({
        addChart
    }, dispatch);
};

export default connect(null, mapDispatchToProps)(form);