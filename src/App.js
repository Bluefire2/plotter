import React, {Component} from 'react';
import {version} from '../package.json';
import './App.css';

import d3logo from './images/d3logo.svg';
import reactlogo from './images/reactlogo.svg';
import reduxlogo from './images/reduxlogo.svg';

import MadeWith from './components/madewith';

import InputContainer from './containers/input_container';
import ChartsContainer from './containers/charts_container';

class App extends Component {
    render() {
        const frameworkLogos = [
            {
                image: d3logo,
                href: 'https://d3js.org/'
            },
            {
                image: reactlogo,
                href: 'https://reactjs.org/'
            },
            {
                image: reduxlogo,
                href: 'https://redux.js.org/'
            }
        ];
        return (
            <div className="App">
                <header className="App-header">
                    <h1 className="App-title">Distribution chart plotter v{version}</h1>
                </header>
                <div id="content">
                    <div id="sidebar">
                        <div className="sidebar-header">
                            <h3>Add chart</h3>
                        </div>
                        <InputContainer/>
                    </div>
                    <ChartsContainer/>
                </div>
                <div id="bottom-right-corner">
                    <MadeWith logos={frameworkLogos}/>
                </div>
            </div>
        );
    }
}

export default App;
