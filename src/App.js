import React, {Component} from 'react';
import logo from './logo.svg';
import './App.css';

import Chart from './components/chart';

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
                       discreteVar={"B(10, 0.2)"}
                    />
            </div>
        );
    }
}

export default App;
