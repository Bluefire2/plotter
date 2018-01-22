import React, {Component} from 'react';
import logo from './logo.svg';
import './App.css';

import Chart from './components/chart';

const variablesTest = {
    'X': 'B(10, 0.2)',
    'Y': 'B(10, 0.5)',
    'Z': 'B(10, 0.7)',
    'H': 'N(3, 5)',
    'I': 'N(5, 2)'
};

class App extends Component {
    render() {
        return (
            <div className="App">
                <header className="App-header">
                    <img src={logo} className="App-logo" alt="logo"/>
                    <h1 className="App-title">Welcome to React</h1>
                </header>
                <p className="App-intro">
                    To get started, edit <code>src/App.js</code> and save to reload.
                </p>
                <Chart width={1000} height={500}
                       maxY={0.4}
                       variables={variablesTest}
                    />
            </div>
        );
    }
}

export default App;
