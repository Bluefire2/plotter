import React, {Component} from 'react';
import './App.css';

import InputContainer from './containers/input_container';
import ChartsContainer from './containers/charts_container';

class App extends Component {
    render() {
        return (
            <div className="App">
                <header className="App-header">
                    <h1 className="App-title">Chart renderer</h1>
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
            </div>
        );
    }
}

export default App;
